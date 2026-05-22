// QA Lens — Hero product-shot mock.
// Stylized composite of three product surfaces stitched together to read
// at a glance: (1) Fix First triage, (2) Run #53 vs #52 diff, (3) Ask-your-tests answer.

const heroShotStyles = {
  frame: {
    position: 'relative',
    width: '100%',
    background: 'linear-gradient(180deg, #ffffff 0%, #fafbff 100%)',
    border: '1px solid var(--border-default)',
    borderRadius: '14px',
    boxShadow: 'var(--shadow-screen)',
    overflow: 'hidden',
  },
  topbar: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 14px',
    borderBottom: '1px solid var(--border-subtle)',
    background: '#fcfcfd',
  },
  dot: (c) => ({ width: 10, height: 10, borderRadius: 999, background: c }),
  url: {
    flex: 1, marginLeft: 8,
    height: 26, borderRadius: 7, background: '#f1f5f9',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-muted)', fontSize: 11.5,
  },
  appNavRow: {
    display: 'flex', alignItems: 'center',
    padding: '0 22px', height: 48,
    borderBottom: '1px solid var(--border-subtle)',
    gap: 22, fontSize: 13, color: 'var(--text-muted)',
  },
  brandPill: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    color: 'var(--text-primary)', fontWeight: 600, letterSpacing: '-0.005em',
  },
  navItem: { cursor: 'default' },
  navItemActive: { color: 'var(--accent)', fontWeight: 600, position: 'relative' },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.15fr 1fr',
    gap: 0,
  },
  leftCol: { padding: '22px 22px 22px 22px', borderRight: '1px solid var(--border-subtle)' },
  rightCol: { display: 'grid', gridTemplateRows: 'auto auto', },
  sectionTitle: {
    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionH: {
    fontSize: 15, fontWeight: 650, color: 'var(--text-primary)', letterSpacing: '-0.01em',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  sectionMeta: { fontSize: 11.5, color: 'var(--text-faint)' },

  fixRow: {
    display: 'grid',
    gridTemplateColumns: '28px 1fr auto',
    alignItems: 'center', gap: 14,
    padding: '12px 12px 12px 8px',
    borderRadius: 10,
    border: '1px solid var(--border-subtle)',
    marginBottom: 8,
    background: '#fff',
  },
  fixRowTop: {
    background: '#fffaf7',
    borderColor: '#fde7d8',
  },
  rank: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12, color: 'var(--text-faint)', textAlign: 'right',
  },
  fixTitle: {
    fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  fixMeta: {
    fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2,
    display: 'flex', gap: 8, alignItems: 'center',
  },
  fixScore: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12, fontWeight: 600,
    padding: '4px 8px', borderRadius: 999,
    background: 'var(--accent-tint)', color: 'var(--accent-ink)',
    whiteSpace: 'nowrap',
  },
  tag: (variant) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 7px', borderRadius: 999,
    fontSize: 10.5, fontWeight: 500, letterSpacing: 0.1,
    textTransform: 'uppercase',
    background: variant === 'new' ? '#fff1f2'
              : variant === 'flaky' ? '#fff7ed'
              : '#ecfeff',
    color: variant === 'new' ? '#be123c'
              : variant === 'flaky' ? '#9a3412'
              : '#155e75',
  }),

  diffWrap: { padding: 22, borderBottom: '1px solid var(--border-subtle)' },
  diffStats: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12,
  },
  diffStat: {
    border: '1px solid var(--border-subtle)', borderRadius: 10,
    padding: '10px 12px', background: '#fff',
  },
  diffStatVal: {
    fontSize: 22, fontWeight: 650, letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums',
  },
  diffStatLbl: {
    fontSize: 11, color: 'var(--text-muted)', marginTop: 2,
  },

  chatWrap: { padding: 22, background: '#fbfbfd' },
  chatBubbleUser: {
    display: 'inline-block',
    background: 'var(--accent)', color: '#fff',
    padding: '8px 12px', borderRadius: '12px 12px 4px 12px',
    fontSize: 13, fontWeight: 500,
    maxWidth: '85%',
  },
  chatBubbleBot: {
    background: '#fff',
    border: '1px solid var(--border-subtle)',
    padding: '12px 14px', borderRadius: '12px 12px 12px 4px',
    fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55,
    marginTop: 8,
  },
  evidenceChip: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    padding: '3px 8px', borderRadius: 6,
    background: 'var(--accent-tint)', color: 'var(--accent-ink)',
    marginRight: 6, marginTop: 6,
  },
};

