// story-loop.jsx — QA Lens silent looping story animation.
//
// Sequence (loops forever, no audio):
//   1. CI red build         — "Build #842 — FAILED · 17 tests failed"
//   2. Messy report         — auto-scrolling raw HTML test report
//   3. Lens transition      — QA Lens mark scans over the noise
//   4. 17 failures          — QA Lens surfaces the raw count
//   5. → 3 incidents        — failures cluster into 3 groups
//   6. Open one incident    — zoom into a single incident
//   7. Fix First            — ranked priority list
//   8. Clean dashboard      — all green, build passed
//
// All UI is original. Nothing here imitates a specific CI vendor.

// ─── Timing ──────────────────────────────────────────────────────────────────
// Slow, deliberate pace — each beat has time to read.
const STORY = {
  ci:       [0.0,  4.4],   // CI fails — let the FAIL banner land
  messy:    [4.0,  8.8],   // scrolling report — long enough to feel overwhelming
  lens:     [8.4, 10.4],   // lens scan transition
  count17:  [10.0,13.4],   // "17 failures" — let the count + tiles read
  group3:   [13.0,16.8],   // tiles fly into 3 clusters
  openInc:  [16.4,20.4],   // incident detail — most info-dense, longest dwell
  fixFirst: [20.0,23.4],   // Fix First ranked list
  clean:    [23.0,26.4],   // clean dashboard — hold the resolution
};
const STORY_TOTAL = 26.8;

// ─── Palette (matches existing QA Lens) ──────────────────────────────────────
const C = {
  bg:         'transparent',
  panel:      '#ffffff',
  panelDark:  '#0b1530',
  border:     '#e2e8f0',
  borderStrong:'#cbd5e1',
  text:       '#0b1530',
  textMuted:  '#64748b',
  textFaint:  '#94a3b8',
  accent:     '#4f46e5',
  accentTint: '#eef2ff',
  accentInk:  '#3730a3',
  danger:     '#e11d48',
  dangerTint: '#fff1f2',
  dangerInk:  '#9f1239',
  dangerSoft: '#fee2e2',
  warning:    '#f59e0b',
  warningTint:'#fff7ed',
  warningInk: '#9a3412',
  success:    '#10b981',
  successTint:'#ecfdf5',
  successInk: '#047857',
};

// ─── Scene-fade wrapper ──────────────────────────────────────────────────────
function SceneFade({ range, time, fade = 0.35, children }) {
  const [s, e] = range;
  if (time < s - fade || time > e + fade) return null;
  let opacity;
  if (time < s)      opacity = (time - (s - fade)) / fade;
  else if (time > e) opacity = ((e + fade) - time) / fade;
  else               opacity = 1;
  opacity = clamp(opacity, 0, 1);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity }}>
      {children}
    </div>
  );
}

// Hook: time relative to a scene window
function useSceneTime(range, time) {
  const [s, e] = range;
  const local = clamp(time - s, 0, e - s);
  const u = (e - s) > 0 ? local / (e - s) : 0;
  return { t: local, u, dur: e - s };
}

// ─── Background grid (subtle, used on QA Lens scenes) ────────────────────────
function BG() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      pointerEvents: 'none',
    }}/>
  );
}

// ─── Generic window chrome ───────────────────────────────────────────────────
function WindowChrome({ title, subtitle, accent = C.textFaint, children, badge, style }) {
  return (
    <div style={{
      position: 'absolute',
      left: 80, top: 70, right: 80, bottom: 70,
      background: C.panel,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      boxShadow: '0 20px 60px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.04)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      ...style,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 18px',
        borderBottom: `1px solid ${C.border}`,
        background: '#fcfcfd',
        flexShrink: 0,
      }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: '#ff5f57' }}/>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: '#febc2e' }}/>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: '#28c840' }}/>
        <div style={{
          flex: 1, marginLeft: 12,
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 12, color: C.textMuted,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: accent }}/>
          <span>{title}</span>
          {subtitle && (
            <>
              <span style={{ color: C.textFaint }}>·</span>
              <span style={{ color: C.textFaint }}>{subtitle}</span>
            </>
          )}
        </div>
        {badge}
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE 1 — CI red build
// ═════════════════════════════════════════════════════════════════════════════
function CIRedScene({ time }) {
  const { t, u } = useSceneTime(STORY.ci, time);

  // Job step list — steps tick green one by one, last one fails red.
  const STEPS = [
    { name: 'Checkout repo',     dur: '4s'  },
    { name: 'Install deps',      dur: '38s' },
    { name: 'Build artifact',    dur: '1m 12s' },
    { name: 'Unit tests',        dur: '46s' },
    { name: 'e2e tests',         dur: '4m 11s', fail: true },
  ];
  const stepReveal = (i) => Easing.easeOutCubic(clamp((t - 0.15 - i * 0.18) / 0.4, 0, 1));
  const stepStatus = (i, step) => {
    const reveal = stepReveal(i);
    if (reveal < 0.6) return 'running';
    if (step.fail && t > 1.1) return 'fail';
    if (step.fail) return 'running';
    return 'ok';
  };
  const failBannerOpacity = Easing.easeOutCubic(clamp((t - 1.2) / 0.4, 0, 1));
  const failedCount = Math.round(17 * Easing.easeOutCubic(clamp((t - 1.4) / 0.5, 0, 1)));

  return (
    <WindowChrome
      title="ci.runner"
      subtitle="main · ce7a9f2 · build #842"
      accent={C.danger}
      badge={
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11, color: C.textFaint,
        }}>03:21 ago</span>
      }
    >
      {/* FAIL banner */}
      <div style={{
        background: C.danger,
        color: '#fff',
        padding: '14px 22px',
        display: 'flex', alignItems: 'center', gap: 14,
        opacity: failBannerOpacity,
        transform: `translateY(${(1 - failBannerOpacity) * -8}px)`,
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2"/>
          <path d="M8 8 L16 16 M16 8 L8 16" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>
            Build #842 — FAILED
          </div>
          <div style={{ fontSize: 12.5, opacity: 0.85, fontFamily: 'JetBrains Mono, monospace' }}>
            {failedCount} tests failed · 1,267 passed · 6m 51s wall-clock
          </div>
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{
          fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
          padding: '5px 10px',
          background: 'rgba(255,255,255,0.18)',
          borderRadius: 6,
        }}>FAILED</div>
      </div>

      {/* Body — job steps */}
      <div style={{ padding: '24px 36px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11, letterSpacing: '0.06em',
          color: C.textFaint, marginBottom: 10,
        }}>WORKFLOW · pull_request</div>
        {STEPS.map((s, i) => {
          const reveal = stepReveal(i);
          const status = stepStatus(i, s);
          return (
            <div key={s.name} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 14px',
              borderRadius: 8,
              background: status === 'fail' ? C.dangerTint : '#fafbfc',
              border: `1px solid ${status === 'fail' ? '#fecaca' : C.border}`,
              opacity: 0.2 + 0.8 * reveal,
              transform: `translateX(${(1 - reveal) * -10}px)`,
            }}>
              <StepIcon status={status} time={time}/>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 13, fontWeight: 600,
                  color: status === 'fail' ? C.dangerInk : C.text,
                }}>{s.name}</div>
                {status === 'fail' && (
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11, color: C.dangerInk,
                    marginTop: 3, opacity: failBannerOpacity,
                  }}>
                    Process completed with exit code 1 · 17 failing specs
                  </div>
                )}
              </div>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11.5,
                color: status === 'fail' ? C.dangerInk : C.textMuted,
              }}>{s.dur}</span>
            </div>
          );
        })}
        <div style={{
          marginTop: 18, paddingTop: 14,
          borderTop: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, color: C.textFaint, letterSpacing: '0.04em',
          }}>ARTIFACTS</span>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12, color: C.textMuted,
            padding: '4px 10px',
            background: '#f1f5f9',
            border: `1px solid ${C.border}`,
            borderRadius: 6,
          }}>test-report.html · 2.4 MB</span>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12, color: C.textMuted,
            padding: '4px 10px',
            background: '#f1f5f9',
            border: `1px solid ${C.border}`,
            borderRadius: 6,
          }}>junit.xml · 814 KB</span>
        </div>
      </div>
    </WindowChrome>
  );
}

