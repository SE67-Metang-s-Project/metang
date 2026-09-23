export type ActionHistory = {
  action: string;
  date: string;
  actor: string;
  commentTitle?: string;
  comment?: string;
  isCompleted?: boolean;
  isPending?: boolean;
  isUpcoming?: boolean;
  isFailed?: boolean;
  isRevision?: boolean;
  transferDetails?: string[];
};

export type ApprovalStep = {
  step: "advisor" | "admin" | "executive";
  actorName: string;
  comment?: string;
  decision: "approved" | "rejected" | "returned" | "pending";
  date?: string;
};

export type BankDetails = {
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
};

export const isBankDetail = (detail: string) => {
  const d = detail.trim();
  return (
    d.startsWith("ธนาคาร") ||
    d.startsWith("เลขที่บัญชี") ||
    d.startsWith("ชื่อบัญชี")
  );
};

export function buildFiveStepTimeline({
  history = [],
  approvals = [],
  requestStatus,
  bankDetails,
  advisorName,
  studentName,
  submitDate,
  hideComments = false,
  hideBankDetails = false,
}: {
  history?: ActionHistory[];
  approvals?: ApprovalStep[];
  requestStatus?: string;
  bankDetails?: BankDetails;
  advisorName?: string;
  studentName?: string;
  submitDate?: string;
  hideComments?: boolean;
  hideBankDetails?: boolean;
}): ActionHistory[] {
  // Step 1: ยื่นคำร้องขอกู้ยืม
  const subHist = history.find((h) => h.action.includes("ยื่นคำร้อง"));
  const step1Action = subHist?.action || "ยื่นคำร้องขอกู้ยืม";
  const step1Date = subHist?.date || submitDate || "ยื่นคำร้องสำเร็จ";
  const step1Actor = subHist?.actor || studentName || "นักศึกษา";

  // Approvals lookups
  const advisorApproval = approvals.filter((a) => a.step === "advisor").pop();
  const adminApproval = approvals.filter((a) => a.step === "admin").pop();
  const execApproval = approvals.filter((a) => a.step === "executive").pop();

  // History lookups
  const advHistApproved = history.find(
    (h) =>
      (h.action.includes("เห็นชอบ") ||
        (h.action.includes("อนุมัติ") &&
          (h.action.includes("อาจารย์") ||
            h.actor.includes("อาจารย์") ||
            h.actor.includes("ผศ.") ||
            h.actor.includes("ดร.") ||
            h.actor.includes("อ.")))) &&
      !h.action.includes("ไม่อนุมัติ") &&
      !h.action.includes("ส่งกลับ") &&
      !h.action.includes("แก้ไข"),
  );
  const advisorReturnedHistory = history.filter(
    (h) =>
      (h.action.includes("ส่งกลับ") || h.action.includes("แก้ไข")) &&
      (h.action.includes("อาจารย์") ||
        h.actor.includes("อาจารย์") ||
        h.actor.includes("ผศ.") ||
        h.actor.includes("ดร.") ||
        h.actor.includes("อ.") ||
        h.action === "ส่งกลับให้นักศึกษาแก้ไข"),
  );
  const advHistReturned = advisorReturnedHistory[advisorReturnedHistory.length - 1];
  const advisorReturnCount = Math.max(
    advisorReturnedHistory.length,
    approvals.filter((approval) => approval.step === "advisor" && approval.decision === "returned")
      .length,
  );
  const advHistRejected = history.find(
    (h) =>
      (h.action.includes("ไม่อนุมัติ") || h.action.includes("ไม่เห็นชอบ")) &&
      (h.action.includes("อาจารย์") ||
        h.actor.includes("อาจารย์") ||
        h.actor.includes("ผศ.") ||
        h.actor.includes("ดร.") ||
        h.actor.includes("อ.")),
  );

  const admHistApproved = history.find(
    (h) =>
      (h.action.includes("เจ้าหน้าที่ตรวจสอบ") ||
        (h.action.includes("อนุมัติ") &&
          (h.action.includes("เจ้าหน้าที่") || h.actor.includes("เจ้าหน้าที่")))) &&
      !h.action.includes("ไม่อนุมัติ") &&
      !h.action.includes("ส่งกลับ") &&
      !h.action.includes("แก้ไข"),
  );
  const adminReturnedHistory = history.filter(
    (h) =>
      (h.action.includes("ส่งกลับ") || h.action.includes("แก้ไข")) &&
      (h.action.includes("เจ้าหน้าที่") || h.actor.includes("เจ้าหน้าที่")),
  );
  const admHistReturned = adminReturnedHistory[adminReturnedHistory.length - 1];
  const admHistPending = [...history]
    .reverse()
    .find((h) => h.isPending && (h.action.includes("เจ้าหน้าที่") || h.actor.includes("เจ้าหน้าที่")));
  const admHistRejected = history.find(
    (h) =>
      h.action.includes("ไม่อนุมัติ") &&
      (h.action.includes("เจ้าหน้าที่") || h.actor.includes("เจ้าหน้าที่")),
  );

  const execHistApproved = history.find(
    (h) =>
      (h.action.includes("ผู้บริหารอนุมัติ") ||
        (h.action.includes("อนุมัติ") &&
          (h.action.includes("ผู้บริหาร") || h.actor.includes("ผู้บริหาร")))) &&
      !h.action.includes("ไม่อนุมัติ") &&
      !h.action.includes("ส่งกลับ") &&
      !h.action.includes("แก้ไข"),
  );
  const execHistReturned = history.find(
    (h) =>
      (h.action.includes("ส่งกลับ") || h.action.includes("แก้ไข")) &&
      (h.action.includes("ผู้บริหาร") || h.actor.includes("ผู้บริหาร")),
  );
  const execHistRejected = history.find(
    (h) =>
      h.action.includes("ไม่อนุมัติ") &&
      (h.action.includes("ผู้บริหาร") || h.actor.includes("ผู้บริหาร")),
  );

  const disburseHist = [...history].reverse().find((h) => h.action.includes("โอนเงิน"));

  // Check which step returned if requestStatus is "returned"
  let returnedRole: "advisor" | "admin" | "executive" | null = null;
  if (requestStatus === "returned") {
    if (adminApproval?.decision === "returned" || admHistReturned) {
      returnedRole = "admin";
    } else if (execApproval?.decision === "returned" || execHistReturned) {
      returnedRole = "executive";
    } else if (advisorApproval?.decision === "returned" || advHistReturned) {
      returnedRole = "advisor";
    } else {
      returnedRole = "advisor";
    }
  }

  // Check which step rejected if requestStatus is "rejected"
  let rejectedRole: "advisor" | "admin" | "executive" | null = null;
  if (requestStatus === "rejected") {
    if (execApproval?.decision === "rejected" || execHistRejected) {
      rejectedRole = "executive";
    } else if (adminApproval?.decision === "rejected" || admHistRejected) {
      rejectedRole = "admin";
    } else if (advisorApproval?.decision === "rejected" || advHistRejected) {
      rejectedRole = "advisor";
    } else {
      rejectedRole = "advisor";
    }
  }

  // Step 2: อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ
  const isStep2Approved =
    advisorApproval?.decision === "approved" ||
    Boolean(advHistApproved) ||
    ["pending_admin", "pending_executive", "pending_disbursement", "disbursed", "closed"].includes(
      requestStatus || "",
    ) ||
    returnedRole === "admin" ||
    returnedRole === "executive" ||
    rejectedRole === "admin" ||
    rejectedRole === "executive";

  const isStep2Pending = requestStatus === "pending_advisor";
  const isStep2Returned = returnedRole === "advisor";
  const isStep2Rejected = rejectedRole === "advisor";

  let step2Item: ActionHistory;
  if (isStep2Approved) {
    step2Item = {
      action: "อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ",
      date: advisorApproval?.date || advHistApproved?.date || "เห็นชอบแล้ว",
      actor:
        advisorApproval?.actorName ||
        advHistApproved?.actor ||
        advisorName ||
        "อาจารย์ที่ปรึกษา",
      isCompleted: true,
      comment: hideComments ? undefined : advisorApproval?.comment || advHistApproved?.comment,
      commentTitle: hideComments ? undefined : "ความคิดเห็นของอาจารย์ที่ปรึกษา",
    };
  } else if (isStep2Pending) {
    step2Item = {
      action: "อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ",
      date: "กำลังดำเนินการ",
      actor: advisorApproval?.actorName || advisorName || "อาจารย์ที่ปรึกษา",
      isPending: true,
    };
  } else if (isStep2Returned) {
    const rDate = advHistReturned?.date || advisorApproval?.date;
    const advisorReturnCommentTitle =
      advHistReturned?.commentTitle || "ข้อความจากอาจารย์ที่ปรึกษา";
    step2Item = {
      action: "อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ",
      date: rDate ? `ส่งกลับมาแก้ไข (${rDate})` : "ส่งกลับมาแก้ไข",
      actor:
        advisorApproval?.actorName ||
        advHistReturned?.actor ||
        advisorName ||
        "อาจารย์ที่ปรึกษา",
      isUpcoming: true,
      comment: hideComments ? undefined : advisorApproval?.comment || advHistReturned?.comment,
      commentTitle:
        hideComments
          ? undefined
          : advisorReturnCount > 1
            ? `${advisorReturnCommentTitle} (การแก้ไขครั้งที่ ${advisorReturnCount})`
            : advisorReturnCommentTitle,
    };
  } else if (isStep2Rejected) {
    const rejDate = advHistRejected?.date || advisorApproval?.date;
    step2Item = {
      action: "อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ",
      date: rejDate ? `ไม่อนุมัติ (${rejDate})` : "ไม่อนุมัติ",
      actor:
        advisorApproval?.actorName ||
        advHistRejected?.actor ||
        advisorName ||
        "อาจารย์ที่ปรึกษา",
      isFailed: true,
      comment: hideComments ? undefined : advisorApproval?.comment || advHistRejected?.comment,
      commentTitle: hideComments ? undefined : "เหตุผลที่ไม่อนุมัติ",
    };
  } else {
    step2Item = {
      action: "อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ",
      date: "ขั้นตอนถัดไป",
      actor: advisorName || "อาจารย์ที่ปรึกษา",
      isUpcoming: true,
    };
  }

  // Step 3: เจ้าหน้าที่ตรวจสอบเอกสารครบถ้วน
  const isStep3Pending = requestStatus === "pending_admin";
  const isStep3Approved =
    !isStep3Pending &&
    (adminApproval?.decision === "approved" ||
      Boolean(admHistApproved) ||
      ["pending_executive", "pending_disbursement", "disbursed", "closed"].includes(
        requestStatus || "",
      ) ||
      returnedRole === "executive" ||
      rejectedRole === "executive");

  const isStep3Returned = returnedRole === "admin";
  const isStep3Rejected = rejectedRole === "admin";

  let step3Item: ActionHistory;
  if (isStep3Approved) {
    step3Item = {
      action: "เจ้าหน้าที่ตรวจสอบเอกสารครบถ้วน",
      date: adminApproval?.date || admHistApproved?.date || "ตรวจสอบเรียบร้อย",
      actor: adminApproval?.actorName || admHistApproved?.actor || "เจ้าหน้าที่",
      isCompleted: true,
      comment: hideComments ? undefined : adminApproval?.comment || admHistApproved?.comment,
      commentTitle: hideComments ? undefined : "ความคิดเห็นของเจ้าหน้าที่",
    };
  } else if (isStep3Pending) {
    const currentAdminComment = admHistPending?.comment || admHistReturned?.comment || adminApproval?.comment;
    const currentAdminCommentTitle =
      admHistPending?.commentTitle || admHistReturned?.commentTitle || "ข้อความจากเจ้าหน้าที่";
    step3Item = {
      action: "เจ้าหน้าที่ตรวจสอบเอกสารครบถ้วน",
      date: "กำลังดำเนินการ",
      actor: adminApproval?.actorName || "เจ้าหน้าที่",
      isPending: true,
      comment: hideComments ? undefined : currentAdminComment,
      commentTitle: hideComments || !currentAdminComment ? undefined : currentAdminCommentTitle,
    };
  } else if (isStep3Returned) {
    const rDate = admHistReturned?.date || adminApproval?.date;
    step3Item = {
      action: "เจ้าหน้าที่ตรวจสอบเอกสารครบถ้วน",
      date: rDate ? `ส่งกลับมาแก้ไข (${rDate})` : "ส่งกลับมาแก้ไข",
      actor: adminApproval?.actorName || admHistReturned?.actor || "เจ้าหน้าที่",
      isUpcoming: true,
      comment: hideComments ? undefined : adminApproval?.comment || admHistReturned?.comment,
      commentTitle:
        hideComments ? undefined : admHistReturned?.commentTitle || "ความคิดเห็นของเจ้าหน้าที่",
    };
  } else if (isStep3Rejected) {
    const rejDate = admHistRejected?.date || adminApproval?.date;
    step3Item = {
      action: "เจ้าหน้าที่ตรวจสอบเอกสารครบถ้วน",
      date: rejDate ? `ไม่อนุมัติ (${rejDate})` : "ไม่อนุมัติ",
      actor: adminApproval?.actorName || admHistRejected?.actor || "เจ้าหน้าที่",
      isFailed: true,
      comment: hideComments ? undefined : adminApproval?.comment || admHistRejected?.comment,
      commentTitle: hideComments ? undefined : "เหตุผลที่ไม่อนุมัติ",
    };
  } else {
    step3Item = {
      action: "เจ้าหน้าที่ตรวจสอบเอกสารครบถ้วน",
      date: "ขั้นตอนถัดไป",
      actor: "เจ้าหน้าที่",
      isUpcoming: true,
    };
  }

  // Step 4: ผู้บริหารอนุมัติคำร้อง
  const isStep4Approved =
    execApproval?.decision === "approved" ||
    Boolean(execHistApproved) ||
    ["pending_disbursement", "disbursed", "closed"].includes(requestStatus || "");

  const isStep4Pending = requestStatus === "pending_executive";
  const isStep4Returned =
    returnedRole === "executive" ||
    (requestStatus === "pending_admin" &&
      (execApproval?.decision === "returned" || Boolean(execHistReturned)));
  const isStep4Rejected = rejectedRole === "executive";

  let step4Item: ActionHistory;
  if (isStep4Approved) {
    step4Item = {
      action: "ผู้บริหารอนุมัติคำร้อง",
      date: execApproval?.date || execHistApproved?.date || "อนุมัติเรียบร้อย",
      actor: execApproval?.actorName || execHistApproved?.actor || "ผู้บริหาร",
      isCompleted: true,
      comment: hideComments ? undefined : execApproval?.comment || execHistApproved?.comment,
      commentTitle: hideComments ? undefined : "ความคิดเห็นของผู้บริหาร",
    };
  } else if (isStep4Pending) {
    step4Item = {
      action: "ผู้บริหารอนุมัติคำร้อง",
      date: "กำลังดำเนินการ",
      actor: execApproval?.actorName || "ผู้บริหาร",
      isPending: true,
    };
  } else if (isStep4Returned) {
    const rDate = execHistReturned?.date || execApproval?.date;
    step4Item = {
      action: "ผู้บริหารอนุมัติคำร้อง",
      date: rDate ? `ส่งกลับมาแก้ไข (${rDate})` : "ส่งกลับมาแก้ไข",
      actor: execApproval?.actorName || execHistReturned?.actor || "ผู้บริหาร",
      isUpcoming: true,
      comment: hideComments ? undefined : execApproval?.comment || execHistReturned?.comment,
      commentTitle:
        hideComments ? undefined : execHistReturned?.commentTitle || "ความคิดเห็นของผู้บริหาร",
    };
  } else if (isStep4Rejected) {
    const rejDate = execHistRejected?.date || execApproval?.date;
    step4Item = {
      action: "ผู้บริหารอนุมัติคำร้อง",
      date: rejDate ? `ไม่อนุมัติ (${rejDate})` : "ไม่อนุมัติ",
      actor: execApproval?.actorName || execHistRejected?.actor || "ผู้บริหาร",
      isFailed: true,
      comment: hideComments ? undefined : execApproval?.comment || execHistRejected?.comment,
      commentTitle: hideComments ? undefined : "เหตุผลที่ไม่อนุมัติ",
    };
  } else {
    step4Item = {
      action: "ผู้บริหารอนุมัติคำร้อง",
      date: "ขั้นตอนถัดไป",
      actor: "ผู้บริหาร",
      isUpcoming: true,
    };
  }

  // Step 5: เจ้าหน้าที่โอนเงินเรียบร้อยแล้ว
  const isStep5Pending = requestStatus === "pending_disbursement";
  const isStep5Disbursed =
    requestStatus === "disbursed" ||
    requestStatus === "closed" ||
    (!isStep5Pending && Boolean(disburseHist));

  const rawTransferDetails =
    disburseHist?.transferDetails ||
    (bankDetails &&
    (bankDetails.bankName || bankDetails.accountNumber || bankDetails.accountName)
      ? [
          `ธนาคาร: ${bankDetails.bankName || "-"}`,
          `เลขที่บัญชี: ${bankDetails.accountNumber || "-"}`,
          `ชื่อบัญชี: ${bankDetails.accountName || "-"}`,
        ]
      : undefined);

  const transferDetails =
    hideBankDetails && rawTransferDetails
      ? rawTransferDetails.filter((d) => !isBankDetail(d))
      : rawTransferDetails;

  let step5Item: ActionHistory;
  if (isStep5Disbursed) {
    step5Item = {
      action: "เจ้าหน้าที่โอนเงินเรียบร้อยแล้ว",
      date: disburseHist?.date || "โอนเงินสำเร็จ",
      actor: disburseHist?.actor || "เจ้าหน้าที่การเงิน",
      isCompleted: true,
      comment: hideComments ? undefined : disburseHist?.comment,
      commentTitle:
        hideComments ? undefined : disburseHist?.commentTitle || "ความคิดเห็นของเจ้าหน้าที่การเงิน",
      transferDetails:
        transferDetails && transferDetails.length > 0 ? transferDetails : undefined,
    };
  } else if (isStep5Pending) {
    step5Item = {
      action: disburseHist?.action || "เจ้าหน้าที่การเงินดำเนินการโอนเงิน",
      date: disburseHist?.date || "กำลังดำเนินการ",
      actor: disburseHist?.actor || "เจ้าหน้าที่การเงิน",
      isPending: true,
      comment: hideComments ? undefined : disburseHist?.comment,
      commentTitle:
        hideComments ? undefined : disburseHist?.commentTitle || "ความคิดเห็นของเจ้าหน้าที่การเงิน",
      transferDetails:
        transferDetails && transferDetails.length > 0 ? transferDetails : undefined,
    };
  } else {
    step5Item = {
      action: "เจ้าหน้าที่โอนเงินเรียบร้อยแล้ว",
      date: "ขั้นตอนถัดไป",
      actor: "เจ้าหน้าที่การเงิน",
      isUpcoming: true,
    };
  }

  return [
    {
      action: step1Action,
      date: step1Date,
      actor: step1Actor,
      isCompleted: true,
      comment: hideComments ? undefined : subHist?.comment,
      commentTitle: hideComments ? undefined : subHist?.commentTitle,
    },
    step2Item,
    step3Item,
    step4Item,
    step5Item,
  ];
}