function HeroShot() {
  return (
    <div style={heroShotStyles.frame}>
      {/* OS-ish topbar */}
      <div style={heroShotStyles.topbar}>
        <div style={heroShotStyles.dot('#ff5f57')} />
        <div style={heroShotStyles.dot('#febc2e')} />
        <div style={heroShotStyles.dot('#28c840')} />
        <div style={heroShotStyles.url} className="mono">qalens · localhost:8080 · main</div>
        <div style={{ fontSize: 11, color: 'var(--text-faint)' }} className="mono">v0.4.2</div>
      </div>

      {/* App nav */}
      <div style={heroShotStyles.appNavRow}>
        <div style={heroShotStyles.brandPill}>
          <LensMark size={16} />
          QA&nbsp;Lens
        </div>
        <div style={{ width: 1, height: 18, background: 'var(--border-default)' }} />
        <div style={heroShotStyles.navItemActive}>Fix&nbsp;First</div>
        <div style={heroShotStyles.navItem}>Runs</div>
        <div style={heroShotStyles.navItem}>Compare</div>
        <div style={heroShotStyles.navItem}>Incidents</div>
        <div style={heroShotStyles.navItem}>Flaky</div>
        <div style={heroShotStyles.navItem}>Ask</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
            run&nbsp;#53 · 4&nbsp;min&nbsp;ago
          </span>
          <div style={{ width: 22, height: 22, borderRadius: 999, background: 'var(--accent-tint-strong)', color: 'var(--accent-ink)', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>AP</div>
        </div>
      </div>

      <div style={heroShotStyles.grid}>
        {/* LEFT — Fix First */}
        <div style={heroShotStyles.leftCol}>
          <div style={heroShotStyles.sectionTitle}>
            <div style={heroShotStyles.sectionH}>
              <span style={{
                display: 'inline-block', width: 7, height: 7, borderRadius: 999, background: '#e11d48',
              }} />
              Fix First
              <span className="mono" style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)', marginLeft: 4 }}>
                /api/risk · 12 items
              </span>
            </div>
            <div style={heroShotStyles.sectionMeta}>ranked by impact × recency</div>
          </div>

          <FixRow rank={1} title="checkout.PaymentSpec › declines 3DS retry"
                  suite="checkout" tag="new" score="0.94" top />
          <FixRow rank={2} title="auth.SessionSpec › token refresh after idle"
                  suite="auth" tag="new" score="0.87" />
          <FixRow rank={3} title="search.RankingSpec › boost decay on stale index"
                  suite="search" tag="flaky" score="0.71" />
          <FixRow rank={4} title="billing.InvoiceSpec › proration on annual plan"
                  suite="billing" tag="regress" score="0.66" />
          <FixRow rank={5} title="api.RateLimitSpec › burst window reset"
                  suite="api" tag="flaky" score="0.52" muted />
        </div>

        {/* RIGHT — diff + chat */}
        <div style={heroShotStyles.rightCol}>
          <div style={heroShotStyles.diffWrap}>
            <div style={heroShotStyles.sectionTitle}>
              <div style={heroShotStyles.sectionH}>
                Run #53 <span style={{ color: 'var(--text-faint)', fontWeight: 500 }}>vs</span> #52
              </div>
              <div style={heroShotStyles.sectionMeta} className="mono">+24m 11s · 1,284 tests</div>
            </div>
            <div style={heroShotStyles.diffStats}>
              <div style={heroShotStyles.diffStat}>
                <div style={{ ...heroShotStyles.diffStatVal, color: 'var(--danger)' }}>+7</div>
                <div style={heroShotStyles.diffStatLbl}>new failures</div>
              </div>
              <div style={heroShotStyles.diffStat}>
                <div style={{ ...heroShotStyles.diffStatVal, color: 'var(--success)' }}>−3</div>
                <div style={heroShotStyles.diffStatLbl}>recovered</div>
              </div>
              <div style={heroShotStyles.diffStat}>
                <div style={{ ...heroShotStyles.diffStatVal, color: 'var(--text-primary)' }}>2</div>
                <div style={heroShotStyles.diffStatLbl}>incidents</div>
              </div>
            </div>
          </div>

          <div style={heroShotStyles.chatWrap}>
            <div style={heroShotStyles.sectionTitle}>
              <div style={heroShotStyles.sectionH}>Ask your test data</div>
              <div style={heroShotStyles.sectionMeta} className="mono">grounded</div>
            </div>
            <div style={heroShotStyles.chatBubbleUser}>
              Why did checkout regress this week?
            </div>
            <div style={heroShotStyles.chatBubbleBot}>
              Three new failures in <strong>checkout.PaymentSpec</strong> first appeared in
              run&nbsp;#51 after dependency <span className="mono">stripe-mock@4.2</span> bumped.
              All three share the stack frame <span className="mono">3DSRetry.handle</span>.
              <div>
                <span style={heroShotStyles.evidenceChip}>run #51</span>
                <span style={heroShotStyles.evidenceChip}>incident&nbsp;IC-1042</span>
                <span style={heroShotStyles.evidenceChip}>+2 more</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FixRow({ rank, title, suite, tag, score, top, muted }) {
  return (
    <div style={{
      ...heroShotStyles.fixRow,
      ...(top ? heroShotStyles.fixRowTop : {}),
      opacity: muted ? 0.55 : 1,
    }}>
      <div style={heroShotStyles.rank}>{String(rank).padStart(2, '0')}</div>
      <div>
        <div style={heroShotStyles.fixTitle} className="mono">{title}</div>
        <div style={heroShotStyles.fixMeta}>
          <span className="mono">{suite}</span>
          <span style={{ color: 'var(--text-faint)' }}>·</span>
          <span style={heroShotStyles.tag(tag)}>{tag === 'new' ? 'new' : tag === 'flaky' ? 'flaky' : 'regressed'}</span>
        </div>
      </div>
      <div style={heroShotStyles.fixScore} className="num">{score}</div>
    </div>
  );
}

// Simple "lens" mark — abstract concentric ring + dot.
function LensMark({ size = 18, color }) {
  const c = color || 'var(--accent)';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.5" stroke={c} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.2" fill={c} />
    </svg>
  );
}

Object.assign(window, { HeroShot, LensMark });