function StepIcon({ status, time }) {
  const sz = 22;
  if (status === 'ok') return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill={C.success}/>
      <path d="M7.5 12.5 L10.5 15.5 L16.5 9" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
  if (status === 'fail') return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill={C.danger}/>
      <path d="M8.5 8.5 L15.5 15.5 M15.5 8.5 L8.5 15.5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
  // running — spinning ring
  const spin = (time * 360) % 360;
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none"
         style={{ transform: `rotate(${spin}deg)` }}>
      <circle cx="12" cy="12" r="9" stroke={C.border} strokeWidth="2"/>
      <path d="M12 3 a9 9 0 0 1 9 9" stroke={C.accent} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE 2 — Messy auto-scrolling test report
// ═════════════════════════════════════════════════════════════════════════════
const MESSY_LINES = (() => {
  const tests = [
    { name: 'checkout.PaymentSpec › declines 3DS retry on stale token',
      stack: [
        '  TimeoutError: waitForSelector(#card-3ds-retry) exceeded 10000ms',
        '    at Page.waitForSelector (node_modules/playwright/lib/page.js:1244:13)',
        '    at PaymentSpec.<anonymous> (test/checkout.payment.spec.js:142:7)',
        '    at processImmediate (internal/timers.js:464:21)',
      ],
      suite: 'checkout', dur: '12.41s', owner: 'payments-team',
    },
    { name: 'checkout.PaymentSpec › 3DS step-up redirect flow',
      stack: [
        '  TimeoutError: waitForSelector(.step-up-frame) exceeded 10000ms',
        '    at Page.waitForSelector (node_modules/playwright/lib/page.js:1244:13)',
        '    at PaymentSpec.<anonymous> (test/checkout.payment.spec.js:198:7)',
      ],
      suite: 'checkout', dur: '11.07s', owner: 'payments-team',
    },
    { name: 'auth.SessionSpec › token refresh after idle',
      stack: [
        '  Error: ECONNREFUSED 127.0.0.1:4242',
        '    at TCPConnectWrap.afterConnect (net.js:1146:16)',
        '    at TCP.<anonymous> (node:internal/async_hooks:130:17)',
      ],
      suite: 'auth', dur: '4.81s', owner: 'platform',
    },
    { name: 'billing.InvoiceSpec › proration on annual plan',
      stack: [
        '  Error: ECONNREFUSED 127.0.0.1:4242',
        '    at TCPConnectWrap.afterConnect (net.js:1146:16)',
        '    at TCP.<anonymous> (node:internal/async_hooks:130:17)',
        '    at InvoiceSpec.<anonymous> (test/billing.invoice.spec.js:88:9)',
      ],
      suite: 'billing', dur: '5.22s', owner: 'billing-team',
    },
    { name: 'search.RankingSpec › boost decay on stale index',
      stack: [
        '  AssertionError: snapshot diff at "results[3].score"',
        '    expected 0.842, received 0.917',
        '    at RankingSpec.<anonymous> (test/search.ranking.spec.js:213:5)',
      ],
      suite: 'search', dur: '3.10s', owner: 'search-team',
    },
    { name: 'checkout.PaymentSpec › apple pay tokenization',
      stack: [
        '  TimeoutError: waitForSelector(#applepay-sheet) exceeded 10000ms',
        '    at Page.waitForSelector (node_modules/playwright/lib/page.js:1244:13)',
      ],
      suite: 'checkout', dur: '10.95s', owner: 'payments-team',
    },
    { name: 'api.RateLimitSpec › burst window reset',
      stack: [
        '  AssertionError: snapshot diff at "headers.x-ratelimit"',
        '    expected "59", received "60"',
      ],
      suite: 'api', dur: '0.94s', owner: 'platform',
    },
  ];
  return tests;
})();

function MessyReportScene({ time }) {
  const { t, dur } = useSceneTime(STORY.messy, time);
  // Auto-scroll: covers the full scene window so it scrolls steadily.
  const scrollProgress = Easing.easeInQuad(clamp(t / (dur - 0.4), 0, 1));
  const scrollY = scrollProgress * 1200;

  return (
    <WindowChrome
      title="test-report.html"
      subtitle="2.4 MB · file:///tmp/artifacts/test-report.html"
      accent={C.danger}
      badge={
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11, color: C.textFaint,
        }}>17 failing</span>
      }
    >
      {/* Report toolbar */}
      <div style={{
        padding: '10px 22px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 14,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5,
        color: C.textMuted,
        background: '#fafbfc',
        flexShrink: 0,
      }}>
        <span style={{ fontWeight: 700, color: C.text, letterSpacing: '0.04em' }}>TEST REPORT</span>
        <span>·</span>
        <span>Generated 03:21 ago</span>
        <span style={{ flex: 1 }}/>
        <span style={{ color: C.dangerInk, fontWeight: 600 }}>✗ 17</span>
        <span style={{ color: C.successInk }}>✓ 1267</span>
        <span style={{ color: C.warningInk }}>~ 4 skipped</span>
      </div>

      {/* Scrolling content */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#fbfbfd' }}>
        <div style={{
          position: 'absolute', left: 0, right: 24, top: 0,
          padding: '18px 28px',
          transform: `translateY(${-scrollY}px)`,
        }}>
          {/* Duplicate the test list 3x to make scroll feel endless */}
          {[0, 1, 2].map((rep) => MESSY_LINES.map((tt, idx) => (
            <MessyFailureRow key={`${rep}-${idx}`} test={tt} index={rep * MESSY_LINES.length + idx}/>
          )))}
        </div>

        {/* Right scrollbar */}
        <div style={{
          position: 'absolute', right: 6, top: 6, bottom: 6, width: 6,
          background: 'rgba(15,23,42,0.04)', borderRadius: 3,
        }}>
          <div style={{
            position: 'absolute', left: 0, right: 0,
            top: `${scrollProgress * 75}%`,
            height: '14%',
            background: C.borderStrong, borderRadius: 3,
          }}/>
        </div>

        {/* Overwhelm vignette */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 12%, rgba(255,255,255,0) 88%, rgba(255,255,255,0.85) 100%)',
          pointerEvents: 'none',
        }}/>
      </div>
    </WindowChrome>
  );
}

