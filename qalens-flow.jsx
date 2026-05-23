// QA Lens — animated flow diagram (v3, sequential)
// Visualizes: report artifacts → ingest → normalized JSON → qalens.db →
// indexed rows → deterministic analysis → outputs (Web UI · CLI · reports · LLM)
//
// v3 changes:
//  • Animation runs SEQUENTIALLY through stages, not all at once.
//    Each phase activates its stage + the particles entering it, then hands
//    off to the next phase.
//  • Data-shape callouts are INLINE between stages (no side callouts that
//    collide with output cables).
//  • Ingest strip slimmed to badge + title only.
//  • Removed "sqlite · local · portable history" subtitle under DB.

const COLORS = {
  bg:        '#f4f6fb',
  panel:     '#ffffff',
  panelDark: '#0b1530',
  border:    '#e2e8f0',
  borderStrong: '#cbd5e1',
  text:      '#0b1530',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  accent:    '#4f46e5',
  accentTint:'#eef2ff',
  accentInk: '#3730a3',
  green:     '#10b981',
  greenInk:  '#047857',
};

const SOURCES = [
  { id: 'allure',  name: 'Allure HTML',     ext: '.html', dot: '#7c3aed' },
  { id: 'extent',  name: 'Extent HTML',     ext: '.html', dot: '#0ea5e9' },
  { id: 'junit',   name: 'JUnit XML',       ext: '.xml',  dot: '#f59e0b' },
  { id: 'testng',  name: 'TestNG XML',      ext: '.xml',  dot: '#10b981' },
  { id: 'pw',      name: 'Playwright JSON', ext: '.json', dot: '#ef4444' },
  { id: 'cymo',    name: 'Cypress / Mocha', ext: '.json', dot: '#8b5cf6' },
];

const OUTPUTS = [
  { id: 'webui',   name: 'Web UI',            sub: 'runs · incidents · compare' },
  { id: 'cli',     name: 'CLI',               sub: '$ qalens runs · diff · analyze', mono: true },
  { id: 'reports', name: 'Shareable reports', sub: 'HTML · Markdown · JSON' },
  { id: 'llm',     name: 'Optional LLM chat', sub: 'opt-in · explanations' },
];

// ── Layout ──────────────────────────────────────────────────────────────────
// 5 stacked elements in middle column, all inline (no side callouts).
// Vertical rhythm (top→bottom): Ingest → pipe → JSON card → pipe → DB → BIG
// pipe with arrow → Rows card → BIG pipe with arrow → Analysis. The two
// "BIG" pipes around the rows card are deliberately wider than the rest so
// users can see the data leaving the store and entering analysis.
const SRC      = { x: 60,  y: 210, w: 218, h: 44, gap: 14 };  // 6 chips → 334 tall
const ING      = { x: 460, y: 124, w: 320, h: 46 };
const JSON_C   = { x: 460, y: 188, w: 320, h: 60 };
const DB       = { x: 540, y: 290, w: 200, h: 140 };          // slimmer + shorter
const ROW_C    = { x: 460, y: 470, w: 320, h: 60 };
const ANA      = { x: 460, y: 560, w: 320, h: 78 };           // shorter step 04
const OUT      = { x: 950, y: 223, w: 270, h: 68, gap: 12 }; // 4 cards → 308 tall

const srcRight = (i) => ({
  x: SRC.x + SRC.w,
  y: SRC.y + i * (SRC.h + SRC.gap) + SRC.h / 2,
});
const ingLeft = (i) => ({
  x: ING.x,
  y: ING.y + ((i + 1) / 7) * ING.h,
});
const outLeft = (i) => ({
  x: OUT.x,
  y: OUT.y + i * (OUT.h + OUT.gap) + OUT.h / 2,
});

