// Renders the Markdown guides to PDF: markdown-it -> HTML -> Chromium (puppeteer-core).
//
//   node render.mjs                       the six guides in docs/documentation -> docs/documentation/pdf
//   node render.mjs --out <dir> a.md b.md  other files, other folder
//   node render.mjs --audit-only          check the layout, write no PDF
//
// Every page is measured before it is printed (auditLayout). The command exits 1 when the audit finds
// text that would be cut off, run off the page, or be broken in the middle of a word. Needs Chromium
// (CHROMIUM_PATH, default /usr/bin/chromium), plus the fonts Liberation Sans, Liberation Mono and
// Noto Sans Thai.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import hljs from "highlight.js";
import MarkdownIt from "markdown-it";
import anchor from "markdown-it-anchor";
import puppeteer from "puppeteer-core";

const here = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(here, "../..");
export const CHROMIUM = process.env.CHROMIUM_PATH ?? "/usr/bin/chromium";

// A4 with these margins leaves 180 mm = 680 CSS px for the text.
export const MARGIN_MM = { top: 18, bottom: 18, left: 15, right: 15 };
export const CONTENT_WIDTH_PX = Math.round(((210 - MARGIN_MM.left - MARGIN_MM.right) / 25.4) * 96);

export const DEFAULT_FILES = [
  "docs/documentation/developer-guide.en.md",
  "docs/documentation/developer-guide.th.md",
  "docs/documentation/maintenance-guide.en.md",
  "docs/documentation/maintenance-guide.th.md",
  "docs/documentation/user-manual-staff.md",
  "docs/documentation/user-manual-student.md",
];

// GitHub-style heading ids, so the in-page links of a contents list work (Thai letters are kept).
const slugify = (s) =>
  s.trim().toLowerCase().replace(/[^\p{L}\p{N}\p{M}\- _]/gu, "").replace(/ /g, "-");

// Fence names that highlight.js does not know.
const langAlias = { dotenv: "ini", cron: "bash", sh: "bash", text: "plaintext" };

function highlight(code, lang) {
  const name = langAlias[lang] ?? lang;
  const body =
    name && hljs.getLanguage(name)
      ? hljs.highlight(code, { language: name, ignoreIllegals: true }).value
      : MarkdownIt().utils.escapeHtml(code);
  return `<pre><code class="hljs language-${lang || "text"}">${body}</code></pre>`;
}

const hljsCss = readFileSync(
  path.join(here, "node_modules/highlight.js/styles/github.css"),
  "utf8",
)
  // keep the token colours, drop the block rules: the `pre` rules below style the box
  .replace(/pre code\.hljs\s*\{[^}]*\}/, "")
  .replace(/code\.hljs\s*\{[^}]*\}/, "")
  .replace(/\.hljs\s*\{[^}]*\}/, "");