function MessyFailureRow({ test, index }) {
  return (
    <div style={{
      marginBottom: 18,
      paddingBottom: 14,
      borderBottom: `1px dashed ${C.border}`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 6,
      }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11, color: C.textFaint, minWidth: 32,
        }}>#{String(index + 1).padStart(3, '0')}</span>
        <span style={{
          fontSize: 14, fontWeight: 700, color: C.danger,
          fontFamily: 'JetBrains Mono, monospace',
        }}>✗</span>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 13, fontWeight: 600, color: C.text,
        }}>{test.name}</span>
      </div>
      <div style={{
        background: '#fff',
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        padding: '8px 12px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11.5, lineHeight: 1.55,
        color: C.textMuted,
      }}>
        {test.stack.map((line, i) => (
          <div key={i} style={{
            color: i === 0 ? C.dangerInk : C.textMuted,
            whiteSpace: 'pre',
          }}>{line}</div>
        ))}
      </div>
      <div style={{
        marginTop: 5,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5,
        color: C.textFaint,
        display: 'flex', gap: 14,
      }}>
        <span>suite: {test.suite}</span>
        <span>duration: {test.dur}</span>
        <span>owner: {test.owner}</span>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE 3 — Lens transition
// ═════════════════════════════════════════════════════════════════════════════
function LensTransition({ time }) {
  const { u } = useSceneTime(STORY.lens, time);
  const innerOpacity = u < 0.5
    ? Easing.easeOutCubic(u / 0.5)
    : 1 - Easing.easeInCubic((u - 0.5) / 0.5);
  // "With" slides in slightly before "QA Lens"
  const withReveal = Easing.easeOutCubic(clamp(u / 0.35, 0, 1));
  const nameReveal = Easing.easeOutCubic(clamp((u - 0.25) / 0.4, 0, 1));

  return (
    <div style={{ position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `radial-gradient(circle at 50% 50%, #dbeafe 0%, ${C.bg} 65%)`,
    }}>
      {/* Faded messy text leaking through from the prior scene */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: 0.05,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
        color: C.text, padding: 40,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}>
        {Array.from({ length: 70 }).map((_, i) => (
          <div key={i}>✗ {MESSY_LINES[i % MESSY_LINES.length].name}</div>
        ))}
      </div>

      {/* Wordmark headline: "With QA Lens" */}
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 18,
        opacity: innerOpacity,
      }}>
        <span style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 56, fontWeight: 500, color: C.textMuted,
          letterSpacing: '-0.02em',
          opacity: withReveal,
          transform: `translateY(${(1 - withReveal) * 12}px)`,
        }}>With</span>
        <span style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 72, fontWeight: 700, color: '#1e40af',
          letterSpacing: '-0.03em',
          opacity: nameReveal,
          transform: `translateY(${(1 - nameReveal) * 14}px)`,
        }}>QA Lens</span>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// QA Lens app chrome (scenes 4–8)