// Bezier helpers ────────────────────────────────────────────────────────────
function cablePath(a, b, kink = 0.55) {
  const dx = (b.x - a.x) * kink;
  return {
    p0: a,
    p1: { x: a.x + dx, y: a.y },
    p2: { x: b.x - dx, y: b.y },
    p3: b,
    d: `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`,
  };
}
function vCablePath(a, b) {
  const dy = (b.y - a.y) * 0.5;
  return {
    p0: a, p1: { x: a.x, y: a.y + dy },
    p2: { x: b.x, y: b.y - dy }, p3: b,
    d: `M ${a.x} ${a.y} C ${a.x} ${a.y + dy}, ${b.x} ${b.y - dy}, ${b.x} ${b.y}`,
  };
}
function bezierAt(path, u) {
  const { p0, p1, p2, p3 } = path;
  const v = 1 - u;
  return {
    x: v*v*v*p0.x + 3*v*v*u*p1.x + 3*v*u*u*p2.x + u*u*u*p3.x,
    y: v*v*v*p0.y + 3*v*v*u*p1.y + 3*v*u*u*p2.y + u*u*u*p3.y,
  };
}

const cx = (rect) => rect.x + rect.w / 2;

// All paths in the pipeline ─────────────────────────────────────────────────
const PATHS = {
  srcToIng:  SOURCES.map((_, i) => cablePath(srcRight(i), ingLeft(i))),
  ingToJson: vCablePath({ x: cx(ING),    y: ING.y + ING.h },    { x: cx(JSON_C), y: JSON_C.y }),
  jsonToDb:  vCablePath({ x: cx(JSON_C), y: JSON_C.y + JSON_C.h }, { x: cx(DB), y: DB.y + 14 }),
  dbToRow:   vCablePath({ x: cx(DB),     y: DB.y + DB.h - 14 },  { x: cx(ROW_C), y: ROW_C.y }),
  rowToAna:  vCablePath({ x: cx(ROW_C),  y: ROW_C.y + ROW_C.h }, { x: cx(ANA),   y: ANA.y }),
  anaToOut:  OUTPUTS.map((_, i) =>
    cablePath({ x: ANA.x + ANA.w, y: ANA.y + ((i + 1) / 5) * ANA.h }, outLeft(i))
  ),
};

// ── Sequential timing ───────────────────────────────────────────────────────
// Each phase has [start, end] when the corresponding *flow* is active.
// Stages stay visible throughout but only "light up" during their own phase.
const TOTAL = 9.0;
const T = {
  srcEntry:    [0.0, 1.4],   // chips fade in
  srcStream:   [0.5, 2.4],   // particles flow source → ingest
  ingestLit:   [0.8, 2.8],
  ingestStream:[2.4, 4.0],   // ingest → JSON card → DB
  jsonLit:     [2.7, 4.0],
  dbLit:       [3.4, 5.4],
  dbFill:      [3.0, 5.0],   // db cylinder fills with rows
  dbStream:    [5.0, 6.6],   // db → row card → analysis
  rowLit:      [5.3, 6.6],
  analysisLit: [6.2, 7.8],
  outStream:   [7.4, 8.6],   // analysis → outputs
  outLit:      [7.4, 9.0],   // each output lights up sequentially within this window
};

// Soft envelope: 0 → 1 → 0 over [start, end] with fade-in/out ramps
function envelope(time, [start, end], fade = 0.35) {
  if (time < start || time > end) return 0;
  const a = clamp((time - start) / fade, 0, 1);
  const b = clamp((end - time) / fade, 0, 1);
  return Math.min(a, b);
}
// Smoothed pulse — peaks once in middle of range
function bell(time, [start, end]) {
  if (time < start || time > end) return 0;
  const u = (time - start) / (end - start);
  return Math.sin(u * Math.PI);
}

