import { mkdir, writeFile } from "node:fs/promises";
import { request } from "node:https";

const repoRaw = "https://raw.githubusercontent.com/Arulprasath36/QALens/main/docs";
const repoSource = "https://github.com/Arulprasath36/QALens/blob/main/docs";

const configuredPages = [
  { file: "index.md", slug: "index", title: "QA Lens Documentation", group: "Learn", description: "Overview, documentation map, architecture summary, and recommended reading path." },
  { file: "getting-started.md", slug: "getting-started", title: "Getting Started", group: "Use", description: "First successful run from a clean machine." },
  { file: "installation.md", slug: "installation", title: "Installation", group: "Use", description: "PyPI install, source install, development setup, and requirements." },
  { file: "docker.md", slug: "docker", title: "Docker", group: "Use", description: "Run QA Lens with Docker, ingest reports, upgrade containers, and configure deployment." },
  { file: "ingesting-reports.md", slug: "ingesting-reports", title: "Ingesting Reports", group: "Use", description: "Supported formats, ingestion commands, artifact policy, projects, owners, and database behavior." },
  { file: "cli-reference.md", slug: "cli-reference", title: "CLI Reference", group: "Use", description: "Practical command reference for qalens." },
  { file: "ui-guide.md", slug: "ui-guide", title: "UI Guide", group: "Use", description: "Runs, Action Brief, Incidents, Analysis, Risk, Compare, Chat, Reports, and Settings." },
  { file: "insight-engine.md", slug: "insight-engine", title: "Insight Engine", group: "Operate", description: "Deterministic intelligence, clustering, risk, flakiness, and comparisons." },
  { file: "chat-and-llm.md", slug: "chat-and-llm", title: "Chat and LLMs", group: "Operate", description: "Deterministic answers, local LLMs, cloud providers, and security boundaries." },
  { file: "api-reference.md", slug: "api-reference", title: "API Reference", group: "Operate", description: "Swagger/OpenAPI location and endpoint groups." },
  { file: "security-and-deployment.md", slug: "security-and-deployment", title: "Security and Deployment", group: "Operate", description: "Auth, local-first defaults, LLM opt-in, report parsing, and deployment notes." },
  { file: "troubleshooting.md", slug: "troubleshooting", title: "Troubleshooting", group: "Operate", description: "Common setup, ingestion, UI, LLM, and API issues." },
  { file: "architecture.md", slug: "architecture", title: "Architecture", group: "Extend", description: "Internal pipeline and module map." },
  { file: "parser-strategy.md", slug: "parser-strategy", title: "Parser Strategy", group: "Extend", description: "How QA Lens parses and normalizes report formats." },
  { file: "plugin-guide.md", slug: "plugin-guide", title: "Plugin Guide", group: "Extend", description: "How to extend QA Lens with plugins." },
  { file: "roadmap.md", slug: "roadmap", title: "Roadmap", group: "Extend", description: "Planned product and engineering direction." },
];

function titleFromFile(file) {
  return file
    .replace(/\.md$/, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const configuredByFile = new Map(configuredPages.map((page) => [page.file, page]));
const sourceIndex = await fetchText(`${repoRaw}/index.md`);
const indexLinkedFiles = [...sourceIndex.matchAll(/\]\(([^)#]+\.md)(?:#[^)]+)?\)/g)]
  .map((match) => match[1]);
const sourceFiles = [...new Set(["index.md", ...configuredPages.map((page) => page.file), ...indexLinkedFiles])];
const pages = sourceFiles
  .map((file) => configuredByFile.get(file) || {
    file,
    slug: file.replace(/\.md$/, ""),
    title: titleFromFile(file),
    group: "Extend",
    description: "QA Lens documentation.",
  })
  .sort((left, right) => {
    const leftIndex = configuredPages.findIndex((page) => page.file === left.file);
    const rightIndex = configuredPages.findIndex((page) => page.file === right.file);
    if (leftIndex === -1 && rightIndex === -1) return left.title.localeCompare(right.title);
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });

const pageByFile = new Map(pages.map((page) => [page.file, page]));
const pageBySlug = new Map(pages.map((page) => [page.slug, page]));

function fetchText(url) {
  return new Promise((resolve, reject) => {
    request(url, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        reject(new Error(`Failed ${url}: ${res.statusCode}`));
        res.resume();
        return;
      }
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => resolve(data));
    }).on("error", reject).end();
  });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

function localDocHref(href) {
  const clean = href.replace(/^\.\//, "");
  const [path, hash = ""] = clean.split("#");
  if (path.endsWith(".md")) {
    const page = pageByFile.get(path);
    if (page) return `${page.slug === "index" ? "index" : page.slug}.html${hash ? `#${slugify(hash)}` : ""}`;
  }
  return href;
}

function stripMarkdown(value) {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>#|~\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inlineMarkdown(value) {
  let text = escapeHtml(value);
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, src) => {
    const safeSrc = escapeHtml(src);
    return `<img src="${safeSrc}" alt="${escapeHtml(alt)}">`;
  });
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
    const localHref = localDocHref(href);
    const external = /^https?:\/\//.test(localHref);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${escapeHtml(localHref)}"${attrs}>${label}</a>`;
  });
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return text;
}

