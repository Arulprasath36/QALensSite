// QA Lens marketing site — single-page layout.
// Sections: Nav · Hero · Problem · Features · Quick Start · Demo · OSS Trust · Final CTA · Footer
// Visual system: white bg, deep navy text, single accent (indigo by default, tweakable).
// No motion beyond hover. No gradients except a soft hero wash.

const ACCENT_OPTIONS = [
  { key: 'indigo', tint: '#eef2ff', tintStrong: '#e0e7ff', accent: '#4f46e5', ink: '#3730a3' },
  { key: 'blue',   tint: '#eff6ff', tintStrong: '#dbeafe', accent: '#2563eb', ink: '#1d4ed8' },
  { key: 'teal',   tint: '#ecfeff', tintStrong: '#cffafe', accent: '#0d9488', ink: '#115e59' },
  { key: 'violet', tint: '#f5f3ff', tintStrong: '#ede9fe', accent: '#7c3aed', ink: '#5b21b6' },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "indigo",
  "heroLayout": "stacked",
  "showProblemQuote": true,
  "showOssBadges": true
}/*EDITMODE-END*/;

function applyAccent(key) {
  const opt = ACCENT_OPTIONS.find(o => o.key === key) || ACCENT_OPTIONS[0];
  const r = document.documentElement.style;
  r.setProperty('--accent', opt.accent);
  r.setProperty('--accent-tint', opt.tint);
  r.setProperty('--accent-tint-strong', opt.tintStrong);
  r.setProperty('--accent-ink', opt.ink);
}

// ─────────────────────────────────────────────────────────────────
//  TOP-LEVEL PAGE
// ─────────────────────────────────────────────────────────────────
function QALensSite() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => { applyAccent(t.accent); }, [t.accent]);

  return (
    <div style={{ minWidth: 1200 }}>
      <Nav />
      <Hero layout={t.heroLayout} />
      <Problem showQuote={t.showProblemQuote} />
      <Features />
      <QuickStart />
      <DemoCTA />
      <OssTrust showBadges={t.showOssBadges} />
      <FinalCTA />
      <Footer />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Brand">
          <TweakColor
            label="Accent"
            value={ACCENT_OPTIONS.find(o => o.key === t.accent)?.accent || ACCENT_OPTIONS[0].accent}
            onChange={hex => {
              const opt = ACCENT_OPTIONS.find(o => o.accent === hex) || ACCENT_OPTIONS[0];
              setTweak('accent', opt.key);
            }}
            options={ACCENT_OPTIONS.map(o => o.accent)}
          />
        </TweakSection>
        <TweakSection label="Hero">
          <TweakRadio
            label="Layout"
            value={t.heroLayout}
            onChange={v => setTweak('heroLayout', v)}
            options={['stacked', 'split']}
          />
        </TweakSection>
        <TweakSection label="Content">
          <TweakToggle label="Problem quote" value={t.showProblemQuote}
            onChange={v => setTweak('showProblemQuote', v)} />
          <TweakToggle label="OSS badges" value={t.showOssBadges}
            onChange={v => setTweak('showOssBadges', v)} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Shared bits
// ─────────────────────────────────────────────────────────────────
const PAGE_PAD = '0 56px';
const MAX_W = 1200;

const containerStyle = { maxWidth: MAX_W, margin: '0 auto', padding: PAGE_PAD };

function PrimaryBtn({ children, href = '#', icon }) {
  return (
    <a href={href} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      height: 44, padding: '0 18px',
      background: 'var(--accent)', color: '#fff',
      borderRadius: 10, fontSize: 14, fontWeight: 600,
      textDecoration: 'none',
      boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 1px 2px rgba(15,23,42,0.10)',
    }}>
      {children}
      {icon}
    </a>
  );
}
function GhostBtn({ children, href = '#', icon }) {
  return (
    <a href={href} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      height: 44, padding: '0 18px',
      background: '#fff', color: 'var(--text-primary)',
      border: '1px solid var(--border-default)',
      borderRadius: 10, fontSize: 14, fontWeight: 600,
      textDecoration: 'none',
    }}>
      {icon}
      {children}
    </a>
  );
}