// ── Scene ───────────────────────────────────────────────────────────────────
function FlowScene() {
  const time = useTime();

  // Stage activation intensities (used for border/glow)
  const ingestLit   = bell(time, T.ingestLit);
  const jsonLit     = bell(time, T.jsonLit);
  const dbLit       = bell(time, T.dbLit);
  const rowLit      = bell(time, T.rowLit);
  const analysisLit = bell(time, T.analysisLit);

  // Particle stream intensities (gates rendering)
  const srcStream    = envelope(time, T.srcStream);
  const ingestStream = envelope(time, T.ingestStream);
  const dbStream     = envelope(time, T.dbStream);
  const outStream    = envelope(time, T.outStream);

  // Source chip entry — staggered
  const srcEntry = (i) => {
    const t0 = T.srcEntry[0] + i * 0.07;
    return Easing.easeOutCubic(clamp((time - t0) / 0.55, 0, 1));
  };

  // DB fill grows during dbFill window
  const dbFill = Easing.easeOutCubic(
    clamp((time - T.dbFill[0]) / (T.dbFill[1] - T.dbFill[0]), 0, 1)
  );

  // Output card activation — sequential, one after the other
  const outActivate = (i) => {
    const t0 = T.outLit[0] + i * 0.28;
    return Easing.easeOutCubic(clamp((time - t0) / 0.55, 0, 1));
  };

  return (
    <div style={{
      position: 'absolute', inset: 0,
      fontFamily: 'Inter, system-ui, sans-serif',
      color: COLORS.text,
    }}>
      <BackgroundGrid />

      {/* Header */}
      <Header time={time} />

      {/* SVG connector + particle layer */}
      <svg
        width="1280" height="720" viewBox="0 0 1280 720"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <defs>
          <radialGradient id="particleGrad" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="1"/>
            <stop offset="60%" stopColor="#4f46e5" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="particleGradOut" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#10b981" stopOpacity="1"/>
            <stop offset="60%" stopColor="#10b981" stopOpacity="0.55"/>
            <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
          </radialGradient>
          {/* Arrow marker used on internal pipe connectors so flow direction is
              explicit even when no particles are visible. */}
          <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5"
            markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#94a3b8"/>
          </marker>
        </defs>

        {/* Static connectors */}
        {PATHS.srcToIng.map((p, i) => (
          <path key={`s2i-${i}`} d={p.d} fill="none"
            stroke={COLORS.borderStrong} strokeOpacity={0.5}
            strokeWidth="1" strokeDasharray="3 4"/>
        ))}
        <path d={PATHS.ingToJson.d} fill="none"
          stroke={COLORS.borderStrong} strokeOpacity={0.75} strokeWidth="1.4"
          markerEnd="url(#arrow)"/>
        <path d={PATHS.jsonToDb.d} fill="none"
          stroke={COLORS.borderStrong} strokeOpacity={0.75} strokeWidth="1.4"
          markerEnd="url(#arrow)"/>
        <path d={PATHS.dbToRow.d} fill="none"
          stroke={COLORS.borderStrong} strokeOpacity={0.85} strokeWidth="1.6"
          markerEnd="url(#arrow)"/>
        <path d={PATHS.rowToAna.d} fill="none"
          stroke={COLORS.borderStrong} strokeOpacity={0.85} strokeWidth="1.6"
          markerEnd="url(#arrow)"/>
        {PATHS.anaToOut.map((p, i) => (
          <path key={`a2o-${i}`} d={p.d} fill="none"
            stroke={COLORS.borderStrong} strokeOpacity={0.5}
            strokeWidth="1" strokeDasharray="3 4"/>
        ))}

        {/* Phase 1: sources → ingest (only during srcStream window) */}
        {srcStream > 0 && PATHS.srcToIng.flatMap((p, i) =>
          stream(p, time, 2, 1.6, T.srcStream[0] + i * 0.05).map((pt, k) => (
            <circle key={`sp-${i}-${k}`}
              cx={pt.x} cy={pt.y} r="6"
              fill="url(#particleGrad)"
              opacity={pt.opacity * srcStream}
            />
          ))
        )}

        {/* Phase 2: ingest → JSON card → DB */}
        {ingestStream > 0 && stream(PATHS.ingToJson, time, 2, 0.9, T.ingestStream[0]).map((pt, k) => (
          <JsonPill key={`ij-${k}`} x={pt.x} y={pt.y} opacity={pt.opacity * ingestStream}/>
        ))}
        {ingestStream > 0 && stream(PATHS.jsonToDb, time, 2, 0.9, T.ingestStream[0] + 0.4).map((pt, k) => (
          <JsonPill key={`jd-${k}`} x={pt.x} y={pt.y} opacity={pt.opacity * ingestStream}/>
        ))}

        {/* Phase 3: db → row card → analysis */}
        {dbStream > 0 && stream(PATHS.dbToRow, time, 2, 0.9, T.dbStream[0]).map((pt, k) => (
          <RowStrip key={`dr-${k}`} x={pt.x} y={pt.y} opacity={pt.opacity * dbStream}/>
        ))}
        {dbStream > 0 && stream(PATHS.rowToAna, time, 2, 0.9, T.dbStream[0] + 0.4).map((pt, k) => (
          <RowStrip key={`ra-${k}`} x={pt.x} y={pt.y} opacity={pt.opacity * dbStream}/>
        ))}

        {/* Phase 4: analysis → outputs */}
        {outStream > 0 && PATHS.anaToOut.flatMap((p, i) =>
          stream(p, time, 2, 1.4, T.outStream[0] + i * 0.18).map((pt, k) => (
            <circle key={`ao-${i}-${k}`}
              cx={pt.x} cy={pt.y} r="6"
              fill="url(#particleGradOut)"
              opacity={pt.opacity * outStream}
            />
          ))
        )}
      </svg>

      {/* Source chips */}
      {SOURCES.map((s, i) => {
        const entry = srcEntry(i);
        return (
          <div key={s.id} style={{
            position: 'absolute',
            left: SRC.x,
            top: SRC.y + i * (SRC.h + SRC.gap),
            width: SRC.w, height: SRC.h,
            background: COLORS.panel,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10,
            boxShadow: '0 1px 0 rgba(15,23,42,0.02)',
            display: 'flex', alignItems: 'center',
            padding: '0 14px', gap: 10,
            opacity: entry,
            transform: `translateY(${(1 - entry) * 6}px)`,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: s.dot, flexShrink: 0,
            }}/>
            <span style={{
              fontSize: 13, fontWeight: 600, color: COLORS.text,
              flex: 1, whiteSpace: 'nowrap',
            }}>{s.name}</span>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, color: COLORS.textFaint,
            }}>{s.ext}</span>
          </div>
        );
      })}
      <ColumnLabel x={SRC.x} y={SRC.y - 28}
        text="01 · report artifacts"
        active={time < T.ingestLit[0]}
      />

      {/* Step 02 — slim Ingest strip */}
      <IngestStrip active={ingestLit}/>

      {/* Inline JSON-shape card */}
      <InlineDataCard
        rect={JSON_C}
        kind="json"
        eyebrow="ingest → writes to qalens.db"
        label="normalized JSON"
        snippet={'{ test_id, suite, status, duration, owner, run_id, … }'}
        active={jsonLit}
      />

      {/* Step 03 — DB cylinder */}
      <DBCylinder
        x={DB.x} y={DB.y} w={DB.w} h={DB.h}
        fill={dbFill}
        pulse={dbLit}
      />

      {/* Inline indexed-rows card */}
      <InlineDataCard
        rect={ROW_C}
        kind="rows"
        eyebrow="analysis ← reads from qalens.db"
        label="indexed rows + facts"
        snippet="tests · runs · failures · timelines · signatures"
        active={rowLit}
      />

      {/* Step 04 — Analysis */}
      <PipelineBox
        x={ANA.x} y={ANA.y} w={ANA.w} h={ANA.h}
        step="04"
        title="Deterministic analysis"
        active={analysisLit}
        chips={['classify', 'cluster', 'risk score', 'flakiness', 'compare']}
        time={time}
        chipsActive={analysisLit > 0.1}
      />

      {/* Step 05 — outputs */}
      {OUTPUTS.map((o, i) => {
        const active = outActivate(i);
        return (
          <div key={o.id} style={{
            position: 'absolute',
            left: OUT.x,
            top: OUT.y + i * (OUT.h + OUT.gap),
            width: OUT.w, height: OUT.h,
            background: COLORS.panel,
            border: `1px solid ${active > 0.4 ? '#bbf7d0' : COLORS.border}`,
            borderRadius: 12,
            boxShadow: active > 0.5
              ? '0 8px 32px rgba(16,185,129,0.16), 0 1px 0 rgba(15,23,42,0.02)'
              : '0 1px 0 rgba(15,23,42,0.02)',
            padding: '11px 14px',
            display: 'flex', flexDirection: 'column', gap: 4,
            transform: `translateX(${(1 - active) * -4}px)`,
            opacity: 0.5 + 0.5 * active,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: active > 0.5 ? COLORS.green : COLORS.textFaint,
                boxShadow: active > 0.5 ? '0 0 0 4px rgba(16,185,129,0.18)' : 'none',
              }}/>
              <span style={{
                fontSize: 13, fontWeight: 650, color: COLORS.text,
                whiteSpace: 'nowrap',
              }}>{o.name}</span>
            </div>
            <div style={{
              fontFamily: o.mono ? 'JetBrains Mono, monospace' : 'inherit',
              fontSize: o.mono ? 11 : 12,
              color: COLORS.textMuted,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{o.sub}</div>
          </div>
        );
      })}
      <ColumnLabel x={OUT.x} y={OUT.y - 28}
        text="05 · outputs"
        active={time > T.analysisLit[0]}
      />

      {/* Footer — phase indicator */}
      <PhaseFooter time={time} />
    </div>
  );
}

