import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf-8");
}

test("DisburseDebtCard provides preview functionality for transfer slip evidence", () => {
  const content = read("components/shared/disburse-debt/DisburseDebtCard.tsx");

  // Check for previewSlipUrl state and modal dismiss hook
  assert.match(
    content,
    /const\s*\[previewSlipUrl,\s*setPreviewSlipUrl\]\s*=\s*useState<string\s*\|\s*null>\(null\);/,
    "DisburseDebtCard must have previewSlipUrl state",
  );
  assert.match(
    content,
    /const\s*slipPreviewModalDismiss\s*=\s*useModalDismiss/,
    "DisburseDebtCard must handle modal dismissal for slip preview",
  );

  // Check for full preview button in completed slip section
  assert.match(
    content,
    /<button[\s\S]*?onClick=\{\(\)\s*=>\s*setPreviewSlipUrl\(selectedRequest\.slipUrl[\s\S]*?ดูรูปขนาดเต็ม[\s\S]*?<\/button>/,
    "DisburseDebtCard must have a 'ดูรูปขนาดเต็ม' button in the completed slip section",
  );

  // Check for clickable image container with hover overlay
  assert.match(
    content,
    /onClick=\{\(\)\s*=>\s*setPreviewSlipUrl\(selectedRequest\.slipUrl[\s\S]*?คลิกเพื่อดูภาพขนาดเต็ม/,
    "DisburseDebtCard must allow clicking the slip image with 'คลิกเพื่อดูภาพขนาดเต็ม' overlay",
  );

  // Check for preview button for newly uploaded slip
  assert.match(
    content,
    /onClick=\{\(\)\s*=>\s*setPreviewSlipUrl\(uploadedSlip\)\}[\s\S]*?ดูตัวอย่าง/,
    "DisburseDebtCard must allow previewing uploaded slip",
  );

  // Check for Slip Preview Modal (Lightbox)
  assert.match(
    content,
    /\{previewSlipUrl\s*&&/,
    "DisburseDebtCard must render a preview modal when previewSlipUrl is set",
  );
  assert.match(
    content,
    /สลิปหลักฐานการโอนเงินขนาดเต็ม/,
    "DisburseDebtCard preview modal must display full-sized slip image",
  );
});