// ═════════════════════════════════════════════════════════════════════════════
function QALensChrome({ activeNav = 'Runs', children, time }) {
  const NAV = ['Fix First', 'Runs', 'Compare', 'Incidents', 'Flaky', 'Ask'];
  return (
    <div style={{
      position: 'absolute',
      left: 70, top: 60, right: 70, bottom: 60,
      background: C.panel,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      boxShadow: '0 20px 60px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.04)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Topbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 18px',
        borderBottom: `1px solid ${C.border}`,
        background: '#fcfcfd', flexShrink: 0,
      }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: '#ff5f57' }}/>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: '#febc2e' }}/>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: '#28c840' }}/>
        <div style={{
          flex: 1, marginLeft: 12,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 12, color: C.textMuted,
        }}>qalens · localhost:8080 · main</div>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11, color: C.textFaint,
        }}>v0.4.2</span>
      </div>

      {/* App nav */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 24,
        padding: '0 22px', height: 50,
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          fontWeight: 700, color: '#1e40af', fontSize: 15, letterSpacing: '-0.015em',
        }}>
          QA Lens
        </div>
        <div style={{ width: 1, height: 18, background: C.border }}/>
        {NAV.map(n => {
          const active = n === activeNav;
          return (
            <div key={n} style={{
              fontSize: 13,
              color: active ? C.accent : C.textMuted,
              fontWeight: active ? 600 : 400,
              position: 'relative',
              paddingBottom: 2,
              borderBottom: active ? `2px solid ${C.accent}` : '2px solid transparent',
            }}>{n}</div>
          );
        })}
        <div style={{ flex: 1 }}/>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11.5, color: C.textFaint,
        }}>run #842 · just now</span>
        <div style={{
          width: 24, height: 24, borderRadius: 999,
          background: C.accentTint, color: C.accentInk,
          fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>AP</div>
      </div>

      <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Failure → incident assignments (shared between scenes 4 and 5)
// ═════════════════════════════════════════════════════════════════════════════
const INCIDENTS = [
  {
    id: 'IC-1042',
    label: 'TimeoutError: waitForSelector',
    msg:   'Page.waitForSelector exceeded 10000ms',
    fingerprint: 'a4b2:3DSRetry.handle@payment.spec',
    count: 7,
    suite: 'checkout',
    color: C.danger,
  },
  {
    id: 'IC-1043',
    label: 'ECONNREFUSED at stripe-mock:4242',
    msg:   'TCPConnectWrap.afterConnect ECONNREFUSED 127.0.0.1:4242',
    fingerprint: '8f01:tcp.connect@billing.invoice',
    count: 5,
    suite: 'billing · auth',
    color: C.warning,
  },
  {
    id: 'IC-1044',
    label: 'AssertionError on snapshot diff',
    msg:   'expected 0.842 to equal 0.917 at "results[3].score"',
    fingerprint: 'd71c:snapshot.diff@search.ranking',
    count: 5,
    suite: 'search · api',
    color: C.accent,
  },
];
// 17 failures, each tagged with which incident they belong to.
const FAILURES = (() => {
  const out = [];
  let id = 0;
  INCIDENTS.forEach((inc, ix) => {
    for (let i = 0; i < inc.count; i++) {
      out.push({ id: id++, incident: ix, color: inc.color });
    }
  });
  return out; // 17 entries
})();

// Grid coordinates for the 17 tiles in "raw" layout (scene 4) — 6 cols × 3 rows.
function rawTileXY(i) {
  const cols = 6;
  const col = i % cols;
  const row = Math.floor(i / cols);
  return { col, row };
}

// Cluster anchor positions for scene 5 (relative to canvas, in pixels)
function clusterAnchor(incidentIdx) {
  const positions = [
    { x: 240, y: 80 },
    { x: 510, y: 80 },
    { x: 780, y: 80 },
  ];
  return positions[incidentIdx];
}
// Tile slots within a cluster — small 3×3 grid for up to 7 tiles
function clusterSlotXY(slotIdx, total) {
  const cols = Math.min(4, total);
  const col = slotIdx % cols;
  const row = Math.floor(slotIdx / cols);
  return { col, row };
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE 4 — 17 failures
// ═════════════════════════════════════════════════════════════════════════════
function Count17Scene({ time }) {
  const { t, u } = useSceneTime(STORY.count17, time);
  const number = Math.round(17 * Easing.easeOutCubic(clamp(t / 0.9, 0, 1)));
  const tileReveal = (i) => Easing.easeOutCubic(clamp((t - 0.5 - i * 0.04) / 0.4, 0, 1));

  return (
    <QALensChrome activeNav="Runs" time={time}>
      <div style={{ padding: '28px 36px', position: 'relative', height: '100%' }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
          color: C.dangerInk, letterSpacing: '0.06em', marginBottom: 6,
        }}>RUN #842 · MAIN · 3 MIN AGO</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 22 }}>
          <div style={{
            fontSize: 96, fontWeight: 700, color: C.danger,
            letterSpacing: '-0.04em', lineHeight: 0.9,
            fontFamily: 'JetBrains Mono, monospace',
            fontVariantNumeric: 'tabular-nums',
          }}>{number}</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 650, color: C.text, letterSpacing: '-0.015em' }}>
              failures detected
            </div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
              parsed from <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>test-report.html</span>
              {' '}+ <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>junit.xml</span>
            </div>
          </div>
          <div style={{ flex: 1 }}/>
          <div style={{
            display: 'flex', gap: 10,
            opacity: Easing.easeOutCubic(clamp((t - 1.0) / 0.4, 0, 1)),
          }}>
            <Stat label="passed"  value="1,267" color={C.successInk}/>
            <Stat label="skipped" value="4"     color={C.warningInk}/>
            <Stat label="total"   value="1,288" color={C.text}/>
          </div>
        </div>

        {/* Tile grid — 17 failures laid out raw */}
        <div style={{ position: 'relative', height: 320, marginTop: 18 }}>
          {FAILURES.map((f, i) => {
            const { col, row } = rawTileXY(i);
            const reveal = tileReveal(i);
            return (
              <FailureTile key={i}
                x={col * 168}
                y={row * 92}
                w={150}
                h={70}
                color={C.danger}
                index={i}
                opacity={reveal}
                scale={0.85 + 0.15 * reveal}
              />
            );
          })}
        </div>

        {/* Hint label */}
        <div style={{
          position: 'absolute', left: 36, bottom: 24,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5,
          color: C.textFaint, letterSpacing: '0.04em',
          opacity: clamp((t - 1.6) / 0.4, 0, 1),
        }}>
          <span style={{ color: C.accentInk }}>↓</span>  finding patterns…
        </div>
      </div>
    </QALensChrome>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{
      padding: '10px 16px',
      border: `1px solid ${C.border}`, borderRadius: 10,
      background: '#fff',
      minWidth: 88,
    }}>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700,
        color, letterSpacing: '-0.02em',
      }}>{value}</div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10, color: C.textMuted, letterSpacing: '0.08em',
        textTransform: 'uppercase', marginTop: 2,
      }}>{label}</div>
    </div>
  );
}

