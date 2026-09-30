import test from "node:test";
import assert from "node:assert/strict";
import {
  INSTALLMENT_REMINDER_OFFSETS,
  daysOverdue,
} from "../lib/notifications/installment-reminder";
import {
  buildLoanDueReminderEmail,
  buildLoanOverdueReminderEmail,
} from "../lib/email-api/loan-reminder-template";

const input = {
  studentName: "สมชาย ใจดี",
  studentEmail: "somchai_j@cmu.ac.th",
  installmentSeq: 2,
  amountDue: 1500,
  dueDate: new Date(Date.UTC(2026, 8, 20)),
  loanId: "REQ202609200001",
  loanDetailUrl: "https://example.test/metang/student/loan-requests/REQ202609200001",
};

test("reminders go out 3, 1 and 0 days before and 1, 3 and 7 days after the due date", () => {
  assert.deepEqual([...INSTALLMENT_REMINDER_OFFSETS], [3, 1, 0, -1, -3, -7]);
});

test("daysOverdue counts whole days from the due date to today", () => {
  const due = new Date(Date.UTC(2026, 8, 20));
  assert.equal(daysOverdue(due, new Date(Date.UTC(2026, 8, 20))), 0);
  assert.equal(daysOverdue(due, new Date(Date.UTC(2026, 8, 21))), 1);
  assert.equal(daysOverdue(due, new Date(Date.UTC(2026, 8, 27))), 7);
  assert.equal(daysOverdue(due, new Date(Date.UTC(2026, 8, 17))), -3);
});

test("the overdue email names the days late and keeps the amount, date, and link", () => {
  const email = buildLoanOverdueReminderEmail({ ...input, daysOverdue: 3 });
  assert.match(email.subject, /เกินกำหนดชำระ.*งวดที่ 2/);
  assert.match(email.message, /เกินกำหนดชำระแล้ว 3 วัน/);
  assert.match(email.message, /1,500 บาท/);
  assert.match(email.message, /REQ202609200001/);
  assert.match(email.message, /https:\/\/example\.test\/metang\/student\/loan-requests\/REQ202609200001/);
  assert.equal(email.sentTo, "somchai_j@cmu.ac.th");
});

test("the due-date email is unchanged and does not say the installment is late", () => {
  const email = buildLoanDueReminderEmail(input);
  assert.match(email.subject, /แจ้งเตือนกำหนดชำระเงินกู้ยืม งวดที่ 2/);
  assert.doesNotMatch(email.message, /เกินกำหนด/);
});

test("the overdue email refuses an address outside cmu.ac.th", () => {
  assert.throws(
    () => buildLoanOverdueReminderEmail({ ...input, studentEmail: "x@example.com", daysOverdue: 1 }),
    /cmu\.ac\.th/,
  );
});