function parseTable(lines, start) {
  const rows = [];
  let index = start;
  while (index < lines.length && /^\s*\|.*\|\s*$/.test(lines[index])) {
    rows.push(lines[index]);
    index += 1;
  }
  if (rows.length < 2 || !/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(rows[1])) {
    return null;
  }
  const cells = (row) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
  const headers = cells(rows[0]);
  const body = rows.slice(2).map(cells);
  const html = [
    "<div class=\"table-wrap\"><table>",
    `<thead><tr>${headers.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("")}</tr></thead>`,
    `<tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`).join("")}</tbody>`,
    "</table></div>",
  ].join("");
  return { html, next: index };
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  const toc = [];
  let paragraph = [];
  let list = null;
  let inCode = false;
  let codeLang = "";
  let code = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    html.push(`<${list.type}>${list.items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</${list.type}>`);
    list = null;
  };
  const flushCode = () => {
    html.push(`<pre><code${codeLang ? ` class="language-${escapeHtml(codeLang)}"` : ""}>${escapeHtml(code.join("\n"))}</code></pre>`);
    code = [];
    codeLang = "";
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        flushParagraph();
        flushList();
        inCode = true;
        codeLang = line.slice(3).trim();
      }
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }

    const table = parseTable(lines, i);
    if (table) {
      flushParagraph();
      flushList();
      html.push(table.html);
      i = table.next - 1;
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const text = heading[2].replace(/\s+#*$/, "");
      const id = slugify(text);
      if (level <= 3) toc.push({ level, text: text.replace(/`/g, ""), id });
      html.push(`<h${level} id="${id}">${inlineMarkdown(text)}</h${level}>`);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      flushParagraph();
      flushList();
      html.push(`<blockquote>${inlineMarkdown(line.replace(/^\s*>\s?/, ""))}</blockquote>`);
      continue;
    }

    const unordered = /^\s*[-*]\s+(.+)$/.exec(line);
    const ordered = /^\s*\d+\.\s+(.+)$/.exec(line);
    if (unordered || ordered) {
      flushParagraph();
      const type = unordered ? "ul" : "ol";
      if (!list || list.type !== type) flushList();
      if (!list) list = { type, items: [] };
      list.items.push((unordered || ordered)[1]);
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  if (inCode) flushCode();
  return { html: html.join("\n"), toc };
}

function pageHref(page) {
  return page.slug === "index" ? "index.html" : `${page.slug}.html`;
}

function sidebar(activeSlug) {
  const groups = ["Learn", "Use", "Operate", "Extend"];
  return groups.map((group) => {
    const links = pages
      .filter((page) => page.group === group)
      .map((page) => `<a class="side-link${page.slug === activeSlug ? " active" : ""}" href="./${pageHref(page)}">${page.title}</a>`)
      .join("\n");
    return `<div class="sidebar-group">
        <h2 class="sidebar-title">${group}</h2>
        ${links}
      </div>`;
  }).join("\n");
}

