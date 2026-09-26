import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

test("active student requests keep Show Log available even without source history", () => {
  const dashboard = read("components/student/dashboard/StudentDashboard.tsx");
  const loanTimeline = read("components/student/loan-details/LoanTimeline.tsx");
  const requestTimeline = read("components/shared/RequestTimeline.tsx");

  assert.match(dashboard, /showHistoryAction=\{Boolean\(currentActiveLoan\)\}/);
  assert.match(loanTimeline, /alwaysShowHistoryAction=\{showHistoryAction\}/);
  assert.match(
    requestTimeline,
    /showHistoryAction && \(hasSourceHistory \|\| alwaysShowHistoryAction\)/,
  );
});

test("transfer details use the blue format and expose proof before request download", () => {
  const timeline = read("components/shared/RequestTimeline.tsx");

  assert.match(timeline, /border-blue-200 bg-blue-50[^\n]*text-blue-800/);
  assert.match(timeline, /style=\{\{ color: "#1e40af" \}\}/);
  assert.match(timeline, /\? language === "en"\s*\? "Bank name"\s*: "ชื่อธนาคาร"/);
  assert.match(timeline, /hasDownloadButton = isTransferStatus && Boolean\(onDownloadRequest\)/);
  assert.ok(
    timeline.indexOf('{t("ดูหลักฐาน", "View proof")}') <
      timeline.indexOf('onClick={onDownloadRequest}'),
    "View proof should appear before Download request",
  );
});

test("transfer proof popup receives timeline metadata and reserves portrait loading space", () => {
  const dashboard = read("components/student/dashboard/StudentDashboard.tsx");
  const details = read("components/student/loan-details/LoanDetailsPage.tsx");
  const modal = read("components/student/loan-details/TransferSlipModal.tsx");
  const image = read("components/shared/ImageWithSkeleton.tsx");

  for (const source of [dashboard, details]) {
    assert.match(source, /transferDetail=\{transferTimelineItem\?\.title\}/);
    assert.match(source, /transferredAt=\{transferTimelineItem\?\.dateTime\}/);
  }
  assert.match(modal, /FileText/);
  assert.match(modal, /loadingAspectRatio=\{3 \/ 4\}/);
  assert.match(modal, /loadingContainerClassName="!w-80 sm:!w-96"/);
  assert.match(image, /loadingImageClassName\?: string/);
  assert.match(image, /aspectRatio: loadingAspectRatio/);
});

test("receiving bank and installment popup retain their restored responsive layout", () => {
  const detailCard = read("components/student/loan-details/TempDetailCard.tsx");
  const styles = read("app/student/student.module.css");
  const paymentModal = read("components/shared/PaymentModal.tsx");

  assert.match(detailCard, /Bank for Agriculture and/);
  assert.match(detailCard, /bankNameMobileBreak/);
  assert.match(styles, /\.loanDetailDefinitionList > \.bankNameRow/);
  assert.match(styles, /\.paymentNoteText \{\s*align-items: flex-end;/);
  assert.match(paymentModal, /HandCoins/);
  assert.match(paymentModal, /bg-orange-50 text-orange-600/);
});
