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

test("RequestsCard, DisburseDebtCard, and VerifySlipCard all use RequestTimeline", () => {
  const requestsCard = read("components/shared/pending/RequestsCard.tsx");
  const disburseDebtCard = read("components/shared/disburse-debt/DisburseDebtCard.tsx");
  const verifySlipCard = read("components/shared/verify-slip/VerifySlipCard.tsx");

  // RequestsCard
  assert.match(requestsCard, /<RequestTimeline\s+history=\{selectedRequest\.history\}/, "RequestsCard must use RequestTimeline");
  assert.doesNotMatch(requestsCard, /border-l-2 border-orange-200/, "RequestsCard must not use old border-l-2 timeline");

  // DisburseDebtCard
  assert.match(disburseDebtCard, /<RequestTimeline\s+history=\{selectedRequest\.history\}/, "DisburseDebtCard must use RequestTimeline");
  assert.doesNotMatch(disburseDebtCard, /border-l-2 border-orange-200/, "DisburseDebtCard must not use old border-l-2 timeline");

  // VerifySlipCard
  assert.match(verifySlipCard, /<RequestTimeline\s+history=\{selectedRequest\.history\}/, "VerifySlipCard must use RequestTimeline");
  assert.doesNotMatch(verifySlipCard, /border-l-2 border-orange-200/, "VerifySlipCard must not use old border-l-2 timeline");
});

test("RequestsCard hides comments and bank details in RequestTimeline", () => {
  const requestsCard = read("components/shared/pending/RequestsCard.tsx");
  const requestTimeline = read("components/shared/RequestTimeline.tsx");

  assert.match(requestTimeline, /hideComments\?: boolean/, "RequestTimeline must support hideComments prop");
  assert.match(requestTimeline, /hideBankDetails\?: boolean/, "RequestTimeline must support hideBankDetails prop");
  assert.match(requestsCard, /<RequestTimeline[\s\S]*?hideComments/, "RequestsCard must set hideComments");
  assert.match(requestsCard, /<RequestTimeline[\s\S]*?hideBankDetails/, "RequestsCard must set hideBankDetails");
});