function FailureTile({ x, y, w, h, color, index, opacity = 1, scale = 1 }) {
  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      width: w, height: h,
      background: '#fff',
      border: `1px solid ${color === C.danger ? '#fecaca' : C.border}`,
      borderRadius: 8,
      padding: '8px 10px',
      boxShadow: '0 1px 0 rgba(15,23,42,0.02)',
      display: 'flex', flexDirection: 'column', gap: 4,
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      transition: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 6, height: 6, borderRadius: 999, background: color,
        }}/>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          color: C.textFaint,
        }}>#{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
        color: C.text, fontWeight: 600,
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
      }}>
        {['payment', 'auth', 'invoice', 'session', 'ranking', 'limit', 'apple_pay'][index % 7]}.spec
      </div>
      <div style={{
        height: 4, borderRadius: 2, background: '#fee2e2',
      }}>
        <div style={{ width: '40%', height: '100%', background: color, borderRadius: 2 }}/>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE 5 — Group into 3 incidents
// ═════════════════════════════════════════════════════════════════════════════
function Group3Scene({ time }) {
  const { t } = useSceneTime(STORY.group3, time);
  // Animation arc: tiles fly from raw grid → into cluster slots; then incident cards materialize behind them.
  const flyU = Easing.easeInOutCubic(clamp(t / 1.0, 0, 1));
  const cardReveal = (i) => Easing.easeOutCubic(clamp((t - 0.8 - i * 0.15) / 0.5, 0, 1));
  const numberMorph = Easing.easeOutCubic(clamp((t - 0.7) / 0.6, 0, 1));

  // Each failure has a raw position and a clustered position.
  // Per-incident running slot counter
  const slotMap = (() => {
    const counters = [0, 0, 0];
    return FAILURES.map((f) => {
      const slot = counters[f.incident]++;
      return slot;
    });
  })();

  return (
    <QALensChrome activeNav="Incidents" time={time}>
      <div style={{ padding: '28px 36px', position: 'relative', height: '100%' }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
          color: C.accentInk, letterSpacing: '0.06em', marginBottom: 6,
        }}>INCIDENTS · GROUPED BY STACK SIGNATURE</div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 18 }}>
          {/* Morphing big number: 17 → 3 */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 64, fontWeight: 700,
              letterSpacing: '-0.04em', lineHeight: 0.9,
              color: C.textFaint,
              textDecoration: numberMorph > 0.5 ? 'line-through' : 'none',
              opacity: 1 - numberMorph * 0.5,
            }}>17</div>
            <div style={{
              fontSize: 24, color: C.textMuted,
              transform: `translateY(${(1 - numberMorph) * 8}px)`,
              opacity: numberMorph,
            }}>→</div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 96, fontWeight: 700,
              letterSpacing: '-0.04em', lineHeight: 0.9,
              color: C.accent,
              opacity: numberMorph,
              transform: `scale(${0.7 + 0.3 * numberMorph})`,
              transformOrigin: 'left bottom',
            }}>3</div>
          </div>
          <div style={{
            opacity: numberMorph,
            transform: `translateY(${(1 - numberMorph) * 6}px)`,
          }}>
            <div style={{ fontSize: 22, fontWeight: 650, color: C.text, letterSpacing: '-0.015em' }}>
              incidents
            </div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
              17 failures, same 3 root causes
            </div>
          </div>
        </div>

        {/* Cluster cards (placeholders behind tiles) */}
        <div style={{ position: 'relative', height: 350 }}>
          {INCIDENTS.map((inc, i) => {
            const a = clusterAnchor(i);
            const reveal = cardReveal(i);
            return (
              <div key={inc.id} style={{
                position: 'absolute',
                left: a.x - 30, top: a.y - 40,
                width: 244, height: 220,
                background: '#fff',
                border: `1.5px solid ${inc.color}`,
                borderRadius: 12,
                padding: '12px 14px',
                boxShadow: `0 8px 24px ${inc.color}22, 0 1px 0 rgba(15,23,42,0.02)`,
                opacity: reveal,
                transform: `translateY(${(1 - reveal) * 12}px)`,
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 2,
                }}>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                    fontWeight: 700, color: inc.color,
                    background: '#fff', border: `1px solid ${inc.color}`,
                    padding: '2px 6px', borderRadius: 4,
                  }}>{inc.id}</span>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                    color: C.textFaint,
                  }}>×{inc.count}</span>
                </div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
                  fontWeight: 700, color: C.text, lineHeight: 1.3,
                }}>{inc.label}</div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5,
                  color: C.textMuted, lineHeight: 1.4,
                  height: 28, overflow: 'hidden',
                }}>{inc.msg}</div>
                <div style={{ flex: 1 }}/>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                  color: C.textFaint, letterSpacing: '0.04em',
                }}>
                  suite: {inc.suite}
                </div>
              </div>
            );
          })}

          {/* Tiles fly into clusters */}
          {FAILURES.map((f, i) => {
            const { col, row } = rawTileXY(i);
            const raw = { x: col * 168, y: row * 92 };
            const slot = slotMap[i];
            const a = clusterAnchor(f.incident);
            const cs = clusterSlotXY(slot, INCIDENTS[f.incident].count);
            const clustered = {
              x: a.x - 16 + cs.col * 50,
              y: a.y + 78 + cs.row * 36,
            };
            const x = raw.x + (clustered.x - raw.x) * flyU;
            const y = raw.y + (clustered.y - raw.y) * flyU;
            // Shrink + simplify as it joins a cluster
            const scale = 1 - flyU * 0.7;
            return (
              <MiniTile key={i}
                x={x} y={y}
                w={150 * (1 - flyU * 0.72)}
                h={70 * (1 - flyU * 0.65)}
                color={f.color}
                index={i}
                fade={flyU}
              />
            );
          })}
        </div>
      </div>
    </QALensChrome>
  );
}