function CodeBlock({ lines, copyable = true }) {
  const [copied, setCopied] = React.useState(false);
  const onCopy = () => {
    navigator.clipboard?.writeText(lines.map(l => l.text || l).join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div style={{
      position: 'relative',
      background: 'var(--bg-code)',
      borderRadius: 12,
      padding: '16px 18px',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13.5, lineHeight: 1.7,
      color: '#cbd5e1',
      overflow: 'hidden',
    }}>
      {lines.map((l, i) => {
        const text = l.text ?? l;
        const isComment = text.startsWith('#');
        return (
          <div key={i} style={{
            display: 'flex', gap: 14,
            color: isComment ? '#64748b' : '#e2e8f0',
          }}>
            <span style={{ color: '#475569', userSelect: 'none', width: 14, textAlign: 'right' }}>{isComment ? '' : '$'}</span>
            <span>{text}</span>
          </div>
        );
      })}
      {copyable && (
        <button onClick={onCopy} style={{
          position: 'absolute', top: 12, right: 12,
          background: copied ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
          color: copied ? '#fff' : '#cbd5e1',
          border: '1px solid ' + (copied ? 'var(--accent)' : 'rgba(255,255,255,0.08)'),
          fontFamily: 'inherit', fontSize: 11.5,
          padding: '5px 10px', borderRadius: 6,
        }}>
          {copied ? 'copied' : 'copy'}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  NAV
// ─────────────────────────────────────────────────────────────────
function Nav() {
  const items = ['Docs', 'GitHub', 'Demo', 'PyPI'];
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'saturate(180%) blur(8px)',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{ ...containerStyle, height: 64, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 650, letterSpacing: '-0.01em' }}>
          <LensMark size={20} />
          <span>QA Lens</span>
          <span className="mono" style={{
            fontSize: 10.5, fontWeight: 500, color: 'var(--accent-ink)',
            background: 'var(--accent-tint)', padding: '2px 7px', borderRadius: 999,
            marginLeft: 4,
          }}>v0.4</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 28 }}>
          {items.map(i => (
            <a key={i} href="#" style={{
              color: 'var(--text-secondary)', textDecoration: 'none',
              fontSize: 14, fontWeight: 500,
            }}>{i}</a>
          ))}
          <a href="#demo" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 34, padding: '0 12px',
            background: 'var(--text-primary)', color: '#fff',
            borderRadius: 8, fontSize: 13, fontWeight: 600,
            textDecoration: 'none',
          }}>
            Try demo →
          </a>
        </div>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────
//  HERO
// ─────────────────────────────────────────────────────────────────
function Hero({ layout = 'stacked' }) {
  const split = layout === 'split';
  return (
    <section style={{
      position: 'relative',
      paddingTop: split ? 56 : 72,
      paddingBottom: split ? 96 : 56,
      background: `
        radial-gradient(900px 360px at 50% -80px, var(--accent-tint) 0%, transparent 70%),
        #fff
      `,
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        ...containerStyle,
        display: split ? 'grid' : 'block',
        gridTemplateColumns: split ? '1fr 1.05fr' : undefined,
        gap: split ? 56 : 0,
        alignItems: split ? 'center' : undefined,
      }}>
        <div style={{ textAlign: split ? 'left' : 'center', maxWidth: split ? 'none' : 880, margin: split ? '0' : '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px 5px 8px', border: '1px solid var(--border-default)', borderRadius: 999, fontSize: 12, color: 'var(--text-muted)', background: '#fff' }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent)' }} />
            <span className="mono">open source · MIT</span>
            <span style={{ color: 'var(--text-faint)' }}>·</span>
            <span>v0.4.2 just shipped</span>
          </div>
          <h1 style={{
            fontSize: split ? 56 : 72,
            lineHeight: 1.02,
            letterSpacing: '-0.035em',
            fontWeight: 650,
            margin: '20px 0 0',
            color: 'var(--text-primary)',
          }}>
            See what to fix first<br />
            <span style={{ color: 'var(--text-muted)' }}>in your test results.</span>
          </h1>
          <p style={{
            fontSize: split ? 17 : 19, lineHeight: 1.55,
            color: 'var(--text-secondary)',
            maxWidth: 620,
            margin: split ? '20px 0 0' : '24px auto 0',
          }}>
            QA Lens turns <strong style={{ color: 'var(--text-primary)' }}>Allure</strong> and{' '}
            <strong style={{ color: 'var(--text-primary)' }}>Extent</strong> reports into failure
            insights, flaky-test detection, run comparisons, incident clusters, and release-ready
            decisions — all from one local command.
          </p>

          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 12,
            justifyContent: split ? 'flex-start' : 'center',
            marginTop: 28,
          }}>
            <PrimaryBtn href="#demo" icon={<span style={{ marginLeft: 2 }}>→</span>}>Try live demo</PrimaryBtn>
            <GhostBtn href="#" icon={<GitHubIcon size={16} />}>View on GitHub</GhostBtn>
          </div>

          <div style={{ marginTop: 22, display: 'flex', justifyContent: split ? 'flex-start' : 'center' }}>
            <PipPill />
          </div>
        </div>

        <div style={{ marginTop: split ? 0 : 56 }}>
          <HeroShot />
        </div>
      </div>

      {!split && (
        <div style={{ ...containerStyle, marginTop: 36 }}>
          <UsedByStrip />
        </div>
      )}
    </section>
  );
}

