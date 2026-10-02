// Tests of the PDF renderer. Run: npm test (in docs/docs-pdf). Needs Chromium, poppler-utils
// (pdftotext, pdffonts) and fontconfig. It is not part of the app's `npm test` and not run in CI.
//
//   1. the fixture (every text situation) lays out with no audit problem
//   2. the printed PDF: text inside the margins, no text lost, no empty page, known fonts only
//   3. the audit does catch the old squeezed layout (a test that cannot fail proves nothing)
//   4. the four real guides pass the same checks
//   5. every character of the fixture and the guides has a glyph in the font stack
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { DEFAULT_FILES, MARGIN_MM, launch, renderFile, repoRoot } from "../render.mjs";
import { fixtureMarkdown } from "./fixture.mjs";

const PT_PER_MM = 72 / 25.4;
const FONT_STACK = ["Liberation Sans", "Noto Sans Thai", "DejaVu Sans", "Liberation Mono", "DejaVu Sans Mono"];
const ALLOWED_FONTS = /^(LiberationSans|LiberationMono|NotoSansThai|DejaVuSans|DejaVuSansMono|NotoSansMono)/;

let browser;
let dir;
const out = (name) => path.join(dir, name);

before(async () => {
  browser = await launch();
  dir = mkdtempSync(path.join(tmpdir(), "docs-pdf-test-"));
});
after(async () => {
  await browser?.close();
  if (dir) rmSync(dir, { recursive: true, force: true });
});

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  assert.equal(r.status, 0, `${cmd} failed: ${r.stderr}`);
  return r.stdout;
}

const decodeEntities = (s) =>
  s.replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/** The words of a PDF with their boxes, from pdftotext -bbox. */
function pdfWords(pdf) {
  const xml = run("pdftotext", ["-bbox", pdf, "-"]);
  const pages = [];
  for (const m of xml.matchAll(/<page width="([\d.]+)" height="([\d.]+)">([\s\S]*?)<\/page>/g)) {
    const words = [...m[3].matchAll(/<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g)].map(
      (w) => ({ x0: +w[1], y0: +w[2], x1: +w[3], y1: +w[4], text: decodeEntities(w[5]) }),
    );
    pages.push({ width: +m[1], height: +m[2], words });
  }
  return pages;
}

/** Checks that hold for every printed PDF. Returns the text of the body without header and footer. */
function checkPdf(pdf, { sentinels = [] } = {}) {
  const pages = pdfWords(pdf);
  assert.ok(pages.length >= 1, "the PDF has no page");
  const imagePages = new Set(
    run("pdfimages", ["-list", pdf]).split("\n").slice(2).map((l) => +l.trim().split(/\s+/)[0]).filter(Boolean),
  );
  const top = MARGIN_MM.top * PT_PER_MM;
  const left = MARGIN_MM.left * PT_PER_MM;
  const bodyWords = [];
  pages.forEach((page, index) => {
    const right = page.width - MARGIN_MM.right * PT_PER_MM;
    const bottom = page.height - MARGIN_MM.bottom * PT_PER_MM;
    // header and footer lie wholly inside the top and bottom margins; tall Thai marks may reach above the first line
    const body = page.words.filter((w) => w.y1 > top + 2 && w.y0 < bottom - 2);
    // Header and footer sit in the margins, 45 pt from the edge of the page at most. Anything else in
    // a margin is ink that overflowed from the next page (tall Thai tone marks do this).
    const stray = page.words.filter(
      (w) => !body.includes(w) && w.y1 > 45 && w.y0 < page.height - 45,
    );
    assert.deepEqual(
      stray.map((w) => `${w.text} at y=${w.y0.toFixed(0)}`),
      [],
      `page ${index + 1}: text in the margin that is neither header nor footer`,
    );
    assert.ok(body.length > 0 || imagePages.has(index + 1), `page ${index + 1} has no text and no image (an empty page)`);
    for (const w of body) {
      assert.ok(
        w.x0 >= left - 2 && w.x1 <= right + 2,
        `page ${index + 1}: "${w.text}" is outside the margins (${w.x0.toFixed(0)}..${w.x1.toFixed(0)} of ${left.toFixed(0)}..${right.toFixed(0)})`,
      );
    }
    bodyWords.push(...body.map((w) => w.text));
  });
  // poppler warns when the PDF breaks its format (for example a link name longer than 127 bytes)
  const info = spawnSync("pdfinfo", [pdf], { encoding: "utf8" });
  assert.equal(info.stderr.trim(), "", `pdfinfo warns about ${path.basename(pdf)}: ${info.stderr.split("\n")[0]}`);
  const fonts = run("pdffonts", [pdf])
    .split("\n")
    .slice(2)
    .map((l) => l.trim().split(/\s+/)[0]?.replace(/^[A-Z]{6}\+/, ""))
    .filter(Boolean);
  const unknown = fonts.filter((f) => !ALLOWED_FONTS.test(f));
  assert.deepEqual(unknown, [], `fonts outside the stack: ${unknown.join(", ")}`);
  const missing = sentinels.filter((s) => !bodyWords.some((w) => w.includes(s)));
  assert.deepEqual(missing, [], `text lost from the PDF: ${missing.join(", ")}`);
  return { pages: pages.length, text: bodyWords.join(" ") };
}