function MiniTile({ x, y, w, h, color, index, fade }) {
  // As fade → 1, tile becomes a small dot in the cluster
  const collapsed = fade > 0.7;
  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      width: w, height: h,
      background: collapsed ? color : '#fff',
      border: `1px solid ${collapsed ? color : '#fecaca'}`,
      borderRadius: collapsed ? 5 : 8,
      padding: collapsed ? 0 : '8px 10px',
      display: 'flex', flexDirection: 'column', gap: 4,
      transformOrigin: 'top left',
      boxShadow: '0 1px 0 rgba(15,23,42,0.02)',
    }}>
      {!collapsed && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: color }}/>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
              color: C.textFaint,
            }}>#{String(index + 1).padStart(2, '0')}</span>
          </div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
            color: C.text, fontWeight: 600,
            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          }}>
            {['payment', 'auth', 'invoice', 'session', 'ranking', 'limit', 'apple_pay'][index % 7]}.spec
          </div>
        </>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE 6 — Open one incident
// ═════════════════════════════════════════════════════════════════════════════
function OpenIncidentScene({ time }) {
  const { t } = useSceneTime(STORY.openInc, time);
  const expandU = Easing.easeOutCubic(clamp(t / 0.6, 0, 1));
  const detailReveal = (i) => Easing.easeOutCubic(clamp((t - 0.5 - i * 0.12) / 0.4, 0, 1));

  const inc = INCIDENTS[0]; // The top incident — TimeoutError
  const affected = [
    'checkout.PaymentSpec › declines 3DS retry on stale token',
    'checkout.PaymentSpec › 3DS step-up redirect flow',
    'checkout.PaymentSpec › apple pay tokenization',
    'checkout.PaymentSpec › saved card challenge',
    'checkout.PaymentSpec › guest checkout 3DS',
    'checkout.PaymentSpec › co-branded card 3DS',
    'checkout.PaymentSpec › retry on declined CVC',
  ];

  return (
    <QALensChrome activeNav="Incidents" time={time}>
      <div style={{ padding: '24px 36px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Breadcrumb */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5,
          color: C.textFaint, marginBottom: 12,
        }}>
          <span>Incidents</span>
          <span>›</span>
          <span style={{ color: C.accentInk, fontWeight: 600 }}>{inc.id}</span>
        </div>

        {/* Expanding card */}
        <div style={{
          flex: 1,
          background: '#fff',
          border: `1.5px solid ${inc.color}`,
          borderRadius: 14,
          boxShadow: `0 12px 40px ${inc.color}24`,
          padding: '22px 26px',
          display: 'flex', flexDirection: 'column', gap: 14,
          transform: `scale(${0.85 + 0.15 * expandU})`,
          transformOrigin: 'top left',
          opacity: expandU,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, fontWeight: 700, color: inc.color,
              background: '#fff', border: `1.5px solid ${inc.color}`,
              padding: '4px 10px', borderRadius: 6,
              letterSpacing: '0.06em',
            }}>{inc.id}</div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 20, fontWeight: 700, color: C.text,
                letterSpacing: '-0.015em',
              }}>{inc.label}</div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 13, color: C.textMuted, marginTop: 4,
              }}>{inc.msg}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 28, fontWeight: 700, color: inc.color,
                letterSpacing: '-0.02em', lineHeight: 1,
              }}>×{inc.count}</div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10.5, color: C.textMuted, marginTop: 4,
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>occurrences</div>
            </div>
          </div>

          {/* Meta strip */}
          <div style={{
            display: 'flex', gap: 22,
            padding: '12px 0',
            borderTop: `1px solid ${C.border}`,
            borderBottom: `1px solid ${C.border}`,
            opacity: detailReveal(0),
          }}>
            <Meta label="FINGERPRINT" value={inc.fingerprint} mono/>
            <Meta label="FIRST SEEN" value="run #836 · 4 days ago"/>
            <Meta label="LAST SEEN"  value="run #842 · just now"/>
            <Meta label="SUITES"     value={inc.suite}/>
          </div>

          {/* Stack + Affected tests */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 18,
            flex: 1, minHeight: 0,
            opacity: detailReveal(1),
          }}>
            <div>
              <Sectionhead title="Shared stack frame"/>
              <div style={{
                background: '#0b1530', color: '#e2e8f0',
                fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5,
                lineHeight: 1.55,
                borderRadius: 8, padding: '12px 14px',
                whiteSpace: 'pre',
              }}>
{`  TimeoutError: waitForSelector exceeded
                10000ms
    at Page.waitForSelector
       (playwright/lib/page.js:1244:13)
    at PaymentSpec.<anonymous>
       (checkout.payment.spec.js:142:7)
    at processImmediate
       (internal/timers.js:464:21)`}
              </div>
            </div>
            <div>
              <Sectionhead title={`Affected tests · ${affected.length}`}/>
              <div style={{
                background: '#fbfbfd', border: `1px solid ${C.border}`,
                borderRadius: 8, padding: '10px 12px',
                display: 'flex', flexDirection: 'column', gap: 5,
                maxHeight: '100%', overflow: 'hidden',
              }}>
                {affected.map((nm, i) => {
                  const r = detailReveal(2 + i * 0.4);
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      opacity: r,
                      transform: `translateX(${(1 - r) * -6}px)`,
                    }}>
                      <span style={{ color: inc.color, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700 }}>✗</span>
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5,
                        color: C.text,
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                      }}>{nm}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </QALensChrome>
  );
}

