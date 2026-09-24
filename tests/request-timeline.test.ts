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

test("RequestsCard and DisburseDebtCard remove separate ความเห็นประกอบการพิจารณา box and show comments on RequestTimeline", () => {
  const requestsCard = read("components/shared/pending/RequestsCard.tsx");
  const disburseDebtCard = read("components/shared/disburse-debt/DisburseDebtCard.tsx");
  const requestTimeline = read("components/shared/RequestTimeline.tsx");

  assert.match(requestTimeline, /hideComments\?: boolean/, "RequestTimeline must support hideComments prop");
  assert.match(requestTimeline, /hideBankDetails\?: boolean/, "RequestTimeline must support hideBankDetails prop");
  assert.doesNotMatch(
    requestsCard,
    /title="ความเห็นประกอบการพิจารณา"/,
    "RequestsCard must remove separate ความเห็นประกอบการพิจารณา box",
  );
  assert.doesNotMatch(
    disburseDebtCard,
    /title="ความเห็นประกอบการพิจารณา"/,
    "DisburseDebtCard must remove separate ความเห็นประกอบการพิจารณา box",
  );
  assert.doesNotMatch(
    requestsCard,
    /<RequestTimeline[\s\S]*?hideComments/,
    "RequestsCard must not set hideComments so role comments show on timeline",
  );
  assert.doesNotMatch(
    disburseDebtCard,
    /<RequestTimeline[\s\S]*?hideComments/,
    "DisburseDebtCard must not set hideComments so role comments show on timeline",
  );
  assert.match(
    requestTimeline,
    /timelineCommentCard/,
    "RequestTimeline must include timelineCommentCard under actor/date",
  );
});