/** Every character that the page shows must be in the PDF at least as often (order does not matter). */
function brokenEntities(source, pageText) {
  // markdown source "&lt;" in text is shown as "<", so an entity in the page text is a mistake,
  // unless the source holds the same entity inside code (shown as typed)
  const entity = /&(?:lt|gt|amp|quot|apos|#\d+|#x[0-9a-fA-F]+);/g;
  const wanted = (source.match(entity) ?? []).length;
  const shown = (pageText.match(entity) ?? []).length;
  return shown === wanted ? [] : [`${shown} entities shown, ${wanted} in the source`];
}

function lostCharacters(pageText, pdfText) {
  const count = (str) => {
    const m = new Map();
    for (const ch of str.replace(/[\s\u200B-\u200D]/g, "")) m.set(ch, (m.get(ch) ?? 0) + 1);
    return m;
  };
  const shown = count(pageText);
  const printed = count(pdfText);
  return [...shown].filter(([ch, n]) => (printed.get(ch) ?? 0) < n).map(([ch, n]) => `${ch} x${n - (printed.get(ch) ?? 0)}`);
}

const describeIssues = (issues) =>
  issues.map((i) => `[${i.kind}] (${i.section}) ${i.where} -- ${i.detail}`).join("\n");

describe("fixture: every text situation", () => {
  let md;
  let sentinels;
  let pageText;
  before(() => {
    md = out("fixture.md");
    const text = fixtureMarkdown();
    writeFileSync(md, text);
    sentinels = [...new Set(text.match(/ZSENT[A-Z0-9]+/g))];
  });

  test("the fixture holds all situations", () => {
    for (const id of ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "P1", "P2", "P3", "C1", "L1", "Q1", "I1"]) {
      assert.match(readFileSync(md, "utf8"), new RegExp(`^#{2} ${id} `, "m"), `section ${id} is missing`);
    }
    assert.ok(sentinels.length >= 30);
  });

  test("the layout has no overflow, clipped text, split word, or squeezed column", async () => {
    const pdf = out("fixture.pdf");
    const { issues, text } = await renderFile(browser, md, pdf);
    assert.equal(issues.length, 0, `layout problems:\n${describeIssues(issues)}`);
    pageText = text;
  });

  test("the printed PDF keeps all text inside the margins", () => {
    const { pages, text } = checkPdf(out("fixture.pdf"), { sentinels });
    assert.ok(pages >= 8, `expected a long document, got ${pages} pages`);
    // the long table cell (T9) crosses a page: its first and last lines must both be there
    assert.match(text, /Line 1\b/);
    assert.match(text, /Line 80\b/);
    // Thai text was shaped: the text layer has the Thai words
    assert.match(text, /ระบบ/);
    assert.deepEqual(lostCharacters(pageText, text), [], "characters shown on the page but not in the PDF");
    assert.deepEqual(brokenEntities(readFileSync(md, "utf8"), pageText), [], "a character entity is shown as text");
  });
});