function Sectionhead({ title }) {
  return (
    <div style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 10.5, color: C.textMuted,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      marginBottom: 8, fontWeight: 600,
    }}>{title}</div>
  );
}
function Meta({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 9.5, color: C.textFaint,
        letterSpacing: '0.1em',
      }}>{label}</span>
      <span style={{
        fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit',
        fontSize: 12, color: C.text, fontWeight: mono ? 500 : 500,
      }}>{value}</span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE 7 — Fix First
// ═════════════════════════════════════════════════════════════════════════════
function FixFirstScene({ time }) {
  const { t } = useSceneTime(STORY.fixFirst, time);
  const rowReveal = (i) => Easing.easeOutCubic(clamp((t - 0.2 - i * 0.13) / 0.45, 0, 1));

  const ROWS = [
    { rank: 1, inc: 'IC-1042', title: 'TimeoutError: waitForSelector', unblocks: 7, score: 0.94, suite: 'checkout', top: true },
    { rank: 2, inc: 'IC-1043', title: 'ECONNREFUSED at stripe-mock',   unblocks: 5, score: 0.81, suite: 'billing · auth' },
    { rank: 3, inc: 'IC-1044', title: 'AssertionError on snapshot',     unblocks: 5, score: 0.62, suite: 'search · api' },
  ];

  return (
    <QALensChrome activeNav="Fix First" time={time}>
      <div style={{ padding: '28px 36px', position: 'relative', height: '100%' }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
          color: C.accentInk, letterSpacing: '0.06em', marginBottom: 6,
        }}>FIX FIRST · RANKED BY IMPACT × RECENCY</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 22 }}>
          <div style={{
            fontSize: 28, fontWeight: 650, color: C.text,
            letterSpacing: '-0.02em',
          }}>Fix this one first.</div>
          <div style={{ fontSize: 14, color: C.textMuted }}>
            Top fix unblocks <span style={{ fontWeight: 700, color: C.text }}>7 of 17</span> failures.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ROWS.map((r, i) => {
            const reveal = rowReveal(i);
            return (
              <div key={r.rank} style={{
                display: 'grid',
                gridTemplateColumns: '34px 1fr 110px 88px',
                alignItems: 'center', gap: 16,
                padding: '14px 16px',
                background: r.top ? '#fffaf7' : '#fff',
                border: `1.5px solid ${r.top ? '#fde7d8' : C.border}`,
                borderRadius: 12,
                boxShadow: r.top ? `0 8px 24px rgba(225,29,72,0.10)` : '0 1px 0 rgba(15,23,42,0.02)',
                opacity: reveal,
                transform: `translateY(${(1 - reveal) * 10}px) scale(${0.97 + 0.03 * reveal})`,
                transformOrigin: 'left center',
              }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 18, fontWeight: 700, color: r.top ? C.danger : C.textFaint,
                  textAlign: 'right',
                }}>{String(r.rank).padStart(2, '0')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 10, fontWeight: 700,
                      color: r.top ? C.danger : C.textMuted,
                      border: `1px solid ${r.top ? '#fecaca' : C.border}`,
                      padding: '2px 6px', borderRadius: 4,
                    }}>{r.inc}</span>
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 14, fontWeight: 700, color: C.text,
                      letterSpacing: '-0.005em',
                    }}>{r.title}</span>
                  </div>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11, color: C.textMuted,
                  }}>{r.suite}</div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 13, fontWeight: 600,
                  color: r.top ? C.dangerInk : C.textMuted,
                }}>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{r.unblocks}</span>
                  <span style={{ fontSize: 10.5, color: C.textFaint }}>tests<br/>unblock</span>
                </div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 13, fontWeight: 700,
                  padding: '6px 10px', borderRadius: 999,
                  background: r.top ? C.danger : C.accentTint,
                  color: r.top ? '#fff' : C.accentInk,
                  textAlign: 'center',
                }}>{r.score.toFixed(2)}</div>
              </div>
            );
          })}
        </div>

        {/* CTA — fix-first hint */}
        <div style={{
          position: 'absolute', left: 36, bottom: 24,
          display: 'flex', alignItems: 'center', gap: 10,
          opacity: clamp((t - 1.0) / 0.4, 0, 1),
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 999,
            background: C.danger, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontSize: 14,
          }}>1</div>
          <span style={{
            fontSize: 13, color: C.textMuted,
          }}>Ship one fix. Re-run the suite.</span>
        </div>
      </div>
    </QALensChrome>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE 8 — Clean dashboard
// ═════════════════════════════════════════════════════════════════════════════
function CleanScene({ time }) {
  const { t } = useSceneTime(STORY.clean, time);
  const bigCheckU = Easing.easeOutBack(clamp(t / 0.55, 0, 1));
  const statsReveal = (i) => Easing.easeOutCubic(clamp((t - 0.45 - i * 0.12) / 0.4, 0, 1));

  // Pass-rate sparkline showing the recovery
  const points = [0.62, 0.58, 0.55, 0.61, 0.92, 0.98, 1.00];

  return (
    <QALensChrome activeNav="Runs" time={time}>
      <div style={{ padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 18, height: '100%' }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
          color: C.successInk, letterSpacing: '0.06em',
        }}>RUN #843 · MAIN · 12s AGO</div>

        {/* Big check + headline */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 24,
          padding: '22px 24px',
          background: '#fff',
          border: `1.5px solid ${C.success}`,
          borderRadius: 14,
          boxShadow: '0 12px 40px rgba(16,185,129,0.14)',
        }}>
          <div style={{
            width: 76, height: 76,
            transform: `scale(${bigCheckU})`,
            transformOrigin: 'center',
          }}>
            <svg width="76" height="76" viewBox="0 0 76 76" fill="none">
              <circle cx="38" cy="38" r="34" fill={C.success}/>
              <path d="M22 39 L33 50 L54 28" stroke="#fff" strokeWidth="5"
                    strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 30, fontWeight: 700, color: C.text,
              letterSpacing: '-0.022em',
            }}>All clean.</div>
            <div style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>
              Build #843 passed · 0 failures · 1,288 tests · 4m 02s
            </div>
          </div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12, color: C.successInk,
            background: C.successTint,
            border: `1px solid #a7f3d0`,
            padding: '6px 12px', borderRadius: 999,
            fontWeight: 600, letterSpacing: '0.06em',
          }}>● PASSED</div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <CleanStat reveal={statsReveal(0)} label="Pass rate"     value="100%"  delta="+38 pts" color={C.successInk}/>
          <CleanStat reveal={statsReveal(1)} label="Failures"      value="0"     delta="−17"    color={C.text}/>
          <CleanStat reveal={statsReveal(2)} label="Incidents"     value="0"     delta="−3"     color={C.text}/>
          <CleanStat reveal={statsReveal(3)} label="Wall-clock"    value="4m 02s" delta="−2m 49s" color={C.text}/>
        </div>

        {/* Sparkline — pass rate recovery */}
        <div style={{
          flex: 1, minHeight: 0,
          background: '#fff',
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: '16px 22px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, color: C.textMuted, letterSpacing: '0.06em',
            }}>PASS RATE · LAST 7 RUNS</div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, color: C.textFaint,
            }}>#837 — #843</div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Sparkline points={points} reveal={clamp((t - 0.4) / 0.8, 0, 1)}/>
          </div>
        </div>
      </div>
    </QALensChrome>
  );
}