const css = `
  @page { size: A4; margin: ${MARGIN_MM.top}mm ${MARGIN_MM.right}mm ${MARGIN_MM.bottom}mm ${MARGIN_MM.left}mm; }
  html { font-size: 10.5pt; overflow-wrap: break-word; }
  body { font-family: "Liberation Sans", "Noto Sans Thai", "DejaVu Sans", sans-serif; line-height: 1.5;
         color: #111827; margin: 0; }
  /* Thai tone marks rise above the line box when the line height is small: the marks of a heading at
     the top of a page were then printed in the bottom margin of the page before. 1.5 keeps them inside. */
  h1, h2, h3, h4 { font-weight: 700; line-height: 1.5; break-after: avoid; color: #0f172a; }
  h1 { font-size: 1.9em; margin: 0 0 .4em; padding-bottom: .2em; border-bottom: 2px solid #1d4ed8; }
  h2 { font-size: 1.4em; margin: 1.6em 0 .5em; padding-bottom: .15em; border-bottom: 1px solid #cbd5e1; }
  h3 { font-size: 1.15em; margin: 1.3em 0 .4em; }
  h4 { font-size: 1.02em; margin: 1.1em 0 .3em; }
  p, ul, ol { margin: .5em 0; }
  li { margin: .15em 0; }
  a { color: #1d4ed8; text-decoration: none; }
  /* Liberation Mono has the same ascent and descent as the body font, so the grey box sits level
     with the text; line-height 1 keeps the code from making its line taller. */
  code { font-family: "Liberation Mono", "DejaVu Sans Mono", monospace; font-size: .9em; line-height: 1;
         background: #f1f5f9; padding: .1em .2em; border-radius: 3px; }
  pre { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: .6em .8em;
        white-space: pre-wrap; overflow-wrap: anywhere; }
  pre code { background: none; padding: 0; font-size: .82em; line-height: 1.4; }
  blockquote { margin: .8em 0; padding: .4em .9em; border-left: 4px solid #b45309; background: #fffbeb; }
  blockquote p { margin: .25em 0; }
  /* The column widths are set by fitTables (below). Cells break only between words; a word that is
     wider than its column is the last case, and fitTables marks that column by hand. */
  table { border-collapse: collapse; width: 100%; margin: .7em 0; font-size: .86em; }
  th, td { border: 1px solid #cbd5e1; padding: .3em .5em; vertical-align: top; text-align: left;
           overflow-wrap: break-word; }
  th { background: #e2e8f0; }
  tr { break-inside: avoid; }
  thead { display: table-header-group; }
  img { display: block; max-width: 100%; max-height: 235mm; width: auto; height: auto; margin: .8em auto; }
  hr { border: 0; border-top: 1px solid #cbd5e1; margin: 1.2em 0; }
  em { color: #475569; }
  ${hljsCss}
`;

// A long identifier or address has no place where a line may break, so a narrow table column
// would have to split it in the middle of a word. <wbr> adds a break point after / _ . - : = ? , ; | @ and
// leaves no character in the text that a reader copies.
const BREAK_AFTER = /([/_.\-:=?,;|@])(?=[^\s</])/g;
const ENTITY = /(&(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);)/;
export function addBreakPoints(html) {
  // an entity such as &lt; must stay whole, so only the text between entities gets break points
  const soft = (text) =>
    text.length < 12
      ? text
      : text
          .split(ENTITY)
          .map((part, i) => (i % 2 ? part : part.replace(BREAK_AFTER, "$1<wbr>")))
          .join("");
  return html
    .replace(/<code>([^<]*)<\/code>/g, (m, text) => `<code>${soft(text)}</code>`)
    .replace(/(<a [^>]*>)([^<]*)(<\/a>)/g, (m, open, text, close) => `${open}${soft(text)}${close}`);
}

// A PDF names every link target. A heading id in Thai letters becomes a name of 9 bytes for each
// letter, and the PDF format allows 127 bytes, so a long Thai heading makes a name that some viewers
// refuse (poppler warns about it). Headings and links with a non-ASCII id get a short ASCII id.
export function asciiAnchors(html) {
  const ids = new Map();
  html = html.replace(/(<h[1-6][^>]* id=")([^"]*[^\x00-\x7F][^"]*)(")/g, (m, open, id, close) => {
    const short = `h${ids.size + 1}`;
    ids.set(id, short);
    return open + short + close;
  });
  return html.replace(/href="#([^"]+)"/g, (m, fragment) => {
    let decoded = fragment;
    try {
      decoded = decodeURIComponent(fragment);
    } catch {
      /* keep the fragment as it is */
    }
    const short = ids.get(decoded) ?? ids.get(fragment);
    return short ? `href="#${short}"` : m;
  });
}

