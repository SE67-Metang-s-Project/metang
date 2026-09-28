import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { detectSlipContentType } from "../lib/slip-file-type";

const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d];
const PDF = [...Buffer.from("%PDF-1.7\n%\xe2\xe3\xcf\xd3\n", "latin1")];

const file = (bytes: number[] | string, type: string) =>
  new File([typeof bytes === "string" ? bytes : new Uint8Array(bytes)], "slip", { type });

test("detects JPEG, PNG and PDF from their leading bytes", async () => {
  assert.equal(await detectSlipContentType(file(JPEG, "image/jpeg")), "image/jpeg");
  assert.equal(await detectSlipContentType(file(PNG, "image/png")), "image/png");
  assert.equal(await detectSlipContentType(file(PDF, "application/pdf")), "application/pdf");
});

test("the bytes win over the declared type", async () => {
  // A real PNG the browser labelled as something else is still stored as a PNG...
  assert.equal(await detectSlipContentType(file(PNG, "application/octet-stream")), "image/png");
  assert.equal(await detectSlipContentType(file(JPEG, "")), "image/jpeg");
  // ...and a text file labelled image/png is refused.
  assert.equal(await detectSlipContentType(file("hello, this is not a png", "image/png")), null);
  assert.equal(await detectSlipContentType(file("<html><script>", "application/pdf")), null);
  // GIF is not an allowed slip type, whatever it claims to be.
  assert.equal(await detectSlipContentType(file("GIF89a......", "image/jpeg")), null);
});

test("an empty or truncated file matches nothing", async () => {
  assert.equal(await detectSlipContentType(file([], "image/png")), null);
  assert.equal(await detectSlipContentType(file([0xff, 0xd8], "image/jpeg")), null);
  assert.equal(await detectSlipContentType(file(PNG.slice(0, 7), "image/png")), null);
  assert.equal(await detectSlipContentType(file("%PDF", "application/pdf")), null);
});

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const uploadRoutes = {
  repayment: read("app/api/student/payments/route.ts"),
  disbursement: read("app/api/admin/loan-requests/[id]/disburse/route.ts"),
};

for (const [kind, route] of Object.entries(uploadRoutes)) {
  test(`the ${kind} route refuses a spoofed file before storing anything`, () => {
    // Nothing reads the browser-declared type: detection alone picks the type and extension.
    assert.doesNotMatch(route, /slip\.type/);
    assert.match(route, /const contentType = await detectSlipContentType\(slip\);/);
    assert.match(
      route,
      new RegExp(
        String.raw`if \(!contentType \|\| !ext\) \{\s*return apiError\("VALIDATION_ERROR", ` +
          String.raw`"Unsupported slip file type", 422\);`,
      ),
    );
    assert.match(route, /await uploadSlip\(\{ path: slipPath, contentType, bytes \}\)/);

    const upload = route.indexOf("await uploadSlip(");
    const detect = route.indexOf("await detectSlipContentType(slip)");
    assert.ok(detect > -1 && detect < route.indexOf("if (!contentType"));
    assert.ok(route.indexOf('"Unsupported slip file type", 422') < upload);
    assert.ok(route.indexOf("buildSlipPath(") < upload);
    // The existing size limit still applies before the upload.
    assert.ok(route.indexOf("slip.size > MAX_SLIP_BYTES") < upload);
  });
}