function CleanStat({ label, value, delta, color, reveal }) {
  return (
    <div style={{
      padding: '14px 16px',
      background: '#fff',
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      opacity: reveal,
      transform: `translateY(${(1 - reveal) * 8}px)`,
    }}>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10, color: C.textMuted, letterSpacing: '0.08em',
        textTransform: 'uppercase', fontWeight: 600,
      }}>{label}</div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 28, fontWeight: 700, color,
        letterSpacing: '-0.025em', marginTop: 4,
      }}>{value}</div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11, color: C.successInk, marginTop: 2,
        fontWeight: 600,
      }}>{delta}</div>
    </div>
  );
}

function Sparkline({ points, reveal }) {
  const w = 1040, h = 160, padL = 30, padR = 18, padT = 12, padB = 22;
  const minY = 0, maxY = 1;
  const xAt = (i) => padL + (i * (w - padL - padR)) / (points.length - 1);
  const yAt = (v) => padT + ((maxY - v) / (maxY - minY)) * (h - padT - padB);
  const pts = points.map((v, i) => ({ x: xAt(i), y: yAt(v), v }));
  const drawCount = Math.max(1, Math.ceil(pts.length * reveal));
  const visible = pts.slice(0, drawCount);
  const path = visible.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = visible.length > 1
    ? `${path} L ${visible[visible.length - 1].x},${h - padB} L ${visible[0].x},${h - padB} Z`
    : '';

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {[0, 0.25, 0.5, 0.75, 1].map((g, i) => (
        <line key={i} x1={padL} y1={yAt(g)} x2={w - padR} y2={yAt(g)}
              stroke={C.border} strokeWidth="1"/>
      ))}
      {area && <path d={area} fill={C.success} opacity="0.10"/>}
      {path && <path d={path} fill="none" stroke={C.success} strokeWidth="2.5"
                     strokeLinecap="round" strokeLinejoin="round"/>}
      {visible.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y}
                r={i === visible.length - 1 ? 5 : 3}
                fill={i === visible.length - 1 ? C.success : '#fff'}
                stroke={C.success} strokeWidth="2"/>
      ))}
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Footer caption — tiny mono label so the viewer knows what they're seeing
// ═════════════════════════════════════════════════════════════════════════════
function StoryCaption({ time }) {
  const captions = [
    { range: STORY.ci,       text: 'CI · build failed' },
    { range: STORY.messy,    text: 'raw report · 17 stack traces' },
    { range: STORY.lens,     text: 'QA Lens · analyzing' },
    { range: STORY.count17,  text: '17 failures detected' },
    { range: STORY.group3,   text: '3 incidents · same root cause' },
    { range: STORY.openInc,  text: 'incident IC-1042 · 7 affected tests' },
    { range: STORY.fixFirst, text: 'Fix First · ranked by impact' },
    { range: STORY.clean,    text: 'all clean · build #843' },
  ];
  // Show the caption whose window includes time
  const active = captions.find(c => time >= c.range[0] - 0.1 && time <= c.range[1] + 0.1);
  if (!active) return null;
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 22,
      display: 'flex', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11, color: C.textFaint,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        padding: '5px 14px', borderRadius: 999,
        border: `1px solid ${C.border}`,
      }}>
        {active.text}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Root scene + Stage
// ═════════════════════════════════════════════════════════════════════════════
function StoryScene() {
  const time = useTime();
  return (
    <div style={{
      position: 'absolute', inset: 0,
      fontFamily: 'Inter, system-ui, sans-serif',
      color: C.text,
    }}>
      <BG/>
      <SceneFade range={STORY.ci}       time={time}><CIRedScene        time={time}/></SceneFade>
      <SceneFade range={STORY.messy}    time={time}><MessyReportScene  time={time}/></SceneFade>
      <SceneFade range={STORY.lens}     time={time}><LensTransition    time={time}/></SceneFade>
      <SceneFade range={STORY.count17}  time={time}><Count17Scene      time={time}/></SceneFade>
      <SceneFade range={STORY.group3}   time={time}><Group3Scene       time={time}/></SceneFade>
      <SceneFade range={STORY.openInc}  time={time}><OpenIncidentScene time={time}/></SceneFade>
      <SceneFade range={STORY.fixFirst} time={time}><FixFirstScene     time={time}/></SceneFade>
      <SceneFade range={STORY.clean}    time={time}><CleanScene        time={time}/></SceneFade>
    </div>
  );
}

function StoryLoop() {
  return (
    <Stage
      width={1280}
      height={720}
      duration={STORY_TOTAL}
      background={C.bg}
      controls={false}
      persistKey={null}
      loop={true}
    >
      <StoryScene/>
    </Stage>
  );
}

window.StoryLoop = StoryLoop;