/** Markdown file -> { html, title, lang }. `extraCss` is for tests only. */
export function buildHtml(mdPath, { extraCss = "" } = {}) {
  const source = readFileSync(mdPath, "utf8");
  const md = MarkdownIt({ html: true, linkify: true, typographer: false, highlight }).use(anchor, {
    slugify,
  });
  const title = source.match(/^#\s+(.+)$/m)?.[1] ?? path.basename(mdPath);
  let body = md.render(source);
  // keep the "Version covered: ... / Date: ..." lines under the title on separate lines
  body = body.replace(/(<\/h1>\s*<p>)([\s\S]*?)(<\/p>)/, (m, a, text, c) =>
    text.split("\n").length > 1 && text.split("\n").every((l) => /^[^:<]{2,40}: /.test(l))
      ? a + text.replace(/\n/g, "<br>\n") + c
      : m,
  );
  body = asciiAnchors(addBreakPoints(body));
  body = body.replace(/<li>\[ \] /g, "<li>☐ ").replace(/<li>\[x\] /gi, "<li>☑ ");
  const thai = (source.match(/[฀-๿]/g) ?? []).length;
  const lang = thai > source.length * 0.1 ? "th" : "en";
  const safeTitle = title.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${safeTitle}</title>
<base href="${pathToFileURL(path.dirname(mdPath) + path.sep).href}"><style>${css}${extraCss}</style></head><body>${body}</body></html>`;
  return { html, title: safeTitle, lang };
}

/* ---------- in the page ---------- */

// Column widths. w = width of the column when nothing wraps, m = width of its longest word.
// If the table fits, the browser lays it out. If not, every column starts at m. The free space goes
// first to the columns that need little (they stay on one line), and the long columns share the rest.
// If even the longest words do not fit, the columns that are too narrow may break inside a word.
export function fitTables() {
  for (const table of document.querySelectorAll("table")) {
    const rows = [...table.rows];
    const n = rows[0]?.cells.length ?? 0;
    if (n === 0) continue;
    const parent = table.parentElement;
    const cs = getComputedStyle(parent);
    const W = Math.floor(parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) - 1;
    const cells = table.querySelectorAll("th, td");
    const widths = (setup) => {
      table.style.cssText = setup;
      const w = Array(n).fill(0);
      for (const row of rows) [...row.cells].forEach((c, i) => (w[i] = Math.max(w[i], c.offsetWidth)));
      return w;
    };
    cells.forEach((c) => (c.style.whiteSpace = "nowrap"));
    const w = widths("width:max-content;table-layout:auto");
    cells.forEach((c) => (c.style.whiteSpace = ""));
    const m = widths("width:1px;table-layout:auto");
    table.style.cssText = "";
    // a fixed layout gives a cell about 1 px less than the auto layout measured: add a margin
    for (let i = 0; i < n; i++) {
      w[i] += 3;
      m[i] += 3;
    }
    if (w.reduce((a, b) => a + b, 0) <= W) continue;

    const sumM = m.reduce((a, b) => a + b, 0);
    const extra = W - sumM;
    let out;
    if (extra < 0) {
      // Find the width T that every column may have at most: the columns narrower than T keep their
      // longest word whole, and the ones with a huge word (an address, a long identifier) get T.
      let lo = 0;
      let hi = Math.max(...m);
      for (let k = 0; k < 40; k++) {
        const t = (lo + hi) / 2;
        if (m.reduce((a, x) => a + Math.min(x, t), 0) > W) hi = t;
        else lo = t;
      }
      out = m.map((x) => Math.min(x, lo));
    } else {
      const d = w.map((x, i) => x - m[i]);
      let lo = 0;
      let hi = Math.max(...d);
      for (let k = 0; k < 40; k++) {
        const t = (lo + hi) / 2;
        if (d.reduce((a, x) => a + Math.min(x, t), 0) > extra) hi = t;
        else lo = t;
      }
      out = m.map((x, i) => x + Math.min(d[i], lo));
    }
    for (const row of rows) {
      [...row.cells].forEach((c, i) => {
        if (out[i] < m[i] - 1) c.style.overflowWrap = "anywhere";
      });
    }
    const colgroup = document.createElement("colgroup");
    for (const x of out) {
      const col = document.createElement("col");
      col.style.width = x + "px";
      colgroup.append(col);
    }
    table.prepend(colgroup);
    table.style.tableLayout = "fixed";
    table.style.width = W + "px";
  }
}

// Measures the laid-out page and returns the problems: { kind, section, where, detail }.
//   overflow            an element sticks out of the text area
//   clipped             a block holds content wider than itself
//   broken-word         a word that would fit on a line was split in the middle (a squeezed column)
//   squeezed-column     a table column that needs little room got less than it needs
//   broken-image        an image did not load
//   broken-link         a link to a place in the same document that does not exist
export function auditLayout(W) {
  const issues = [];
  const bodyLeft = document.body.getBoundingClientRect().left;
  const sectionOf = (el) => {
    let node = el;
    while (node) {
      let prev = node.previousElementSibling;
      while (prev) {
        if (/^H[1-4]$/.test(prev.tagName)) return prev.textContent.trim().slice(0, 60);
        const inner = prev.querySelectorAll("h1,h2,h3,h4");
        if (inner.length) return inner[inner.length - 1].textContent.trim().slice(0, 60);
        prev = prev.previousElementSibling;
      }
      node = node.parentElement;
    }
    return "";
  };
  const add = (kind, el, detail) =>
    issues.push({
      kind,
      section: sectionOf(el),
      where: `${el.tagName.toLowerCase()}: ${el.textContent.trim().replace(/\s+/g, " ").slice(0, 50)}`,
      detail,
    });

  const blocks = new Set(["TD", "TH", "P", "LI", "PRE", "H1", "H2", "H3", "H4", "BLOCKQUOTE", "TABLE"]);
  for (const el of document.body.querySelectorAll("*")) {
    if (["BR", "COL", "COLGROUP", "STYLE", "SCRIPT"].includes(el.tagName)) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > bodyLeft + W + 1.5 || r.left < bodyLeft - 1.5) {
      add("overflow", el, `${Math.round(r.left - bodyLeft)}..${Math.round(r.right - bodyLeft)} of ${W}`);
    }
    if (blocks.has(el.tagName) && el.scrollWidth > el.clientWidth + 1.5) {
      add("clipped", el, `content ${el.scrollWidth}px in ${el.clientWidth}px`);
    }
    if (el.tagName === "IMG" && !(el.complete && el.naturalWidth > 0)) add("broken-image", el, el.getAttribute("src"));
  }

  for (const link of document.querySelectorAll('a[href^="#"]')) {
    let id = link.getAttribute("href").slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {
      /* use the id as written */
    }
    if (id && !document.getElementById(id)) add("broken-link", link, link.getAttribute("href"));
  }

  // a word split in the middle although it is short enough to fit on a line
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const host = node.parentElement;
    if (host.closest("pre, style, script, title")) continue;
    for (const m of node.nodeValue.matchAll(/[^\s฀-๿]{6,}/g)) {
      const range = document.createRange();
      range.setStart(node, m.index);
      range.setEnd(node, m.index + m[0].length);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0);
      if (new Set(rects.map((r) => Math.round(r.top))).size < 2) continue;
      const natural = rects.reduce((a, r) => a + r.width, 0);
      if (natural > W * 0.45) continue; // a long word may have to break
      let prevTop = null;
      for (let i = 0; i < m[0].length; i++) {
        range.setStart(node, m.index + i);
        range.setEnd(node, m.index + i + 1);
        const top = Math.round(range.getBoundingClientRect().top);
        if (prevTop !== null && Math.abs(top - prevTop) > 3 && /[A-Za-z0-9]/.test(m[0][i - 1]) && /[A-Za-z0-9]/.test(m[0][i])) {
          const key = m[0] + natural;
          if (!seen.has(key + host.tagName)) {
            seen.add(key + host.tagName);
            add("broken-word", host, `"${m[0]}" is split after "${m[0].slice(0, i)}"`);
          }
          break;
        }
        prevTop = top;
      }
    }
  }

  // A column that needs little room but gets far less than it needs (under 60%) is squeezed. A
  // column may wrap between words; the broken-word check above finds a split inside a word.
  for (const table of document.querySelectorAll("table")) {
    const rows = [...table.rows];
    const cells = [...table.querySelectorAll("th, td")];
    cells.forEach((c) => (c.style.whiteSpace = "nowrap"));
    const needed = [];
    for (const row of rows) [...row.cells].forEach((c, i) => (needed[i] = Math.max(needed[i] ?? 0, c.scrollWidth)));
    cells.forEach((c) => (c.style.whiteSpace = ""));
    [...rows[0].cells].forEach((head, i) => {
      if (needed[i] > W * 0.22) return;
      const got = Math.min(...rows.map((row) => row.cells[i].clientWidth));
      if (got < needed[i] * 0.6) {
        add("squeezed-column", head, `needs ${Math.round(needed[i])}px, has ${Math.round(got)}px`);
      }
    });
  }
  return issues;
}

/* ---------- Node side ---------- */

export async function launch() {
  return puppeteer.launch({ executablePath: CHROMIUM, args: ["--no-sandbox", "--disable-gpu"] });
}

/**
 * Lays out one Markdown file, audits it and (unless pdf is null) prints it.
 * Returns { issues, title, text } (text: what the page shows, for comparison with the PDF).
 */
export async function renderFile(browser, mdPath, pdfPath, options = {}) {
  const { html, title } = buildHtml(mdPath, options);
  const dir = mkdtempSync(path.join(tmpdir(), "docs-pdf-"));
  const htmlPath = path.join(dir, "page.html");
  writeFileSync(htmlPath, html);
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: CONTENT_WIDTH_PX, height: 1000 });
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    if (options.fit !== false) await page.evaluate(fitTables);
    const issues = await page.evaluate(auditLayout, CONTENT_WIDTH_PX);
    const text = await page.evaluate(() => document.body.innerText);
    if (pdfPath) {
      mkdirSync(path.dirname(pdfPath), { recursive: true });
      await page.pdf({
        path: pdfPath,
        format: "A4",
        printBackground: true,
        displayHeaderFooter: true,
        margin: Object.fromEntries(Object.entries(MARGIN_MM).map(([k, v]) => [k, `${v}mm`])),
        headerTemplate: `<div style="font:8px 'Liberation Sans','Noto Sans Thai',sans-serif;color:#64748b;width:100%;padding:0 ${MARGIN_MM.left}mm;"><span>${title}</span></div>`,
        footerTemplate: `<div style="font:8px 'Liberation Sans',sans-serif;color:#64748b;width:100%;padding:0 ${MARGIN_MM.right}mm;text-align:right;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
      });
    }
    return { issues, title, text };
  } finally {
    await page.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

function formatIssues(file, issues) {
  return issues
    .map((i) => `  ${path.basename(file)} [${i.kind}] ${i.section ? `(${i.section}) ` : ""}${i.where} -- ${i.detail}`)
    .join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const auditOnly = args.includes("--audit-only");
  const outIndex = args.indexOf("--out");
  const outDir = path.resolve(repoRoot, outIndex >= 0 ? args[outIndex + 1] : "docs/documentation/pdf");
  const files = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--out");
  const browser = await launch();
  let failed = false;
  try {
    for (const file of files.length ? files : DEFAULT_FILES) {
      const src = path.resolve(repoRoot, file);
      const pdf = auditOnly ? null : path.join(outDir, path.basename(src, ".md") + ".pdf");
      const { issues } = await renderFile(browser, src, pdf);
      console.log(`${pdf ? "wrote " + path.relative(repoRoot, pdf) : "audited " + file}: ${issues.length} layout problem(s)`);
      if (issues.length) {
        console.log(formatIssues(file, issues));
        failed = true;
      }
    }
  } finally {
    await browser.close();
  }
  process.exit(failed ? 1 : 0);
}
