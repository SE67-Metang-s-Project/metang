import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf-8");
}

test("RequestTimeline component is created and follows student LoanTimeline design", () => {
  const content = read("components/shared/RequestTimeline.tsx");

  assert.match(content, /loanTimeline/, "Must use loanTimeline CSS class");
  assert.match(content, /loanTimelineItem/, "Must use loanTimelineItem CSS class");
  assert.match(content, /timelineMarker/, "Must use timelineMarker CSS class");
  assert.match(content, /timelineMarkerPending/, "Must support timelineMarkerPending");
  assert.match(content, /timelineMarkerRevision/, "Must support timelineMarkerRevision");
  assert.match(content, /timelineMarkerFailed/, "Must support timelineMarkerFailed");
  assert.match(content, /timelineContent/, "Must use timelineContent CSS class");
  assert.match(content, /timelineCommentCard/, "Must support timelineCommentCard");
  assert.match(content, /Clock3/, "Must use Clock3 icon");
  assert.match(content, /ติดตามสถานะคำร้อง/, "Must default title to ติดตามสถานะคำร้อง");
});

test("RequestsCard and DisburseDebtCard use RequestTimeline", () => {
  const requestsCard = read("components/shared/pending/RequestsCard.tsx");
  const disburseDebtCard = read("components/shared/disburse-debt/DisburseDebtCard.tsx");

  // RequestsCard
  assert.match(requestsCard, /<RequestTimeline\s+history=\{selectedRequest\.history\}/, "RequestsCard must use RequestTimeline");
  assert.doesNotMatch(requestsCard, /border-l-2 border-orange-200/, "RequestsCard must not use old border-l-2 timeline");

  // DisburseDebtCard
  assert.match(disburseDebtCard, /<RequestTimeline\s+history=\{selectedRequest\.history\}/, "DisburseDebtCard must use RequestTimeline");
  assert.doesNotMatch(disburseDebtCard, /border-l-2 border-orange-200/, "DisburseDebtCard must not use old border-l-2 timeline");
});

test("VerifySlipCard modal title is ตรวจสอบการชำระเงิน and contains only กำหนดการและประวัติการชำระเงิน", () => {
  const verifySlipCard = read("components/shared/verify-slip/VerifySlipCard.tsx");

  assert.match(
    verifySlipCard,
    /<h2[^>]*>\s*ตรวจสอบการชำระเงิน\s*<\/h2>/,
    "VerifySlipCard main modal title must be ตรวจสอบการชำระเงิน",
  );
  assert.match(
    verifySlipCard,
    /title="กำหนดการและประวัติการชำระเงิน"/,
    "VerifySlipCard must contain กำหนดการและประวัติการชำระเงิน box",
  );
  assert.doesNotMatch(
    verifySlipCard,
    /title="ข้อมูลธนาคาร"/,
    "VerifySlipCard must not contain ข้อมูลธนาคาร box",
  );
  assert.doesNotMatch(
    verifySlipCard,
    /title="ข้อมูลการกู้ยืม"/,
    "VerifySlipCard must not contain ข้อมูลการกู้ยืม box",
  );
  assert.doesNotMatch(
    verifySlipCard,
    /<RequestTimeline/,
    "VerifySlipCard must not contain RequestTimeline in main modal",
  );
});

test("RequestsCard and DisburseDebtCard hide comments and bank details in RequestTimeline", () => {
  const requestsCard = read("components/shared/pending/RequestsCard.tsx");
  const disburseDebtCard = read("components/shared/disburse-debt/DisburseDebtCard.tsx");
  const requestTimeline = read("components/shared/RequestTimeline.tsx");

  assert.match(requestTimeline, /hideComments\?: boolean/, "RequestTimeline must support hideComments prop");
  assert.match(requestTimeline, /hideBankDetails\?: boolean/, "RequestTimeline must support hideBankDetails prop");
  assert.match(requestsCard, /<RequestTimeline[\s\S]*?hideComments/, "RequestsCard must set hideComments");
  assert.match(requestsCard, /<RequestTimeline[\s\S]*?hideBankDetails/, "RequestsCard must set hideBankDetails");
  assert.match(disburseDebtCard, /<RequestTimeline[\s\S]*?hideComments/, "DisburseDebtCard must set hideComments");
  assert.match(disburseDebtCard, /<RequestTimeline[\s\S]*?hideBankDetails/, "DisburseDebtCard must set hideBankDetails");
});

test("DisburseDebtCard approval comments box wraps long comments and text properly", () => {
  const disburseDebtCard = read("components/shared/disburse-debt/DisburseDebtCard.tsx");
  assert.match(
    disburseDebtCard,
    /break-words\s+whitespace-pre-wrap[\s\S]*?approval\.comment/,
    "DisburseDebtCard must use break-words and whitespace-pre-wrap on approval comment",
  );
  assert.match(
    disburseDebtCard,
    /approval\.actorName[\s\S]*?break-words/,
    "DisburseDebtCard must use break-words on approval actorName",
  );
});