function PipPill() {
  const [copied, setCopied] = React.useState(false);
  const onCopy = () => {
    navigator.clipboard?.writeText('pip install qalens');
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <button onClick={onCopy} style={{
      display: 'inline-flex', alignItems: 'center', gap: 12,
      padding: '10px 8px 10px 16px',
      background: '#fff', border: '1px solid var(--border-default)',
      borderRadius: 999,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 14, color: 'var(--text-primary)',
    }}>
      <span style={{ color: 'var(--text-faint)' }}>$</span>
      <span>pip install qalens</span>
      <span style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 12, fontWeight: 600, padding: '4px 10px',
        borderRadius: 999,
        background: copied ? 'var(--accent)' : 'var(--bg-elevated)',
        color: copied ? '#fff' : 'var(--text-secondary)',
        transition: 'background 120ms',
      }}>
        {copied ? 'copied ✓' : 'copy'}
      </span>
    </button>
  );
}

function UsedByStrip() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 40, color: 'var(--text-faint)',
      fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
    }}>
      <span style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>reads reports from</span>
      <Logoish label="Allure" />
      <Dot />
      <Logoish label="Extent" />
      <Dot />
      <Logoish label="JUnit XML" muted />
      <Dot />
      <Logoish label="TestNG" muted />
      <Dot />
      <Logoish label="pytest-html" muted />
    </div>
  );
}
function Dot() {
  return <span style={{ width: 3, height: 3, borderRadius: 999, background: 'currentColor', opacity: 0.5 }} />;
}
function Logoish({ label, muted }) {
  return (
    <span style={{
      fontWeight: 600, color: muted ? 'var(--text-faint)' : 'var(--text-secondary)',
      fontFamily: 'Inter, sans-serif',
      letterSpacing: '-0.01em',
      opacity: muted ? 0.55 : 1,
    }}>
      {label}
      {muted && <span style={{ marginLeft: 6, fontSize: 9, padding: '2px 6px', borderRadius: 999, background: 'var(--bg-elevated)', color: 'var(--text-muted)', letterSpacing: 0.04 }}>SOON</span>}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
//  PROBLEM
// ─────────────────────────────────────────────────────────────────
function Problem({ showQuote }) {
  return (
    <section style={{ padding: '120px 0 80px' }}>
      <div style={containerStyle}>
        <div className="eyebrow" style={{ marginBottom: 18 }}>// the problem</div>
        <h2 style={{
          fontSize: 48, lineHeight: 1.08, letterSpacing: '-0.03em',
          fontWeight: 650, margin: 0, maxWidth: 900,
          color: 'var(--text-primary)',
        }}>
          Most test reports tell you{' '}
          <span style={{ color: 'var(--text-faint)', textDecoration: 'line-through', textDecorationThickness: 2 }}>what failed</span>.
          <br />QA Lens helps you understand{' '}
          <span style={{
            background: 'var(--accent-tint)',
            color: 'var(--accent-ink)',
            padding: '0 8px', borderRadius: 8,
          }}>
            what matters
          </span>.
        </h2>

        {showQuote && (
          <div style={{
            marginTop: 64,
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
            border: '1px solid var(--border-subtle)', borderRadius: 16,
            background: '#fff',
            overflow: 'hidden',
          }}>
            <ProblemSymptom title="247 failures, no idea which to open first"
              caption="Long Allure report, every failure looks equally red." />
            <ProblemSymptom title="Test went green — was it really fixed?"
              caption="No way to tell stability from a single passing run." />
            <ProblemSymptom title=""What changed since last release?""
              caption="No diff between runs, no incident grouping, no answer." last />
          </div>
        )}
      </div>
    </section>
  );
}
function ProblemSymptom({ title, caption, last }) {
  return (
    <div style={{
      padding: '28px 28px 30px',
      borderRight: last ? 'none' : '1px solid var(--border-subtle)',
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#fff1f2', color: '#be123c',
        fontSize: 14, marginBottom: 14,
      }}>!</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.005em', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.55 }}>{caption}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  FEATURES
// ─────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    title: 'Fix First',
    desc: 'Prioritize the failures that need attention now. Ranked by impact, recency, and ownership — not alphabetical.',
    glyph: 'fix',
  },
  {
    title: 'Run Compare',
    desc: 'Understand regressions, recoveries, and stability changes between any two runs.',
    glyph: 'diff',
  },
  {
    title: 'Incident Clustering',
    desc: 'Group recurring failures by stack-signature, owner, and impact. One bug, one card.',
    glyph: 'cluster',
  },
  {
    title: 'Flaky Test Detection',
    desc: 'Find unstable tests across runs. Track flakiness rate over time, per suite, per owner.',
    glyph: 'flaky',
  },
  {
    title: 'Ask Your Test Data',
    desc: 'Query runs, owners, suites, failures, and trends in natural language — with evidence.',
    glyph: 'ask',
  },
  {
    title: 'Export Insights',
    desc: 'Generate PDF or slide-ready summaries for releases and stand-ups. Ship the report, not the spreadsheet.',
    glyph: 'export',
  },
];

function Features() {
  return (
    <section style={{ padding: '80px 0 120px', background: 'var(--bg-subtle)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={containerStyle}>
        <div className="eyebrow" style={{ marginBottom: 18 }}>// what's in the box</div>
        <h2 style={{
          fontSize: 40, lineHeight: 1.1, letterSpacing: '-0.025em',
          fontWeight: 650, margin: 0, color: 'var(--text-primary)',
        }}>
          Six views built around one question: <em style={{ fontStyle: 'normal', color: 'var(--accent)' }}>what should I open next?</em>
        </h2>

        <div style={{
          marginTop: 56,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}>
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ title, desc, glyph, index }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--border-subtle)',
      borderRadius: 14,
      padding: '22px 22px 24px',
      display: 'flex', flexDirection: 'column',
      minHeight: 220,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 18,
      }}>
        <FeatureGlyph kind={glyph} />
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>
          0{index}
        </span>
      </div>
      <div style={{
        fontSize: 17, fontWeight: 650, color: 'var(--text-primary)',
        letterSpacing: '-0.01em', marginBottom: 8,
      }}>
        {title}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.55 }}>
        {desc}
      </div>
    </div>
  );
}