// ── Particle stream (returns array of {x,y,opacity} along a path) ───────────
function stream(path, time, count, period, startDelay = 0) {
  const out = [];
  const t = Math.max(0, time - startDelay);
  for (let i = 0; i < count; i++) {
    const phase = ((t / period) + i / count) % 1;
    const u = phase;
    const pos = bezierAt(path, u);
    let opacity = 1;
    if (u < 0.12) opacity = u / 0.12;
    else if (u > 0.88) opacity = (1 - u) / 0.12;
    out.push({ x: pos.x, y: pos.y, opacity });
  }
  return out;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Header({ time }) {
  return (
    <div style={{ position: 'absolute', left: 60, top: 44, right: 60 }}>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11, fontWeight: 500, letterSpacing: '0.06em',
        color: COLORS.accentInk,
        marginBottom: 8,
      }}>
        How QA Lens Works
      </div>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        gap: 24,
      }}>
        <h1 style={{
          margin: 0, fontSize: 28, fontWeight: 650,
          letterSpacing: '-0.02em', lineHeight: 1.15,
        }}>
          Drop reports in. Get a local intelligence layer out.
        </h1>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11, color: COLORS.textMuted,
          display: 'flex', alignItems: 'center', gap: 8,
          whiteSpace: 'nowrap',
        }}>
          <span style={{
            display: 'inline-block',
            width: 8, height: 8, borderRadius: '50%',
            background: COLORS.green,
            boxShadow: '0 0 0 4px rgba(16,185,129,0.18)',
          }}/>
          <span>sequential walkthrough</span>
        </div>
      </div>
    </div>
  );
}