describe("the audit catches the squeezed layout", () => {
  test("without fitTables, and with a word break anywhere, the squeeze is reported", async () => {
    const md = out("fixture.md");
    writeFileSync(md, fixtureMarkdown());
    const { issues } = await renderFile(browser, md, null, {
      fit: false,
      extraCss: "th, td { overflow-wrap: anywhere !important; }",
    });
    const kinds = new Set(issues.map((i) => i.kind));
    assert.ok(kinds.has("broken-word") || kinds.has("squeezed-column"), `nothing reported: ${[...kinds]}`);
    const sections = new Set(issues.map((i) => i.section));
    assert.ok([...sections].some((s) => /^T[12] /.test(s)), `T1 or T2 not named: ${[...sections]}`);
  });

  test("a table wider than the page is reported as overflow", async () => {
    const md = out("wide.md");
    writeFileSync(md, `# Wide\n\n## W1 Wide\n\n| A | B |\n|---|---|\n| ${"x".repeat(200)} | y |\n`);
    const { issues } = await renderFile(browser, md, null, {
      fit: false,
      extraCss: "th, td { overflow-wrap: normal !important; } table { table-layout: auto !important; }",
    });
    assert.ok(issues.some((i) => i.kind === "overflow" || i.kind === "clipped"), "overflow not reported");
  });

  test("a link to a missing heading is reported, and a Thai heading link works", async () => {
    const md = out("links.md");
    writeFileSync(md, "# Links\n\n[to nowhere](#no-such-heading)\n\n[to a Thai heading](#หัวข้อภาษาไทยที่ยาวมาก)\n\n## หัวข้อภาษาไทยที่ยาวมาก\n\nข้อความ\n");
    const { issues } = await renderFile(browser, md, null);
    const links = issues.filter((i) => i.kind === "broken-link");
    assert.equal(links.length, 1, describeIssues(issues));
    assert.match(links[0].detail, /no-such-heading/);
  });

  test("a missing image is reported", async () => {
    const md = out("broken.md");
    writeFileSync(md, "# Broken\n\n![nothing](does-not-exist.png)\n");
    const { issues } = await renderFile(browser, md, null);
    assert.ok(issues.some((i) => i.kind === "broken-image"));
  });
});

describe("the guides", () => {
  for (const file of DEFAULT_FILES) {
    test(`${path.basename(file)}: layout, margins, and code text`, async () => {
      const src = path.join(repoRoot, file);
      const pdf = out(path.basename(file, ".md") + ".pdf");
      const { issues, text: pageText } = await renderFile(browser, src, pdf);
      assert.equal(issues.length, 0, `layout problems:\n${describeIssues(issues)}`);
      const { text } = checkPdf(pdf);
      assert.deepEqual(lostCharacters(pageText, text), [], "characters shown on the page but not in the PDF");
      assert.deepEqual(brokenEntities(readFileSync(src, "utf8"), pageText), [], "a character entity is shown as text");
    });
  }
});

describe("fonts", () => {
  test("every character has a glyph in the font stack", () => {
    const sources = [fixtureMarkdown(), ...DEFAULT_FILES.map((f) => readFileSync(path.join(repoRoot, f), "utf8"))];
    const chars = new Set();
    for (const text of sources) for (const ch of text) if (ch.codePointAt(0) > 0x7e) chars.add(ch);
    const covered = new Set();
    for (const family of FONT_STACK) {
      // the regular face is enough: all faces of a family share the characters that matter here
      const file = run("fc-match", ["-f", "%{file}", `${family}:style=Regular`]).trim();
      const py = spawnSync(
        "python3",
        ["-c", "import sys,json;from fontTools.ttLib import TTFont;print(json.dumps(sorted(TTFont(sys.argv[1]).getBestCmap().keys())))", file],
        { encoding: "utf8" },
      );
      if (py.status === 0) for (const cp of JSON.parse(py.stdout)) covered.add(cp);
    }
    assert.ok(covered.size > 1000, "could not read the fonts (is fontTools installed?)");
    const missing = [...chars].filter((ch) => !covered.has(ch.codePointAt(0)) && !/[​-‍️]/.test(ch));
    assert.deepEqual(
      missing.map((ch) => `${ch} U+${ch.codePointAt(0).toString(16).toUpperCase()}`),
      [],
      "characters with no glyph in the font stack",
    );
  });
});