function FeatureGlyph({ kind }) {
  const W = 56, H = 36;
  const baseBox = {
    width: W, height: H,
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    background: '#fff',
    padding: 4,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  switch (kind) {
    case 'fix':
      return (
        <div style={baseBox}>
          <svg width="44" height="24" viewBox="0 0 44 24">
            {[0, 1, 2].map(i => (
              <g key={i}>
                <rect x="2" y={2 + i * 8} width="3" height="4" rx="0.6" fill={i === 0 ? 'var(--accent)' : 'var(--border-strong)'} />
                <rect x="8" y={2 + i * 8} width={34 - i * 6} height="4" rx="1" fill={i === 0 ? 'var(--accent-tint-strong)' : 'var(--bg-elevated)'} />
              </g>
            ))}
          </svg>
        </div>
      );
    case 'diff':
      return (
        <div style={baseBox}>
          <svg width="48" height="24" viewBox="0 0 48 24">
            <rect x="1" y="4" width="20" height="3" fill="#fecaca" />
            <rect x="1" y="10" width="14" height="3" fill="#fecaca" />
            <rect x="1" y="16" width="18" height="3" fill="#fecaca" />
            <rect x="27" y="4" width="18" height="3" fill="#bbf7d0" />
            <rect x="27" y="10" width="20" height="3" fill="#bbf7d0" />
            <rect x="27" y="16" width="12" height="3" fill="#bbf7d0" />
            <line x1="24" y1="2" x2="24" y2="22" stroke="var(--border-default)" strokeDasharray="2 2" />
          </svg>
        </div>
      );
    case 'cluster':
      return (
        <div style={baseBox}>
          <svg width="44" height="24" viewBox="0 0 44 24">
            <circle cx="22" cy="12" r="5" fill="var(--accent-tint-strong)" stroke="var(--accent)" />
            <circle cx="8" cy="6" r="2.5" fill="#fff" stroke="var(--accent)" />
            <circle cx="6" cy="16" r="2.5" fill="#fff" stroke="var(--accent)" />
            <circle cx="36" cy="7" r="2.5" fill="#fff" stroke="var(--accent)" />
            <circle cx="38" cy="18" r="2.5" fill="#fff" stroke="var(--accent)" />
            <line x1="10" y1="7" x2="18" y2="11" stroke="var(--accent)" strokeWidth="0.8" />
            <line x1="8" y1="14" x2="18" y2="13" stroke="var(--accent)" strokeWidth="0.8" />
            <line x1="34" y1="8" x2="27" y2="11" stroke="var(--accent)" strokeWidth="0.8" />
            <line x1="36" y1="17" x2="27" y2="13" stroke="var(--accent)" strokeWidth="0.8" />
          </svg>
        </div>
      );
    case 'flaky':
      return (
        <div style={baseBox}>
          <svg width="48" height="24" viewBox="0 0 48 24">
            <polyline points="2,18 8,6 14,16 20,4 26,20 32,8 38,18 44,10"
              stroke="var(--accent)" fill="none" strokeWidth="1.4" />
            {[[2,18],[8,6],[14,16],[20,4],[26,20],[32,8],[38,18],[44,10]].map(([x,y],i) => (
              <circle key={i} cx={x} cy={y} r="1.4" fill="var(--accent)" />
            ))}
          </svg>
        </div>
      );
    case 'ask':
      return (
        <div style={baseBox}>
          <svg width="48" height="22" viewBox="0 0 48 22">
            <rect x="2" y="2" width="20" height="10" rx="5" fill="var(--accent-tint-strong)" />
            <rect x="16" y="11" width="28" height="9" rx="4.5" fill="#fff" stroke="var(--border-default)" />
            <circle cx="34" cy="15.5" r="1" fill="var(--accent)" />
            <circle cx="38" cy="15.5" r="1" fill="var(--accent)" />
            <circle cx="42" cy="15.5" r="1" fill="var(--accent)" />
          </svg>
        </div>
      );
    case 'export':
      return (
        <div style={baseBox}>
          <svg width="44" height="26" viewBox="0 0 44 26">
            <rect x="2" y="2" width="22" height="22" rx="2" fill="#fff" stroke="var(--border-strong)" />
            <rect x="6" y="6" width="14" height="2" fill="var(--border-default)" />
            <rect x="6" y="10" width="10" height="2" fill="var(--border-default)" />
            <rect x="6" y="14" width="12" height="2" fill="var(--border-default)" />
            <rect x="20" y="9" width="22" height="14" rx="2" fill="var(--accent-tint-strong)" stroke="var(--accent)" />
            <text x="31" y="19" fontSize="6" fontFamily="JetBrains Mono" fill="var(--accent-ink)" textAnchor="middle" fontWeight="600">PDF</text>
          </svg>
        </div>
      );
  }
  return <div style={baseBox} />;
}

// ─────────────────────────────────────────────────────────────────
//  QUICK START
// ─────────────────────────────────────────────────────────────────
function QuickStart() {
  return (
    <section style={{ padding: '120px 0', background: '#fff' }}>
      <div style={{ ...containerStyle, display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 72, alignItems: 'center' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 18 }}>// quick start</div>
          <h2 style={{
            fontSize: 40, lineHeight: 1.1, letterSpacing: '-0.025em',
            fontWeight: 650, margin: 0, color: 'var(--text-primary)',
          }}>
            From <span className="mono" style={{ fontSize: '0.85em', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 6 }}>allure-results/</span> to insight in three lines.
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--text-muted)', marginTop: 18 }}>
            QA Lens runs entirely on your machine. It ingests your existing report
            directory, builds a local SQLite index, and serves the UI at{' '}
            <span className="mono" style={{ color: 'var(--text-secondary)' }}>localhost:8080</span>.
            No accounts, no upload, no telemetry.
          </p>
          <ul style={{
            listStyle: 'none', padding: 0, margin: '24px 0 0',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {[
              ['Python 3.10+', 'on any OS'],
              ['Allure or Extent results', 'pointed at via --reports'],
              ['~30 seconds', 'to first insight on the sample dataset'],
            ].map(([k, v]) => (
              <li key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 12, fontSize: 14 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent)', flex: '0 0 6px', transform: 'translateY(-1px)' }} />
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{k}</span>
                <span style={{ color: 'var(--text-muted)' }}>{v}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <CodeBlock lines={[
            { text: '# install' },
            'pip install qalens',
            { text: '' },
            { text: '# try it on bundled sample data' },
            'qalens demo',
            { text: '' },
            { text: '# or point it at your own reports' },
            'qalens serve --reports ./allure-results',
          ]} />
          <div style={{
            marginTop: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 12, color: 'var(--text-muted)',
          }}>
            <span className="mono">→ http://localhost:8080</span>
            <span>
              Prefer Docker? <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }}>docker run qalens/qalens</a>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
//  DEMO CTA
// ─────────────────────────────────────────────────────────────────
function DemoCTA() {
  return (
    <section id="demo" style={{
      padding: '0 0 80px',
    }}>
      <div style={containerStyle}>
        <div style={{
          position: 'relative',
          border: '1px solid var(--border-default)',
          borderRadius: 20,
          background: `
            radial-gradient(600px 200px at 80% 0%, var(--accent-tint) 0%, transparent 70%),
            #fff
          `,
          padding: '56px 56px',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '1.3fr 1fr',
          gap: 56,
          alignItems: 'center',
        }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>// try it now</div>
            <h2 style={{
              fontSize: 42, lineHeight: 1.08, letterSpacing: '-0.03em',
              fontWeight: 650, margin: 0,
              color: 'var(--text-primary)',
            }}>
              Try the live demo<br/>with real-looking test data.
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', marginTop: 16, maxWidth: 480, lineHeight: 1.6 }}>
              Pre-loaded with 53 runs from a fictional checkout suite. Click around
              <strong style={{ color: 'var(--text-primary)' }}> Fix&nbsp;First</strong>,
              <strong style={{ color: 'var(--text-primary)' }}> Compare</strong>, and
              <strong style={{ color: 'var(--text-primary)' }}> Ask</strong>. No signup. No setup.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
              <PrimaryBtn href="https://qalens-demo.onrender.com/">Open demo →</PrimaryBtn>
              <GhostBtn href="#">Watch 90s walkthrough</GhostBtn>
            </div>
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 18 }}>
              demo.qalens.dev · resets every hour · single shared instance
            </div>
          </div>

          <DemoMiniMock />
        </div>
      </div>
    </section>
  );
}

function DemoMiniMock() {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border-subtle)',
      borderRadius: 14, padding: 16,
      boxShadow: 'var(--shadow-card)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Stability over 12 runs</span>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>89.4% → 92.1%</span>
      </div>
      <svg width="100%" height="80" viewBox="0 0 240 80" preserveAspectRatio="none">
        <defs>
          <linearGradient id="passFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,60 L20,55 L40,62 L60,40 L80,48 L100,30 L120,38 L140,22 L160,28 L180,18 L200,24 L220,12 L240,18 L240,80 L0,80 Z" fill="url(#passFill)" />
        <path d="M0,60 L20,55 L40,62 L60,40 L80,48 L100,30 L120,38 L140,22 L160,28 L180,18 L200,24 L220,12 L240,18" fill="none" stroke="var(--accent)" strokeWidth="1.6" />
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          ['Stable', '1,193', 'var(--success)'],
          ['Flaky', '46', '#b45309'],
          ['Broken', '12', 'var(--danger)'],
        ].map(([k, v, c]) => (
          <div key={k} style={{ background: 'var(--bg-subtle)', borderRadius: 8, padding: '8px 10px' }}>
            <div className="num" style={{ fontSize: 18, fontWeight: 650, color: c, letterSpacing: '-0.02em' }}>{v}</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  OSS TRUST
// ─────────────────────────────────────────────────────────────────
const TRUST = [
  { k: 'Open source', v: 'MIT-licensed. Source on GitHub.', icon: 'oss' },
  { k: 'Runs locally', v: 'Your test data never leaves your machine.', icon: 'local' },
  { k: 'SQLite-backed', v: 'One file. Commit it, share it, version it.', icon: 'sqlite' },
  { k: 'Allure + Extent', v: 'Drop-in for the report formats you already use.', icon: 'formats' },
  { k: 'LLM optional', v: 'Ask-your-data works with or without a model key.', icon: 'llm' },
  { k: 'Single binary', v: 'Or pip, or Docker. Pick your packaging.', icon: 'binary' },
];

function OssTrust({ showBadges }) {
  return (
    <section style={{ padding: '100px 0 80px', background: '#fff', borderTop: '1px solid var(--border-subtle)' }}>
      <div style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 40 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>// built honestly</div>
            <h2 style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: '-0.025em', fontWeight: 650, margin: 0, color: 'var(--text-primary)' }}>
              Local-first. Open from day one.
            </h2>
          </div>
          {showBadges && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Badge label="MIT" value="License" />
              <Badge label="0.4.2" value="PyPI" mono />
              <Badge label="312★" value="GitHub" />
              <Badge label="Python 3.10+" value="" />
            </div>
          )}
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1, background: 'var(--border-subtle)',
          border: '1px solid var(--border-subtle)', borderRadius: 14,
          overflow: 'hidden',
        }}>
          {TRUST.map(t => (
            <div key={t.k} style={{ background: '#fff', padding: '24px 24px 26px' }}>
              <div style={{ marginBottom: 14 }}><TrustIcon kind={t.icon} /></div>
              <div style={{ fontSize: 15, fontWeight: 650, color: 'var(--text-primary)', letterSpacing: '-0.005em', marginBottom: 4 }}>{t.k}</div>
              <div style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{t.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Badge({ label, value, mono }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'stretch',
      border: '1px solid var(--border-default)', borderRadius: 6, overflow: 'hidden',
      fontSize: 11.5, fontFamily: 'Inter, sans-serif',
    }}>
      {value && (
        <span style={{ background: '#475569', color: '#fff', padding: '3px 8px' }}>{value}</span>
      )}
      <span className={mono ? 'mono' : ''} style={{
        background: 'var(--accent)', color: '#fff', padding: '3px 8px', fontWeight: 600,
      }}>{label}</span>
    </span>
  );
}

function TrustIcon({ kind }) {
  const box = {
    width: 32, height: 32, borderRadius: 8,
    background: 'var(--accent-tint)', color: 'var(--accent-ink)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  const map = {
    oss: '◯',
    local: '⌂',
    sqlite: '▭',
    formats: '⇄',
    llm: '✦',
    binary: '▣',
  };
  return <div style={box}><span style={{ fontSize: 16 }}>{map[kind]}</span></div>;
}

// ─────────────────────────────────────────────────────────────────
//  FINAL CTA
// ─────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section style={{ padding: '80px 0 120px', textAlign: 'center' }}>
      <div style={containerStyle}>
        <h2 style={{
          fontSize: 56, lineHeight: 1.05, letterSpacing: '-0.03em',
          fontWeight: 650, margin: 0, color: 'var(--text-primary)',
          maxWidth: 820, marginInline: 'auto',
        }}>
          Start analyzing test reports<br />in minutes.
        </h2>
        <p style={{ fontSize: 17, color: 'var(--text-muted)', marginTop: 18, maxWidth: 560, marginInline: 'auto', lineHeight: 1.6 }}>
          One command from <span className="mono" style={{ background: 'var(--bg-elevated)', padding: '1px 7px', borderRadius: 5, color: 'var(--text-secondary)' }}>pip install</span> to a browser tab full of answers.
        </p>
        <div style={{ display: 'inline-flex', gap: 12, marginTop: 32 }}>
          <PrimaryBtn href="#">Get started →</PrimaryBtn>
          <GhostBtn href="#" icon={<GitHubIcon size={16} />}>GitHub</GhostBtn>
        </div>
        <div style={{ marginTop: 30, display: 'flex', justifyContent: 'center' }}>
          <PipPill />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
//  FOOTER
// ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '40px 0 60px', background: '#fff' }}>
      <div style={{ ...containerStyle, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LensMark size={18} />
          <span style={{ fontWeight: 650, letterSpacing: '-0.01em' }}>QA Lens</span>
          <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>· MIT · 2026</span>
        </div>
        <div style={{ display: 'flex', gap: 28, fontSize: 13, color: 'var(--text-muted)' }}>
          <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>Docs</a>
          <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>GitHub</a>
          <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>PyPI</a>
          <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>Demo</a>
          <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>Changelog</a>
          <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>Roadmap</a>
        </div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>
          built by qa engineers, for qa engineers
        </div>
      </div>
    </footer>
  );
}

function GitHubIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.7.5.7 5.6.7 11.9c0 5 3.3 9.3 7.8 10.8.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.2 1.2.9-.3 1.9-.4 2.9-.4s2 .1 2.9.4c2.2-1.5 3.2-1.2 3.2-1.2.6 1.7.2 2.9.1 3.2.7.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.5-1.5 7.8-5.8 7.8-10.8C23.3 5.6 18.3.5 12 .5z" />
    </svg>
  );
}

window.QALensSite = QALensSite;
