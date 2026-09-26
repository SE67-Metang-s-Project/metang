// Thai text for a failed POST /api/admin/payments/{id}/decision. The route answers in English;
// the 409 messages are matched exactly so each conflict tells the reviewer what happened.
const conflictMessages = new Map([
  ["The payment was already reviewed", "สลิปนี้ได้รับการตรวจสอบไปแล้ว"],
  ["The request changed; please retry", "ข้อมูลคำร้องมีการเปลี่ยนแปลง กรุณาลองใหม่อีกครั้ง"],
  ["The loan is not open for repayment", "คำร้องนี้ไม่อยู่ในสถานะที่รับชำระเงินได้"],
  ["The payment was already credited to the fund", "รายการชำระเงินนี้ถูกบันทึกเข้ากองทุนแล้ว"],
]);

export const REJECT_NOTE_REQUIRED = "กรุณาระบุเหตุผลที่ปฏิเสธสลิป";
export const PAYMENT_DECISION_NETWORK_ERROR =
  "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง";

export function paymentDecisionErrorMessage(status: number, apiMessage?: string | null): string {
  if (status === 401) return "กรุณาเข้าสู่ระบบใหม่ (Session หมดอายุ)";
  if (status === 403) {
    // validateJsonRequest: an Origin mismatch (e.g. behind a proxy) or a wrong content type, not a
    // missing role.
    if (apiMessage === "A same-origin JSON request is required") {
      return "คำขอไม่ถูกต้อง กรุณารีเฟรชหน้าแล้วลองใหม่ หากยังพบปัญหาโปรดแจ้งผู้ดูแลระบบ";
    }
    return "ไม่มีสิทธิ์ดำเนินการสำหรับบทบาทนี้";
  }
  if (status === 404) return "ไม่พบรายการชำระเงินนี้ในระบบ";
  if (status === 409) {
    return (
      conflictMessages.get(apiMessage ?? "") ?? "สลิปนี้ได้รับการตรวจสอบไปแล้ว หรือเกิดข้อขัดแย้ง"
    );
  }
  if (status === 422) {
    if (apiMessage === "A note is required when rejecting a payment") return REJECT_NOTE_REQUIRED;
    if (apiMessage === "note is invalid") return "เหตุผลต้องมีความยาวไม่เกิน 500 ตัวอักษร";
    return "ข้อมูลที่ส่งไม่ถูกต้อง";
  }
  return "เกิดข้อผิดพลาดในการบันทึกผลการตรวจสอบสลิป";
}
