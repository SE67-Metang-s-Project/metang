import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf-8");
}

test("VerifySlipCard provides preview functionality for payment slip evidence", () => {
  const content = read("components/shared/verify-slip/VerifySlipCard.tsx");

  // Check for previewSlipUrl state and modal dismiss hook
  assert.match(
    content,
    /const\s*\[previewSlipUrl,\s*setPreviewSlipUrl\]\s*=\s*useState<string\s*\|\s*null>\(null\);/,
    "VerifySlipCard must have previewSlipUrl state",
  );
  assert.match(
    content,
    /const\s*slipPreviewModalDismiss\s*=\s*useModalDismiss/,
    "VerifySlipCard must handle modal dismissal for slip preview",
  );

  // Check for clickable image container with hover overlay
  assert.match(
    content,
    /onClick=\{\(\)\s*=>\s*setPreviewSlipUrl\(selectedEvidence\.slipImageUrl\)\}[\s\S]*?คลิกเพื่อดูภาพขนาดเต็ม/,
    "VerifySlipCard must allow clicking the slip image with 'คลิกเพื่อดูภาพขนาดเต็ม' overlay",
  );

  // Check for Slip Preview Modal (Lightbox)
  assert.match(
    content,
    /\{previewSlipUrl\s*&&/,
    "VerifySlipCard must render a preview modal when previewSlipUrl is set",
  );
  assert.match(
    content,
    /สลิปหลักฐานการชำระเงินขนาดเต็ม/,
    "VerifySlipCard preview modal must display full-sized slip image",
  );
  assert.match(
    content,
    /ดูภาพต้นฉบับ/,
    "VerifySlipCard preview modal must have original image link button",
  );
});