test("buildFiveStepTimeline always outputs the 5 standard steps and handles returns correctly", async () => {
  const { buildFiveStepTimeline } = await import("@/lib/request-timeline-model");

  // Case 1: Initial submission (pending_advisor)
  const stepInitial = buildFiveStepTimeline({
    requestStatus: "pending_advisor",
    studentName: "นายสมชาย ใจดี",
    advisorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
    submitDate: "14 ต.ค. 2567",
  });
  assert.equal(stepInitial.length, 5);
  assert.equal(stepInitial[0].action, "ยื่นคำร้องขอกู้ยืม");
  assert.equal(stepInitial[0].isCompleted, true);
  assert.equal(stepInitial[1].action, "อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ");
  assert.equal(stepInitial[1].isPending, true);
  assert.equal(stepInitial[2].action, "เจ้าหน้าที่ตรวจสอบเอกสารครบถ้วน");
  assert.equal(stepInitial[2].isUpcoming, true);
  assert.equal(stepInitial[3].action, "ผู้บริหารอนุมัติคำร้อง");
  assert.equal(stepInitial[3].isUpcoming, true);
  assert.equal(stepInitial[4].action, "เจ้าหน้าที่โอนเงินเรียบร้อยแล้ว");
  assert.equal(stepInitial[4].isUpcoming, true);

  // Case 2: Advisor returned for revision (status = returned by advisor)
  // Step 1: checked, Step 2: returned (ยังขึ้นเป็นว่างอยู่ / isUpcoming: true, date: "ขั้นตอนถัดไป", no return comments), Steps 3-5: upcoming
  const stepAdvReturned = buildFiveStepTimeline({
    requestStatus: "returned",
    studentName: "นายสมชาย ใจดี",
    advisorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
    submitDate: "14 ต.ค. 2567",
    approvals: [
      {
        step: "advisor",
        actorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
        comment: "ขอให้ชี้แจงความจำเป็นเพิ่มเติม",
        decision: "returned",
        date: "15 ต.ค. 2567",
      },
    ],
  });
  assert.equal(stepAdvReturned.length, 5);
  assert.equal(stepAdvReturned[0].isCompleted, true);
  assert.equal(stepAdvReturned[1].isUpcoming, true, "Advisor returned step must show as empty (ยังขึ้นเป็นว่างอยู่)");
  assert.equal(stepAdvReturned[1].date, "ขั้นตอนถัดไป");
  assert.equal(stepAdvReturned[1].comment, undefined, "Return comments must not appear on 5-step timeline");
  assert.equal(stepAdvReturned[1].commentTitle, undefined);
  assert.equal(stepAdvReturned[2].isUpcoming, true);
  assert.equal(stepAdvReturned[3].isUpcoming, true);
  assert.equal(stepAdvReturned[4].isUpcoming, true);

  const stepAdvReturnedTwice = buildFiveStepTimeline({
    requestStatus: "returned",
    history: [
      { action: "ยื่นคำร้องขอกู้ยืม", date: "14 ต.ค. 2567", actor: "นายสมชาย ใจดี" },
      {
        action: "ส่งกลับให้นักศึกษาแก้ไข",
        date: "15 ต.ค. 2567",
        actor: "อาจารย์ที่ปรึกษา ทดสอบ",
        commentTitle: "ข้อความจากอาจารย์ที่ปรึกษา",
        comment: "คำแนะนำเดิม",
      },
      {
        action: "ส่งกลับให้นักศึกษาแก้ไข",
        date: "20 ต.ค. 2567",
        actor: "อาจารย์ที่ปรึกษา ทดสอบ",
        commentTitle: "ข้อความจากอาจารย์ที่ปรึกษา",
        comment: "คำแนะนำล่าสุด",
      },
    ],
  });
  assert.equal(stepAdvReturnedTwice[1].isUpcoming, true);
  assert.equal(stepAdvReturnedTwice[1].date, "ขั้นตอนถัดไป");
  assert.equal(stepAdvReturnedTwice[1].comment, undefined, "Return comments must not appear on 5-step timeline");
  assert.equal(stepAdvReturnedTwice[1].commentTitle, undefined);

  // Case 3: Student resubmits after advisor return -> bounces back to pending_advisor
  const stepAdvResubmit = buildFiveStepTimeline({
    requestStatus: "pending_advisor",
    studentName: "นายสมชาย ใจดี",
    advisorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
    submitDate: "14 ต.ค. 2567",
    history: [
      { action: "ยื่นคำร้องขอกู้ยืม", date: "14 ต.ค. 2567", actor: "นายสมชาย ใจดี" },
      { action: "ส่งกลับให้นักศึกษาแก้ไข", date: "15 ต.ค. 2567", actor: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ" },
    ],
  });
  assert.equal(stepAdvResubmit[0].isCompleted, true);
  assert.equal(stepAdvResubmit[1].isPending, true, "Must be active/pending after student resubmits (ขั้นตอน อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ อยู่)");
  assert.equal(stepAdvResubmit[2].isUpcoming, true);
  assert.equal(stepAdvResubmit[3].isUpcoming, true);
  assert.equal(stepAdvResubmit[4].isUpcoming, true);

  // Case 4: Advisor approves -> pending_admin
  const stepAdvApproved = buildFiveStepTimeline({
    requestStatus: "pending_admin",
    studentName: "นายสมชาย ใจดี",
    advisorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
    submitDate: "14 ต.ค. 2567",
    approvals: [
      {
        step: "advisor",
        actorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
        comment: "เห็นสมควร",
        decision: "approved",
        date: "16 ต.ค. 2567",
      },
    ],
  });
  assert.equal(stepAdvApproved[0].isCompleted, true);
  assert.equal(stepAdvApproved[1].isCompleted, true);
  assert.equal(stepAdvApproved[2].isPending, true);
  assert.equal(stepAdvApproved[3].isUpcoming, true);
  assert.equal(stepAdvApproved[4].isUpcoming, true);

  const stepAdminPendingAfterPreviousApproval = buildFiveStepTimeline({
    requestStatus: "pending_admin",
    history: [
      { action: "ยื่นคำร้องขอกู้ยืม", date: "14 ต.ค. 2567", actor: "นายสมชาย ใจดี" },
      {
        action: "อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ",
        date: "15 ต.ค. 2567",
        actor: "อาจารย์ที่ปรึกษา ทดสอบ",
      },
      {
        action: "เจ้าหน้าที่ตรวจสอบเอกสารครบถ้วน",
        date: "16 ต.ค. 2567",
        actor: "เจ้าหน้าที่ ทดสอบ",
      },
    ],
  });
  assert.equal(stepAdminPendingAfterPreviousApproval[2].isPending, true);
  assert.equal(stepAdminPendingAfterPreviousApproval[2].isCompleted, undefined);

  const stepExecutivePendingAfterPreviousApproval = buildFiveStepTimeline({
    requestStatus: "pending_executive",
    history: [
      { action: "ยื่นคำร้องขอกู้ยืม", date: "14 ต.ค. 2567", actor: "นายสมชาย ใจดี" },
      {
        action: "ผู้บริหารอนุมัติคำร้อง",
        date: "18 ต.ค. 2567",
        actor: "ผู้บริหาร",
        isCompleted: true,
      },
    ],
  });
  assert.equal(stepExecutivePendingAfterPreviousApproval[3].isPending, true);
  assert.equal(stepExecutivePendingAfterPreviousApproval[3].isCompleted, undefined);

  // Case 5: Admin returned for revision (status = returned by admin)
  // Step 1: checked, Step 2: checked, Step 3: empty circle, Steps 4-5: empty circle
  const stepAdminReturned = buildFiveStepTimeline({
    requestStatus: "returned",
    studentName: "นายสมชาย ใจดี",
    advisorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
    submitDate: "14 ต.ค. 2567",
    approvals: [
      {
        step: "advisor",
        actorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
        comment: "เห็นชอบ",
        decision: "approved",
        date: "16 ต.ค. 2567",
      },
      {
        step: "admin",
        actorName: "เจ้าหน้าที่ สมชาย",
        comment: "เอกสารไม่ครบ",
        decision: "returned",
        date: "17 ต.ค. 2567",
      },
    ],
  });
  assert.equal(stepAdminReturned[0].isCompleted, true);
  assert.equal(stepAdminReturned[1].isCompleted, true, "Advisor approval should stay checked");
  assert.equal(stepAdminReturned[1].comment, "เห็นชอบ");
  assert.equal(stepAdminReturned[1].commentTitle, "ความคิดเห็นของอาจารย์ที่ปรึกษา");
  assert.equal(stepAdminReturned[2].isUpcoming, true, "Admin returned step must show as empty (ยังขึ้นเป็นว่างอยู่)");
  assert.equal(stepAdminReturned[2].date, "ขั้นตอนถัดไป");
  assert.equal(stepAdminReturned[2].comment, undefined, "Return comments must not appear on 5-step timeline");
  assert.equal(stepAdminReturned[3].isUpcoming, true);
  assert.equal(stepAdminReturned[4].isUpcoming, true);

  // Case 6: Student resubmits after admin return -> bounces back to pending_admin
  const stepAdminResubmit = buildFiveStepTimeline({
    requestStatus: "pending_admin",
    studentName: "นายสมชาย ใจดี",
    advisorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
    submitDate: "14 ต.ค. 2567",
    approvals: [
      {
        step: "advisor",
        actorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
        comment: "เห็นชอบ",
        decision: "approved",
        date: "16 ต.ค. 2567",
      },
    ],
  });
  assert.equal(stepAdminResubmit[0].isCompleted, true);
  assert.equal(stepAdminResubmit[1].isCompleted, true);
  assert.equal(stepAdminResubmit[2].isPending, true, "Must bounce back to pending_admin");
  assert.equal(stepAdminResubmit[3].isUpcoming, true);
  assert.equal(stepAdminResubmit[4].isUpcoming, true);

  // Case 7: Funds transferred -> final transfer status stays active until the loan closes
  const stepDisbursed = buildFiveStepTimeline({
    requestStatus: "disbursed",
    studentName: "นายสมชาย ใจดี",
    advisorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
    submitDate: "14 ต.ค. 2567",
    history: [
      { action: "ยื่นคำร้องขอกู้ยืม", date: "14 ต.ค. 2567", actor: "นายสมชาย ใจดี" },
      { action: "อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ", date: "15 ต.ค. 2567", actor: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ" },
      { action: "เจ้าหน้าที่ตรวจสอบเอกสารครบถ้วน", date: "16 ต.ค. 2567", actor: "เจ้าหน้าที่ สมชาย" },
      { action: "ผู้บริหารอนุมัติคำร้อง", date: "17 ต.ค. 2567", actor: "ผู้บริหาร สมควร" },
      { action: "เจ้าหน้าที่โอนเงินเรียบร้อยแล้ว", date: "18 ต.ค. 2567", actor: "เจ้าหน้าที่การเงิน" },
    ],
  });
  assert.equal(stepDisbursed[0].isCompleted, true);
  assert.equal(stepDisbursed[1].isCompleted, true);
  assert.equal(stepDisbursed[2].isCompleted, true);
  assert.equal(stepDisbursed[3].isCompleted, true);
  assert.equal(stepDisbursed[4].isPending, true);
  assert.equal(stepDisbursed[4].isCompleted, undefined);

  // Case 8: Comments from various roles like student page
  const stepWithComments = buildFiveStepTimeline({
    requestStatus: "pending_disbursement",
    studentName: "นายสมชาย ใจดี",
    advisorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
    submitDate: "14 ต.ค. 2567",
    approvals: [
      {
        step: "advisor",
        actorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
        comment: "เห็นชอบตามที่ร้องขอ",
        decision: "approved",
        date: "15 ต.ค. 2567",
      },
      {
        step: "admin",
        actorName: "เจ้าหน้าที่ สมชาย",
        comment: "เอกสารครบถ้วนสมบูรณ์",
        decision: "approved",
        date: "16 ต.ค. 2567",
      },
      {
        step: "executive",
        actorName: "ผู้บริหาร สมควร",
        comment: "อนุมัติเงินกู้ยืม",
        decision: "approved",
        date: "17 ต.ค. 2567",
      },
    ],
  });
  assert.equal(stepWithComments[1].commentTitle, "ความคิดเห็นของอาจารย์ที่ปรึกษา");
  assert.equal(stepWithComments[1].comment, "เห็นชอบตามที่ร้องขอ");
  assert.equal(stepWithComments[2].commentTitle, "ความคิดเห็นของเจ้าหน้าที่");
  assert.equal(stepWithComments[2].comment, "เอกสารครบถ้วนสมบูรณ์");
  assert.equal(stepWithComments[3].commentTitle, "ความคิดเห็นของผู้บริหาร");
  assert.equal(stepWithComments[3].comment, "อนุมัติเงินกู้ยืม");

  const latestAdminApproval = buildFiveStepTimeline({
    requestStatus: "pending_disbursement",
    history: [
      {
        action: "เจ้าหน้าที่ตรวจสอบเอกสารผ่านการอนุมัติ",
        date: "20 Sep 2026 10:00",
        actor: "เจ้าหน้าที่คนเดิม",
        comment: "ความคิดเห็นเดิม",
      },
      {
        action: "เจ้าหน้าที่ตรวจสอบเอกสารผ่านการอนุมัติ",
        date: "23 Sep 2026 23:18",
        actor: "เจ้าหน้าที่คนล่าสุด",
        comment: "ความคิดเห็นล่าสุด",
      },
    ],
  });
  assert.equal(latestAdminApproval[2].date, "23 Sep 2026 23:18");
  assert.equal(latestAdminApproval[2].comment, "ความคิดเห็นล่าสุด");
});

test("RequestTimeline has header action button to view full action history and modal", () => {
  const content = read("components/shared/RequestTimeline.tsx");

  assert.match(
    content,
    /ดูประวัติการดำเนินการทั้งหมด/,
    "RequestTimeline must have button/label for ดูประวัติการดำเนินการทั้งหมด",
  );
  assert.match(
    content,
    /isHistoryModalOpen/,
    "RequestTimeline must have state for history modal",
  );
  assert.match(
    content,
    /ประวัติการดำเนินการทั้งหมด/,
    "Modal title must be ประวัติการดำเนินการทั้งหมด",
  );
  assert.match(
    content,
    /buildFullActionHistory/,
    "RequestTimeline must use buildFullActionHistory",
  );
});

test("buildFullActionHistory correctly tracks submission, return comments, and resubmissions", async () => {
  const { buildFullActionHistory } = await import("@/lib/request-timeline-model");

  // Case 1: Initial submission
  const history1 = buildFullActionHistory({
    requestStatus: "pending_advisor",
    studentName: "นายสมชาย ใจดี",
    submitDate: "14 ต.ค. 2567",
  });
  assert.equal(history1[0].action, "ยื่นคำร้องขอกู้ยืม");
  assert.equal(history1[0].statusType, "submitted");
  assert.equal(history1[0].actor, "นายสมชาย ใจดี");

  // Case 2: Returned by advisor with comment
  const history2 = buildFullActionHistory({
    requestStatus: "returned",
    studentName: "นายสมชาย ใจดี",
    submitDate: "14 ต.ค. 2567",
    history: [
      { action: "ยื่นคำร้องขอกู้ยืม", date: "14 ต.ค. 2567", actor: "นายสมชาย ใจดี" },
      { action: "ส่งกลับให้นักศึกษาแก้ไข", date: "15 ต.ค. 2567", actor: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ" },
    ],
    approvals: [
      {
        step: "advisor",
        actorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
        comment: "ขอให้ระบุความจำเป็นให้ชัดเจน",
        decision: "returned",
        date: "15 ต.ค. 2567",
      },
    ],
  });
  assert.equal(history2.length, 2);
  assert.equal(history2[0].statusType, "submitted");
  assert.equal(history2[1].statusType, "returned");
  assert.equal(history2[1].comment, "ขอให้ระบุความจำเป็นให้ชัดเจน");

  // Case 3: Student resubmits after return -> status bounces back to pending_advisor
  const history3 = buildFullActionHistory({
    requestStatus: "pending_advisor",
    studentName: "นายสมชาย ใจดี",
    submitDate: "14 ต.ค. 2567",
    history: [
      { action: "ยื่นคำร้องขอกู้ยืม", date: "14 ต.ค. 2567", actor: "นายสมชาย ใจดี" },
      { action: "ส่งกลับให้นักศึกษาแก้ไข", date: "15 ต.ค. 2567", actor: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ" },
    ],
    approvals: [
      {
        step: "advisor",
        actorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
        comment: "ขอให้ระบุความจำเป็นให้ชัดเจน",
        decision: "returned",
        date: "15 ต.ค. 2567",
      },
    ],
  });
  // Must include: 1. Submission, 2. Return, 3. Student Resubmission (การส่งการแก้ไข), 4. Pending advisor
  const actions3 = history3.map((h) => h.action);
  assert.ok(
    actions3.some((a) => a.includes("ยื่นคำร้อง")),
    "Must include submission",
  );
  assert.ok(
    actions3.some((a) => a.includes("ส่งกลับ")),
    "Must include return",
  );
  assert.ok(
    actions3.some((a) => a.includes("แก้ไข")),
    "Must include student revision submission (การส่งการแก้ไข)",
  );
  const resubmitItem = history3.find((h) => h.statusType === "resubmitted");
  assert.ok(resubmitItem, "Must have resubmitted statusType");
  assert.equal(resubmitItem?.actor, "นายสมชาย ใจดี");

  // Case 4: Disbursed case
  const history4 = buildFullActionHistory({
    requestStatus: "disbursed",
    studentName: "นางสาวสมหญิง",
    submitDate: "1 ต.ค. 2567",
    history: [
      { action: "ยื่นคำร้องขอกู้ยืม", date: "1 ต.ค. 2567", actor: "นางสาวสมหญิง" },
      { action: "อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ", date: "2 ต.ค. 2567", actor: "อาจารย์" },
      { action: "เจ้าหน้าที่ตรวจสอบเอกสารครบถ้วน", date: "3 ต.ค. 2567", actor: "เจ้าหน้าที่" },
      { action: "ผู้บริหารอนุมัติคำร้อง", date: "4 ต.ค. 2567", actor: "ผู้บริหาร" },
      { action: "เจ้าหน้าที่โอนเงินเรียบร้อยแล้ว", date: "5 ต.ค. 2567", actor: "การเงิน" },
    ],
    bankDetails: {
      bankName: "กรุงไทย",
      accountNumber: "111-222-333",
      accountName: "นางสาวสมหญิง",
    },
  });
  assert.equal(history4[4].statusType, "disbursed");
  assert.ok(history4[4].transferDetails, "Disbursed item should have transfer details");
});

test("buildFullActionHistory keeps an in-progress Admin review pending", async () => {
  const { buildFullActionHistory } = await import("@/lib/request-timeline-model");
  const history = buildFullActionHistory({
    history: [
      {
        action: "เจ้าหน้าที่ตรวจสอบเอกสารครบถ้วน",
        date: "กำลังดำเนินการ",
        actor: "เจ้าหน้าที่",
        isPending: true,
      },
    ],
    requestStatus: "pending_admin",
  });

  const pendingAdminItem = history.find((item) => item.action.includes("เจ้าหน้าที่ตรวจสอบเอกสาร"));
  assert.equal(pendingAdminItem?.statusType, "pending");
});

test("buildFullActionHistory does not attach an old Admin comment to the current pending review", async () => {
  const { buildFullActionHistory } = await import("@/lib/request-timeline-model");
  const history = buildFullActionHistory({
    history: [
      {
        action: "เจ้าหน้าที่ตรวจสอบเอกสารครบถ้วน",
        date: "กำลังดำเนินการ",
        actor: "เจ้าหน้าที่",
        isPending: true,
      },
    ],
    approvals: [
      {
        step: "admin",
        actorName: "เจ้าหน้าที่",
        decision: "approved",
        comment: "ความคิดเห็นจากการตรวจสอบครั้งก่อน",
      },
    ],
    requestStatus: "pending_admin",
  });

  const pendingAdminItem = history.find((item) => item.action.includes("เจ้าหน้าที่ตรวจสอบเอกสาร"));
  assert.equal(pendingAdminItem?.comment, undefined);
});

test("buildFiveStepTimeline hides prior Admin return messages after the student resubmits", async () => {
  const { buildFiveStepTimeline } = await import("@/lib/request-timeline-model");
  const timeline = buildFiveStepTimeline({
    requestStatus: "pending_admin",
    history: [
      {
        action: "เจ้าหน้าที่ส่งกลับแก้ไข",
        date: "20 ก.ย. 2569",
        actor: "แอดมิน ทดสอบ",
        commentTitle: "ข้อความจากเจ้าหน้าที่",
        comment: "แอดมินให้แก้ครั้งที่ 1",
      },
      {
        action: "เจ้าหน้าที่ส่งกลับแก้ไข",
        date: "23 ก.ย. 2569",
        actor: "แอดมิน ทดสอบ",
        commentTitle: "ข้อความจากเจ้าหน้าที่",
        comment: "แอดมินให้แก้ครั้งที่ 2",
      },
    ],
  });

  assert.equal(timeline[2].isPending, true);
  assert.equal(timeline[2].comment, undefined);
  assert.equal(timeline[2].commentTitle, undefined);
});

test("buildFiveStepTimeline does not show return dates or return comments for Executive return, while buildFullActionHistory does", async () => {
  const { buildFiveStepTimeline, buildFullActionHistory } = await import("@/lib/request-timeline-model");

  // Executive returned to admin (requestStatus: pending_admin)
  const timeline = buildFiveStepTimeline({
    requestStatus: "pending_admin",
    studentName: "นายสมชาย ใจดี",
    advisorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
    submitDate: "14 ต.ค. 2567",
    approvals: [
      {
        step: "advisor",
        actorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
        comment: "เห็นชอบ",
        decision: "approved",
        date: "15 ต.ค. 2567",
      },
      {
        step: "admin",
        actorName: "เจ้าหน้าที่ สมชาย",
        comment: "เอกสารครบ",
        decision: "approved",
        date: "16 ต.ค. 2567",
      },
      {
        step: "executive",
        actorName: "ผู้บริหาร สมควร",
        comment: "เอกสารขาดสำเนาบัญชีธนาคาร ให้เจ้าหน้าที่ตรวจสอบอีกครั้ง",
        decision: "returned",
        date: "17 ต.ค. 2567",
      },
    ],
  });

  // Step 2 is approved with approval comment
  assert.equal(timeline[1].isCompleted, true);
  assert.equal(timeline[1].comment, "เห็นชอบ");
  // Step 3 is pending (admin reviewing/fixing), NO comment shown
  assert.equal(timeline[2].isPending, true);
  assert.equal(timeline[2].comment, undefined);
  // Step 4 is upcoming, NO return date ("ขั้นตอนถัดไป"), NO return comment
  assert.equal(timeline[3].isUpcoming, true);
  assert.equal(timeline[3].date, "ขั้นตอนถัดไป");
  assert.equal(timeline[3].comment, undefined);
  assert.equal(timeline[3].commentTitle, undefined);

  // Full action history has the executive return comment and full audit trail
  const fullHistory = buildFullActionHistory({
    requestStatus: "pending_admin",
    studentName: "นายสมชาย ใจดี",
    submitDate: "14 ต.ค. 2567",
    history: [
      { action: "ยื่นคำร้องขอกู้ยืม", date: "14 ต.ค. 2567", actor: "นายสมชาย ใจดี" },
      { action: "อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ", date: "15 ต.ค. 2567", actor: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ" },
      { action: "เจ้าหน้าที่ตรวจสอบเอกสารครบถ้วน", date: "16 ต.ค. 2567", actor: "เจ้าหน้าที่ สมชาย" },
      {
        action: "ผู้บริหารส่งกลับแก้ไข",
        date: "17 ต.ค. 2567",
        actor: "ผู้บริหาร สมควร",
        comment: "เอกสารขาดสำเนาบัญชีธนาคาร ให้เจ้าหน้าที่ตรวจสอบอีกครั้ง",
      },
      { action: "เจ้าหน้าที่ตรวจสอบเอกสารครบถ้วน", date: "กำลังดำเนินการ", actor: "เจ้าหน้าที่ สมชาย", isPending: true },
    ],
  });

  const execReturnItem = fullHistory.find((item) => item.action.includes("ผู้บริหารส่งกลับแก้ไข"));
  assert.ok(execReturnItem);
  assert.equal(execReturnItem.statusType, "returned");
  assert.equal(execReturnItem.comment, "เอกสารขาดสำเนาบัญชีธนาคาร ให้เจ้าหน้าที่ตรวจสอบอีกครั้ง");
});

test("Student role is not modified and does not use RequestTimeline", () => {
  const studentPage = read("app/student/page.tsx");
  const studentDashboard = read("components/student/dashboard/StudentDashboard.tsx");
  const loanTimeline = read("components/student/loan-details/LoanTimeline.tsx");

  assert.doesNotMatch(studentPage, /<RequestTimeline/, "Student page must not use RequestTimeline");
  assert.doesNotMatch(studentDashboard, /<RequestTimeline/, "Student dashboard must not use RequestTimeline");
  assert.doesNotMatch(loanTimeline, /buildFullActionHistory/, "Student loan timeline must not use buildFullActionHistory");
});