function BackgroundGrid() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      pointerEvents: 'none',
    }}/>
  );
}

function ColumnLabel({ x, y, text, active }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 11, fontWeight: 500, letterSpacing: '0.06em',
      color: active ? COLORS.accentInk : COLORS.textFaint,
      textTransform: 'lowercase',
      transition: 'color 200ms',
    }}>
      {text}
    </div>
  );
}

// Phase indicator under the diagram — visualizes the sequential timeline
function PhaseFooter({ time }) {
  const phases = [
    { id: '01', label: 'report artifacts', start: 0,   end: 1.6 },
    { id: '02', label: 'ingest + normalize', start: 1.6, end: 3.4 },
    { id: '03', label: 'qalens.db',          start: 3.4, end: 5.4 },
    { id: '04', label: 'analysis',           start: 5.4, end: 7.4 },
    { id: '05', label: 'outputs',            start: 7.4, end: 9.0 },
  ];
  return (
    <div style={{
      position: 'absolute',
      left: 60, right: 60, bottom: 18,
      display: 'flex', alignItems: 'center', gap: 10,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 11,
    }}>
      {phases.map((p, i) => {
        const active = time >= p.start && time <= p.end;
        const done   = time > p.end;
        return (
          <React.Fragment key={p.id}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 10px',
              borderRadius: 7,
              background: active ? COLORS.accentTint : 'transparent',
              border: `1px solid ${active ? '#c7d2fe' : COLORS.border}`,
              transition: 'background 150ms, border-color 150ms',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: active ? COLORS.accent : (done ? COLORS.green : COLORS.textFaint),
                boxShadow: active ? '0 0 0 3px rgba(79,70,229,0.18)' : 'none',
              }}/>
              <span style={{
                fontWeight: 500,
                color: active ? COLORS.accentInk : (done ? COLORS.greenInk : COLORS.textMuted),
                letterSpacing: '0.04em',
              }}>{p.id} · {p.label}</span>
            </div>
            {i < phases.length - 1 && (
              <span style={{
                width: 12, height: 1,
                background: done ? COLORS.green : COLORS.border,
              }}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Slim horizontal Ingest strip — badge + title only (no inline sub to wrap)
function IngestStrip({ active }) {
  const lit = active > 0.3;
  return (
    <div style={{
      position: 'absolute',
      left: ING.x, top: ING.y, width: ING.w, height: ING.h,
      background: COLORS.panel,
      border: `1px solid ${lit ? COLORS.accent : COLORS.border}`,
      borderRadius: 12,
      boxShadow: lit
        ? `0 8px 24px rgba(79,70,229,${0.1 + 0.1 * active}), 0 1px 0 rgba(15,23,42,0.02)`
        : '0 2px 8px rgba(15,23,42,0.04), 0 1px 0 rgba(15,23,42,0.02)',
      padding: '0 16px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11, fontWeight: 500,
        color: COLORS.accentInk,
        background: COLORS.accentTint,
        padding: '3px 7px', borderRadius: 5,
        letterSpacing: '0.06em',
        flexShrink: 0,
      }}>02</span>
      <span style={{
        fontSize: 15, fontWeight: 650, color: COLORS.text,
        letterSpacing: '-0.01em',
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>Ingest + normalize</span>
      <span style={{ flex: 1 }}/>
      {lit && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: COLORS.accent,
          boxShadow: `0 0 0 ${4 * active}px rgba(79,70,229,0.18)`,
          flexShrink: 0,
        }}/>
      )}
    </div>
  );
}

function PipelineBox({ x, y, w, h, step, title, sub, active = 0, chips, time = 0, chipsActive = true }) {
  const ring = active;
  return (
    <div style={{
      position: 'absolute',
      left: x, top: y, width: w, height: h,
      background: COLORS.panel,
      border: `1px solid ${ring > 0.3 ? COLORS.accent : COLORS.border}`,
      borderRadius: 14,
      boxShadow: ring > 0.3
        ? `0 8px 32px rgba(79,70,229,${0.1 + 0.12 * ring}), 0 1px 0 rgba(15,23,42,0.02)`
        : '0 2px 8px rgba(15,23,42,0.04), 0 1px 0 rgba(15,23,42,0.02)',
      padding: '8px 14px',
      display: 'flex', flexDirection: 'column', gap: 5,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11, fontWeight: 500,
          color: COLORS.accentInk,
          background: COLORS.accentTint,
          padding: '2px 7px', borderRadius: 5,
          letterSpacing: '0.06em',
          flexShrink: 0,
        }}>{step}</span>
        <span style={{
          fontSize: 15, fontWeight: 650, color: COLORS.text,
          letterSpacing: '-0.01em', whiteSpace: 'nowrap',
        }}>{title}</span>
        <span style={{ flex: 1 }}/>
        {ring > 0.2 && (
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: COLORS.accent,
            opacity: ring,
            boxShadow: `0 0 0 ${4 * ring}px rgba(79,70,229,0.18)`,
          }}/>
        )}
      </div>
      {sub && (
        <div style={{ fontSize: 12.5, color: COLORS.textMuted, lineHeight: 1.4 }}>{sub}</div>
      )}
      {chips && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignContent: 'flex-start' }}>
          {chips.map((c, i) => {
            const phase = ((time * 0.7) + i * 0.15) % 1;
            const lit = chipsActive && phase < 0.2;
            return (
              <span key={c} style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                color: lit ? COLORS.accentInk : COLORS.textMuted,
                background: lit ? COLORS.accentTint : '#f1f5f9',
                border: `1px solid ${lit ? '#c7d2fe' : COLORS.border}`,
                padding: '1px 5px', borderRadius: 4,
                letterSpacing: '0.01em',
                whiteSpace: 'nowrap',
              }}>{c}</span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Inline data-shape card — sits between two stages and labels what's flowing.
// Two-line layout: small eyebrow on top ("who reads/writes this"), then the
// shape: { bracket } label = snippet { bracket }.
function InlineDataCard({ rect, kind, eyebrow, label, snippet, active }) {
  const lit = active > 0.2;
  const bracketL = kind === 'json' ? '{' : '[';
  const bracketR = kind === 'json' ? '}' : ']';
  return (
    <div style={{
      position: 'absolute',
      left: rect.x, top: rect.y, width: rect.w, height: rect.h,
      background: lit ? COLORS.accentTint : '#f8fafc',
      border: `1px dashed ${lit ? COLORS.accent : COLORS.borderStrong}`,
      borderRadius: 10,
      padding: '6px 14px',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      gap: 2,
      transition: 'background 200ms, border-color 200ms',
    }}>
      {eyebrow && (
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10, fontWeight: 500,
          color: lit ? COLORS.accentInk : COLORS.textMuted,
          letterSpacing: '0.04em',
          textTransform: 'lowercase',
          whiteSpace: 'nowrap',
        }}>{eyebrow}</div>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14, fontWeight: 700,
          color: lit ? COLORS.accentInk : COLORS.textMuted,
          width: 16, textAlign: 'center', flexShrink: 0,
        }}>{bracketL}</span>
        <span style={{
          fontSize: 12, fontWeight: 600,
          color: lit ? COLORS.accentInk : COLORS.textMuted,
          flexShrink: 0, whiteSpace: 'nowrap',
        }}>{label}</span>
        <span style={{
          flex: 1,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          color: lit ? COLORS.accentInk : COLORS.textFaint,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          opacity: 0.85,
        }}>{snippet}</span>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14, fontWeight: 700,
          color: lit ? COLORS.accentInk : COLORS.textMuted,
          width: 16, textAlign: 'center', flexShrink: 0,
        }}>{bracketR}</span>
      </div>
    </div>
  );
}

// Particle shapes
function JsonPill({ x, y, opacity }) {
  return (
    <g opacity={opacity}>
      <rect x={x - 18} y={y - 7} width="36" height="14" rx="3"
        fill={COLORS.accentTint} stroke={COLORS.accent} strokeWidth="0.75"/>
      <text x={x} y={y + 3.5}
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="8.5" fontWeight="600"
        fill={COLORS.accentInk}>
        {'{ }'}
      </text>
    </g>
  );
}
function RowStrip({ x, y, opacity }) {
  return (
    <g opacity={opacity}>
      <rect x={x - 22} y={y - 7} width="44" height="14" rx="2"
        fill={COLORS.panel} stroke={COLORS.accent} strokeWidth="0.75"/>
      <rect x={x - 18} y={y - 4} width="10" height="2" rx="1" fill={COLORS.accent} opacity="0.55"/>
      <rect x={x - 5}  y={y - 4} width="10" height="2" rx="1" fill={COLORS.accent} opacity="0.35"/>
      <rect x={x + 8}  y={y - 4} width="10" height="2" rx="1" fill={COLORS.accent} opacity="0.55"/>
      <rect x={x - 18} y={y + 1} width="36" height="2" rx="1" fill={COLORS.accent} opacity="0.25"/>
    </g>
  );
}

// DB cylinder — fill grows as data arrives. No subtitle below.
function DBCylinder({ x, y, w, h, fill = 1, pulse = 0 }) {
  const rx = w / 2;
  const ry = 14;
  const bodyH = h - ry * 2;
  const fillH = bodyH * fill;
  const fillTop = ry + (bodyH - fillH);
  const rows = 8;
  const lit = pulse > 0.3;

  return (
    <div style={{
      position: 'absolute',
      left: x, top: y, width: w, height: h,
    }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{
        position: 'absolute', inset: 0,
        filter: lit
          ? `drop-shadow(0 12px 28px rgba(79,70,229,${0.18 + 0.12 * pulse}))`
          : 'drop-shadow(0 4px 12px rgba(15,23,42,0.08))',
      }}>
        <rect x={1} y={ry} width={w - 2} height={bodyH}
          fill={COLORS.panel}
          stroke={lit ? COLORS.accent : COLORS.borderStrong}
          strokeWidth="1.2"/>
        <g clipPath="url(#dbclip)">
          <rect x={1} y={fillTop} width={w - 2} height={fillH}
            fill={COLORS.accentTint}/>
          {Array.from({ length: rows }).map((_, i) => {
            const ry2 = ry + (bodyH / rows) * i + (bodyH / rows) / 2;
            if (ry2 < fillTop) return null;
            return (
              <rect key={i}
                x={rx - 76} y={ry2 - 3.5}
                width="152" height="7" rx="1.5"
                fill={COLORS.accent} opacity="0.22"
              />
            );
          })}
        </g>
        <defs>
          <clipPath id="dbclip">
            <rect x={1} y={ry} width={w - 2} height={bodyH}/>
          </clipPath>
        </defs>
        <ellipse cx={rx} cy={h - ry} rx={rx - 1} ry={ry}
          fill={COLORS.panel}
          stroke={lit ? COLORS.accent : COLORS.borderStrong}
          strokeWidth="1.2"/>
        <ellipse cx={rx} cy={ry} rx={rx - 1} ry={ry}
          fill={COLORS.panelDark}
          stroke={lit ? COLORS.accent : COLORS.borderStrong}
          strokeWidth="1.2"/>
        <line x1={1} y1={ry} x2={1} y2={h - ry}
          stroke={lit ? COLORS.accent : COLORS.borderStrong} strokeWidth="1.2"/>
        <line x1={w - 1} y1={ry} x2={w - 1} y2={h - ry}
          stroke={lit ? COLORS.accent : COLORS.borderStrong} strokeWidth="1.2"/>
      </svg>

      {/* Dark cap label */}
      <div style={{
        position: 'absolute',
        left: 0, right: 0, top: 0, height: ry * 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12, fontWeight: 600,
        color: '#e2e8f0',
        letterSpacing: '0.02em',
        pointerEvents: 'none',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: lit ? COLORS.green : '#64748b',
          boxShadow: lit ? '0 0 0 3px rgba(16,185,129,0.25)' : 'none',
        }}/>
        qalens.db
      </div>

      {/* Step 03 badge floating left */}
      <div style={{
        position: 'absolute',
        left: -10, top: ry + bodyH / 2 - 12,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11, fontWeight: 500,
        color: COLORS.accentInk,
        background: COLORS.accentTint,
        padding: '3px 7px', borderRadius: 5,
        letterSpacing: '0.06em',
        transform: 'translateX(-100%)',
        whiteSpace: 'nowrap',
      }}>03 · store</div>
    </div>
  );
}

function QALensFlow() {
  return (
    <Stage
      width={1280}
      height={720}
      duration={TOTAL}
      background={COLORS.bg}
      controls={false}
      persistKey={null}
      loop={true}
    >
      <FlowScene />
    </Stage>
  );
}

window.QALensFlow = QALensFlow;