function tocHtml(toc) {
  if (!toc.length) return '<p class="toc-empty">No headings on this page.</p>';
  return toc
    .filter((item) => item.level >= 2)
    .map((item) => `<a class="toc-level-${item.level}" href="#${item.id}">${escapeHtml(item.text)}</a>`)
    .join("\n");
}

function layout(page, body, toc) {
  const title = `${page.title} | QA Lens Docs`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <link rel="icon" type="image/png" href="../qalens-favicon.png">
  <link rel="apple-touch-icon" href="../qalens-favicon.png">
  <link rel="stylesheet" href="./styles.css">
  <script defer src="./search.js"></script>
</head>
<body>
  <header class="topbar">
    <div class="topbar-inner">
      <a class="brand" href="../">
        <img src="../qalens-logo.png" alt="QA Lens">
        <span class="brand-badge">Docs</span>
      </a>
      <div class="search" role="search">
        <svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <input id="docs-search" type="search" autocomplete="off" spellcheck="false" placeholder="Search docs" aria-label="Search documentation">
        <div class="search-results" id="docs-search-results" role="listbox" hidden></div>
      </div>
      <nav class="top-links" aria-label="Documentation navigation">
        <a href="../">Product</a>
        <a href="./api-reference.html">APIs</a>
        <a href="https://github.com/Arulprasath36/QALens" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href="https://qalens-demo.onrender.com/" target="_blank" rel="noopener noreferrer">Demo</a>
      </nav>
    </div>
  </header>

  <div class="docs-shell">
    <aside class="sidebar" aria-label="Documentation sections">
      ${sidebar(page.slug)}
    </aside>

    <main class="article">
      <article class="doc-content">
        ${body}
        <div class="edit-source">
          <a href="${repoSource}/${page.file}" target="_blank" rel="noopener noreferrer">View source on GitHub</a>
        </div>
      </article>
    </main>

    <aside class="toc" aria-label="On this page">
      <h2 class="toc-title">On this page</h2>
      ${tocHtml(toc)}
    </aside>
  </div>
</body>
</html>`;
}

const styles = `:root {
  color-scheme: light;
  --page: #fbfcfe;
  --surface: #ffffff;
  --surface-soft: #f5f7fb;
  --ink: #0b1220;
  --muted: #526173;
  --faint: #7d8b9d;
  --line: #e4e9f1;
  --line-strong: #cbd5e1;
  --brand: #2563eb;
  --brand-dark: #1e40af;
  --brand-soft: #eaf1ff;
  --shadow-sm: 0 1px 2px rgba(16, 24, 40, .06);
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--page);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
a { color: inherit; }
img { display: block; max-width: 100%; }
code {
  padding: 2px 5px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface-soft);
  color: #0f172a;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: .92em;
}
pre {
  margin: 18px 0;
  padding: 18px;
  overflow: auto;
  border-radius: 8px;
  background: #0b1220;
  color: #dbeafe;
  font-size: 13px;
  line-height: 1.7;
}
pre code {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
}
.icon { width: 16px; height: 16px; flex: 0 0 16px; }
.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  border-bottom: 1px solid rgba(203, 213, 225, .72);
  background: rgba(251, 252, 254, .9);
  backdrop-filter: blur(14px) saturate(160%);
}
.topbar-inner {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
  width: min(1440px, calc(100% - 40px));
  margin: 0 auto;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: 198px;
  color: var(--ink);
  text-decoration: none;
  font-weight: 850;
}
.brand img { width: 138px; height: auto; mix-blend-mode: multiply; }
.brand-badge {
  padding: 4px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #fff;
  color: var(--brand-dark);
  font-size: 12px;
  font-weight: 800;
}
.top-links {
  display: flex;
  align-items: center;
  gap: 22px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 700;
}
.top-links a { text-decoration: none; }
.top-links a:hover { color: var(--ink); }
.search {
  position: relative;
  width: min(360px, 30vw);
  height: 38px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  color: var(--faint);
  font-size: 13px;
  box-shadow: var(--shadow-sm);
}
.search input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
  font: inherit;
}
.search input::placeholder { color: var(--faint); }
.search-results {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 50;
  max-height: min(460px, calc(100vh - 90px));
  overflow: auto;
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 18px 45px rgba(15, 23, 42, .14);
}
.search-result,
.search-empty {
  display: block;
  padding: 11px 12px;
  border-radius: 8px;
  text-decoration: none;
}
.search-result:hover,
.search-result:focus {
  outline: 0;
  background: var(--brand-soft);
}
.search-result strong {
  display: block;
  color: var(--ink);
  font-size: 13px;
  line-height: 1.3;
}
.search-result span,
.search-empty {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.45;
}
.docs-shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 240px;
  gap: 34px;
  width: min(1440px, calc(100% - 40px));
  margin: 0 auto;
  align-items: start;
}
.sidebar,
.toc {
  position: sticky;
  top: 86px;
  height: calc(100vh - 104px);
  overflow: auto;
  padding: 22px 0;
}
.sidebar {
  border-right: 1px solid var(--line);
  padding-right: 22px;
}
.sidebar-group { margin-bottom: 28px; }
.sidebar-title,
.toc-title {
  margin: 0 0 10px;
  color: var(--faint);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.side-link {
  display: flex;
  align-items: center;
  min-height: 34px;
  padding: 8px 10px;
  border-radius: 8px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
  text-decoration: none;
}
.side-link:hover,
.side-link.active {
  background: var(--brand-soft);
  color: var(--brand-dark);
}
.article {
  min-width: 0;
  padding: 54px 0 90px;
}
.doc-content {
  max-width: 850px;
}
.doc-content h1 {
  margin: 0 0 20px;
  color: var(--ink);
  font-size: clamp(38px, 5vw, 62px);
  line-height: 1.04;
  letter-spacing: 0;
}
.doc-content h2 {
  margin: 46px 0 14px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
  color: var(--ink);
  font-size: clamp(26px, 3vw, 38px);
  line-height: 1.12;
  letter-spacing: 0;
}
.doc-content h3 {
  margin: 30px 0 10px;
  color: var(--ink);
  font-size: 22px;
  line-height: 1.25;
}
.doc-content h4 {
  margin: 24px 0 8px;
  color: var(--ink);
  font-size: 17px;
}
.doc-content p,
.doc-content li {
  color: var(--muted);
  font-size: 15.5px;
  line-height: 1.75;
}
.doc-content p { margin: 14px 0; }
.doc-content ul,
.doc-content ol {
  margin: 14px 0 20px;
  padding-left: 24px;
}
.doc-content li + li { margin-top: 7px; }
.doc-content a {
  color: var(--brand-dark);
  font-weight: 750;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}
blockquote {
  margin: 18px 0;
  padding: 14px 18px;
  border-left: 3px solid var(--brand);
  border-radius: 8px;
  background: var(--brand-soft);
  color: var(--brand-dark);
}
.table-wrap {
  overflow: auto;
  margin: 20px 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
}
table {
  width: 100%;
  border-collapse: collapse;
  min-width: 620px;
}
th,
td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  vertical-align: top;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.55;
}
th {
  background: var(--surface-soft);
  color: var(--ink);
  font-weight: 850;
}
tr:last-child td { border-bottom: 0; }
.edit-source {
  margin-top: 54px;
  padding-top: 22px;
  border-top: 1px solid var(--line);
}
.edit-source a {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  color: var(--ink);
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  box-shadow: var(--shadow-sm);
}
.toc {
  border-left: 1px solid var(--line);
  padding-left: 22px;
}
.toc a {
  display: block;
  padding: 7px 0;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
  text-decoration: none;
}
.toc a:hover { color: var(--brand-dark); }
.toc-level-3 { padding-left: 12px !important; font-size: 12.5px !important; }
.toc-empty {
  color: var(--faint);
  font-size: 13px;
}
@media (max-width: 1080px) {
  .docs-shell { grid-template-columns: 240px minmax(0, 1fr); }
  .toc { display: none; }
  .search { display: none; }
  .top-links { gap: 16px; }
}
@media (max-width: 760px) {
  .topbar-inner { width: min(100% - 28px, 1440px); }
  .brand { min-width: 0; }
  .brand img { width: 126px; }
  .brand-badge { display: none; }
  .top-links a:nth-child(1),
  .top-links a:nth-child(2) { display: none; }
  .docs-shell {
    width: min(100% - 28px, 1440px);
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: static;
    height: auto;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    border-right: 0;
    border-bottom: 1px solid var(--line);
    padding: 20px 0;
  }
  .sidebar-group { margin-bottom: 0; }
  .article { padding-top: 34px; }
}
@media (max-width: 520px) {
  .sidebar { grid-template-columns: 1fr; }
  .doc-content h1 { font-size: 38px; }
}`;

function buildSearchScript(searchIndex) {
  return `const SEARCH_INDEX = ${JSON.stringify(searchIndex)};

