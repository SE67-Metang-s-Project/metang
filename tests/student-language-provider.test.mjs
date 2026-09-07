import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");

test("student route layout provides language context to all nested pages", () => {
  const layout = read("app/student/layout.tsx");
  assert.match(layout, /import \{ StudentLanguageProvider \}/);
  assert.match(
    layout,
    /<StudentLanguageProvider>\s*\{children\}\s*<\/StudentLanguageProvider>/s,
  );
});