export type FullActionHistoryItem = ActionHistory & {
  statusType:
    | "submitted"
    | "resubmitted"
    | "approved"
    | "returned"
    | "rejected"
    | "disbursed"
    | "cancelled"
    | "pending";
};

export function buildFullActionHistory({
  history = [],
  approvals = [],
  requestStatus,
  bankDetails,
  advisorName,
  studentName,
  submitDate,
}: {
  history?: ActionHistory[];
  approvals?: ApprovalStep[];
  requestStatus?: string;
  bankDetails?: BankDetails;
  advisorName?: string;
  studentName?: string;
  submitDate?: string;
}): FullActionHistoryItem[] {
  const result: FullActionHistoryItem[] = [];

  const determineStatusType = (
    action: string,
    isFailed?: boolean,
    isPending?: boolean,
    isRevision?: boolean,
  ): FullActionHistoryItem["statusType"] => {
    const act = action.toLowerCase();
    if (isFailed || act.includes("ไม่อนุมัติ") || act.includes("ไม่เห็นชอบ")) {
      return "rejected";
    }
    if (act.includes("ยกเลิก")) {
      return "cancelled";
    }
    if (isPending) {
      return "pending";
    }
    if (
      act.includes("ส่งกลับ") ||
      act.includes("ส่งคืน") ||
      act.includes("แก้ไขเอกสาร") ||
      act.includes("ให้แก้ไข")
    ) {
      return "returned";
    }
    if (
      isRevision ||
      act.includes("ส่งการแก้ไข") ||
      act.includes("ยื่นคำร้องหลังแก้ไข") ||
      act.includes("ยื่นคำร้องใหม่") ||
      act.includes("ส่งคำร้องที่แก้ไข") ||
      act.includes("แก้ไขคำร้อง")
    ) {
      return "resubmitted";
    }
    if (act.includes("โอนเงิน") || act.includes("disbursed") || act.includes("disburse")) {
      return "disbursed";
    }
    if (act.includes("เห็นชอบ") || act.includes("อนุมัติ") || act.includes("ตรวจสอบ")) {
      return "approved";
    }
    if (
      act.includes("กำลังดำเนินการ") ||
      act.includes("รอพิจารณา") ||
      act.includes("อยู่ระหว่าง")
    ) {
      return "pending";
    }
    if (act.includes("ยื่นคำร้อง") || act.includes("ยื่นคำขอ") || act.includes("ส่งคำร้อง")) {
      return "submitted";
    }
    return "submitted";
  };

  const getApprovalMatch = (action: string, actor?: string) => {
    const act = (action + " " + (actor || "")).toLowerCase();
    if (
      act.includes("อาจารย์") ||
      act.includes("เห็นชอบ") ||
      act.includes("ผศ.") ||
      act.includes("ดร.") ||
      act.includes("อ.") ||
      action === "ส่งกลับให้นักศึกษาแก้ไข"
    ) {
      return approvals.filter((a) => a.step === "advisor").pop();
    }
    if (act.includes("เจ้าหน้าที่ตรวจสอบ") || act.includes("เจ้าหน้าที่")) {
      return approvals.filter((a) => a.step === "admin").pop();
    }
    if (act.includes("ผู้บริหาร")) {
      return approvals.filter((a) => a.step === "executive").pop();
    }
    if (act.includes("ส่งกลับ") || act.includes("แก้ไข")) {
      const returnApprovals = approvals.filter((a) => a.decision === "returned");
      if (returnApprovals.length > 0) {
        return returnApprovals[returnApprovals.length - 1];
      }
    }
    return undefined;
  };

  // 1. Process items in `history`
  const hasSubmissionInHistory = history.some(
    (h) =>
      h.action.includes("ยื่นคำร้อง") ||
      h.action.includes("ยื่นคำขอ") ||
      h.action.includes("ส่งคำร้อง"),
  );

  // If no initial submission in history, create one
  if (!hasSubmissionInHistory) {
    result.push({
      action: "ยื่นคำร้องขอกู้ยืม",
      date: submitDate || "ยื่นคำร้องสำเร็จ",
      actor: studentName || "นักศึกษา",
      statusType: "submitted",
      isCompleted: true,
    });
  }

  let lastReturnIndex = -1;

  for (let i = 0; i < history.length; i++) {
    const item = history[i];
    const statusType = determineStatusType(
      item.action,
      item.isFailed,
      item.isPending,
      item.isRevision,
    );
    const matchedApproval = getApprovalMatch(item.action, item.actor);

    const comment =
      item.comment || (statusType === "pending" ? undefined : matchedApproval?.comment);
    let commentTitle = item.commentTitle;
    if (!commentTitle && comment) {
      if (statusType === "returned") {
        commentTitle = item.action.includes("อาจารย์")
          ? "ข้อความจากอาจารย์ที่ปรึกษา"
          : item.action.includes("เจ้าหน้าที่")
            ? "ข้อความจากเจ้าหน้าที่"
            : item.action.includes("ผู้บริหาร")
              ? "ข้อความจากผู้บริหาร"
              : "เหตุผลที่ส่งกลับแก้ไข";
      } else if (statusType === "rejected") {
        commentTitle = "เหตุผลที่ไม่อนุมัติ";
      } else {
        commentTitle = item.action.includes("อาจารย์")
          ? "ความคิดเห็นของอาจารย์ที่ปรึกษา"
          : item.action.includes("เจ้าหน้าที่")
            ? "ความคิดเห็นของเจ้าหน้าที่"
            : item.action.includes("ผู้บริหาร")
              ? "ความคิดเห็นของผู้บริหาร"
              : "ความคิดเห็น";
      }
    }

    let transferDetails = item.transferDetails;
    if (
      !transferDetails &&
      (item.action.includes("โอนเงิน") || statusType === "disbursed") &&
      bankDetails &&
      (bankDetails.bankName || bankDetails.accountNumber || bankDetails.accountName)
    ) {
      transferDetails = [
        `ธนาคาร: ${bankDetails.bankName || "-"}`,
        `เลขที่บัญชี: ${bankDetails.accountNumber || "-"}`,
        `ชื่อบัญชี: ${bankDetails.accountName || "-"}`,
      ];
    }

    const enrichedItem: FullActionHistoryItem = {
      ...item,
      actor: item.actor || matchedApproval?.actorName || "ผู้ดำเนินการ",
      comment,
      commentTitle,
      statusType,
      isCompleted: statusType !== "pending",
      transferDetails,
    };

    result.push(enrichedItem);

    if (statusType === "returned") {
      lastReturnIndex = result.length - 1;
    }
  }

  // 2. Check if student resubmission needs to be synthesized
  // If there was a return in history, but requestStatus has moved beyond "returned"
  // (e.g. "pending_advisor", "pending_admin", "pending_executive", "pending_disbursement", "disbursed")
  // and no subsequent resubmission item was recorded in history:
  if (lastReturnIndex !== -1 && requestStatus && requestStatus !== "returned") {
    const itemsAfterReturn = result.slice(lastReturnIndex + 1);
    const hasResubmissionAfterReturn = itemsAfterReturn.some(
      (item) => item.statusType === "resubmitted",
    );

    if (!hasResubmissionAfterReturn) {
      const resubmissionItem: FullActionHistoryItem = {
        action: "ส่งการแก้ไขคำร้อง",
        date: "ส่งแก้ไขเรียบร้อย",
        actor: studentName || "นักศึกษา",
        statusType: "resubmitted",
        isCompleted: true,
      };
      // Insert right after the return item
      result.splice(lastReturnIndex + 1, 0, resubmissionItem);
    }
  }

  // 3. Approvals that may not have been in `history`:
  const advisorApproval = approvals.find((a) => a.step === "advisor" && a.decision !== "pending");
  const adminApproval = approvals.find((a) => a.step === "admin" && a.decision !== "pending");
  const execApproval = approvals.find((a) => a.step === "executive" && a.decision !== "pending");

  const hasAdvisorInResult = result.some(
    (r) =>
      r.action.includes("อาจารย์") ||
      (r.actor &&
        (r.actor.includes("อาจารย์") || r.actor.includes("ผศ.") || r.actor.includes("ดร."))) ||
      (r.statusType === "approved" && r.action.includes("เห็นชอบ")),
  );
  if (advisorApproval && !hasAdvisorInResult) {
    result.push({
      action:
        advisorApproval.decision === "approved"
          ? "อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ"
          : advisorApproval.decision === "returned"
            ? "อาจารย์ที่ปรึกษาส่งกลับแก้ไข"
            : "อาจารย์ที่ปรึกษาไม่อนุมัติ",
      date: advisorApproval.date || "เห็นชอบแล้ว",
      actor: advisorApproval.actorName || advisorName || "อาจารย์ที่ปรึกษา",
      comment: advisorApproval.comment,
      commentTitle:
        advisorApproval.decision === "returned"
          ? "ข้อความจากอาจารย์ที่ปรึกษา"
          : advisorApproval.decision === "rejected"
            ? "เหตุผลที่ไม่อนุมัติ"
            : "ความคิดเห็นของอาจารย์ที่ปรึกษา",
      statusType:
        advisorApproval.decision === "approved"
          ? "approved"
          : advisorApproval.decision === "returned"
            ? "returned"
            : "rejected",
      isCompleted: true,
    });
  }

  const hasAdminInResult = result.some(
    (r) =>
      r.action.includes("เจ้าหน้าที่ตรวจสอบ") ||
      (r.action.includes("ตรวจสอบ") && r.statusType === "approved"),
  );
  if (adminApproval && !hasAdminInResult) {
    result.push({
      action:
        adminApproval.decision === "approved"
          ? "เจ้าหน้าที่ตรวจสอบเอกสารครบถ้วน"
          : adminApproval.decision === "returned"
            ? "เจ้าหน้าที่ส่งกลับแก้ไข"
            : "เจ้าหน้าที่ไม่อนุมัติ",
      date: adminApproval.date || "ตรวจสอบเรียบร้อย",
      actor: adminApproval.actorName || "เจ้าหน้าที่",
      comment: adminApproval.comment,
      commentTitle:
        adminApproval.decision === "returned"
          ? "ข้อความจากเจ้าหน้าที่"
          : adminApproval.decision === "rejected"
            ? "เหตุผลที่ไม่อนุมัติ"
            : "ความคิดเห็นของเจ้าหน้าที่",
      statusType:
        adminApproval.decision === "approved"
          ? "approved"
          : adminApproval.decision === "returned"
            ? "returned"
            : "rejected",
      isCompleted: true,
    });
  }

  const hasExecInResult = result.some(
    (r) =>
      r.action.includes("ผู้บริหารอนุมัติ") ||
      (r.actor && r.actor.includes("ผู้บริหาร") && r.statusType === "approved"),
  );
  if (execApproval && !hasExecInResult) {
    result.push({
      action:
        execApproval.decision === "approved"
          ? "ผู้บริหารอนุมัติคำร้อง"
          : execApproval.decision === "returned"
            ? "ผู้บริหารส่งกลับแก้ไข"
            : "ผู้บริหารไม่อนุมัติ",
      date: execApproval.date || "อนุมัติเรียบร้อย",
      actor: execApproval.actorName || "ผู้บริหาร",
      comment: execApproval.comment,
      commentTitle:
        execApproval.decision === "returned"
          ? "ข้อความจากผู้บริหาร"
          : execApproval.decision === "rejected"
            ? "เหตุผลที่ไม่อนุมัติ"
            : "ความคิดเห็นของผู้บริหาร",
      statusType:
        execApproval.decision === "approved"
          ? "approved"
          : execApproval.decision === "returned"
            ? "returned"
            : "rejected",
      isCompleted: true,
    });
  }

  // 4. Disbursement item check
  const hasDisbursementInResult = result.some(
    (r) => r.action.includes("โอนเงิน") || r.statusType === "disbursed",
  );
  if ((requestStatus === "disbursed" || requestStatus === "closed") && !hasDisbursementInResult) {
    const rawTransferDetails =
      bankDetails && (bankDetails.bankName || bankDetails.accountNumber || bankDetails.accountName)
        ? [
            `ธนาคาร: ${bankDetails.bankName || "-"}`,
            `เลขที่บัญชี: ${bankDetails.accountNumber || "-"}`,
            `ชื่อบัญชี: ${bankDetails.accountName || "-"}`,
          ]
        : undefined;

    result.push({
      action: "เจ้าหน้าที่โอนเงินเรียบร้อยแล้ว",
      date: "โอนเงินสำเร็จ",
      actor: "เจ้าหน้าที่การเงิน",
      statusType: "disbursed",
      isCompleted: true,
      transferDetails: rawTransferDetails,
    });
  }

  // 5. Current pending stage indicator (if status is in progress)
  const lastItem = result[result.length - 1];
  if (requestStatus === "pending_advisor" && lastItem?.statusType !== "pending") {
    result.push({
      action: "อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ",
      date: "กำลังดำเนินการ",
      actor: advisorName || "อาจารย์ที่ปรึกษา",
      statusType: "pending",
      isPending: true,
    });
  } else if (requestStatus === "pending_admin" && lastItem?.statusType !== "pending") {
    result.push({
      action: "เจ้าหน้าที่ตรวจสอบเอกสารครบถ้วน",
      date: "กำลังดำเนินการ",
      actor: "เจ้าหน้าที่",
      statusType: "pending",
      isPending: true,
    });
  } else if (requestStatus === "pending_executive" && lastItem?.statusType !== "pending") {
    result.push({
      action: "ผู้บริหารอนุมัติคำร้อง",
      date: "กำลังดำเนินการ",
      actor: "ผู้บริหาร",
      statusType: "pending",
      isPending: true,
    });
  } else if (requestStatus === "pending_disbursement" && lastItem?.statusType !== "pending") {
    result.push({
      action: "เจ้าหน้าที่โอนเงินเรียบร้อยแล้ว",
      date: "กำลังดำเนินการ",
      actor: "เจ้าหน้าที่การเงิน",
      statusType: "pending",
      isPending: true,
    });
  }

  return result;
}