(() => {
  const input = document.getElementById("docs-search");
  const results = document.getElementById("docs-search-results");
  if (!input || !results) return;

  function clearResults() {
    results.replaceChildren();
    results.hidden = true;
  }

  function snippet(content, terms) {
    const lower = content.toLowerCase();
    const firstHit = terms
      .map((term) => lower.indexOf(term))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b)[0] ?? 0;
    const start = Math.max(0, firstHit - 72);
    const end = Math.min(content.length, start + 170);
    const prefix = start > 0 ? "... " : "";
    const suffix = end < content.length ? " ..." : "";
    return prefix + content.slice(start, end).trim() + suffix;
  }

  function score(doc, terms) {
    const title = doc.title.toLowerCase();
    const description = doc.description.toLowerCase();
    const content = doc.content.toLowerCase();
    let total = 0;
    for (const term of terms) {
      let matched = false;
      if (title.includes(term)) {
        total += 12;
        matched = true;
      }
      if (description.includes(term)) {
        total += 6;
        matched = true;
      }
      if (content.includes(term)) {
        total += 2;
        matched = true;
      }
      if (!matched) return 0;
    }
    return total;
  }

  function render(matches, terms) {
    results.replaceChildren();
    if (!matches.length) {
      const empty = document.createElement("div");
      empty.className = "search-empty";
      empty.textContent = "No docs found.";
      results.append(empty);
      results.hidden = false;
      return;
    }

    for (const match of matches.slice(0, 7)) {
      const link = document.createElement("a");
      link.className = "search-result";
      link.href = match.href;
      link.setAttribute("role", "option");

      const title = document.createElement("strong");
      title.textContent = match.title;
      const summary = document.createElement("span");
      summary.textContent = snippet(match.content || match.description, terms);

      link.append(title, summary);
      results.append(link);
    }
    results.hidden = false;
  }

  input.addEventListener("input", () => {
    const terms = input.value.toLowerCase().trim().split(/\\s+/).filter(Boolean);
    if (!terms.length) {
      clearResults();
      return;
    }
    const matches = SEARCH_INDEX
      .map((doc) => ({ ...doc, score: score(doc, terms) }))
      .filter((doc) => doc.score > 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
    render(matches, terms);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      input.value = "";
      clearResults();
      input.blur();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "Enter") return;
    const first = results.querySelector(".search-result");
    if (!first) return;
    event.preventDefault();
    if (event.key === "Enter") {
      first.click();
    } else {
      first.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".search")) clearResults();
  });
})();
`;
}

await mkdir("docs", { recursive: true });
await writeFile("docs/styles.css", styles);

const searchIndex = [];
for (const page of pages) {
  const markdown = await fetchText(`${repoRaw}/${page.file}`);
  const converted = markdownToHtml(markdown);
  searchIndex.push({
    title: page.title,
    group: page.group,
    description: page.description,
    href: pageHref(page),
    content: stripMarkdown(markdown).slice(0, 14000),
  });
  await writeFile(`docs/${pageHref(page)}`, layout(page, converted.html, converted.toc));
}
await writeFile("docs/search.js", buildSearchScript(searchIndex));

const redirect = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>QA Lens Docs</title>
  <meta http-equiv="refresh" content="0; url=./docs/">
  <link rel="canonical" href="./docs/">
</head>
<body>
  <p><a href="./docs/">Open QA Lens documentation</a></p>
</body>
</html>
`;
await writeFile("docs.html", redirect);

console.log(`Generated ${pages.length} documentation pages in ./docs`);
