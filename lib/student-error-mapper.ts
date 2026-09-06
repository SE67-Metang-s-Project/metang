export type StudentErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "CONFLICT"
  | "NOT_FOUND"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR";

export type StudentUiError = {
  status: number;
  code: StudentErrorCode;
  title: string;
  message: string;
  field?: string;
  action?: "login" | "dashboard" | "refresh" | "retry";
};

type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
  };
  message?: string;
};

const FIELD_ERROR_PATTERNS: Array<{
  pattern: RegExp;
  field: string;
  message: string;
}> = [
  {
    pattern: /advisorName/i,
    field: "advisorName",
    message: "ไม่พบข้อมูลอาจารย์ที่ปรึกษาที่เลือก หรือชื่ออาจารย์ซ้ำซ้อนในระบบ",
  },
  {
    pattern: /\bamount\b/i,
    field: "loanAmount",
    message: "จำนวนเงินกู้ยืมไม่ถูกต้อง กรุณาระบุจำนวนเงินที่ถูกต้อง",
  },
  {
    pattern: /studentYear/i,
    field: "academicYear",
    message: "ชั้นปีการศึกษาไม่ถูกต้อง กรุณาเลือกชั้นปี 1-4",
  },
  {
    pattern: /\bpurpose\b/i,
    field: "purpose",
    message: "กรุณาระบุวัตถุประสงค์การกู้ยืม",
  },
  {
    pattern: /bankAccountNo/i,
    field: "accountNumber",
    message: "เลขที่บัญชีธนาคารไม่ถูกต้อง กรุณากรอกเลขที่บัญชี 10 หลัก",
  },
  {
    pattern: /bankAccountName/i,
    field: "accountName",
    message: "กรุณากรอกชื่อบัญชีธนาคาร",
  },
  {
    pattern: /bankName/i,
    field: "bankName",
    message: "กรุณาเลือกหรือระบุธนาคาร",
  },
  {
    pattern: /installmentCount/i,
    field: "installmentCount",
    message: "จำนวนงวดการชำระไม่ถูกต้อง (1-4 งวด)",
  },
  {
    pattern: /phoneNumber/i,
    field: "phoneNumber",
    message: "เบอร์โทรศัพท์ไม่ถูกต้อง กรุณากรอกเบอร์โทรศัพท์ 10 หลัก",
  },
  {
    pattern: /CMU account/i,
    field: "cmuAccount",
    message: "ไม่พบข้อมูลบัญชี CMU Account ในเซสชัน กรุณาเข้าสู่ระบบใหม่",
  },
  {
    pattern: /CMU identity/i,
    field: "cmuIdentity",
    message: "ข้อมูลบัญชี CMU ไม่ตรงกับข้อมูลนักศึกษาในระบบ",
  },
];

export function mapStudentApiError(
  status: number,
  payload?: ApiErrorPayload | null,
  context?: { isResubmit?: boolean },
): StudentUiError {
  const rawMessage = payload?.error?.message || payload?.message || "";
  const rawCode = payload?.error?.code || "";

  // 401 / 403 Unauthorized
  if (status === 401 || status === 403 || rawCode === "UNAUTHORIZED") {
    return {
      status,
      code: "UNAUTHORIZED",
      title: "เซสชันหมดอายุ",
      message: "เซสชันการเข้าสู่ระบบหมดอายุหรือไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
      action: "login",
    };
  }

  // 404 Not Found
  if (status === 404 || rawCode === "NOT_FOUND") {
    return {
      status,
      code: "NOT_FOUND",
      title: "ไม่พบข้อมูลคำร้อง",
      message:
        rawMessage ||
        (context?.isResubmit
          ? "ไม่พบคำร้องที่ต้องการแก้ไข หรือคำร้องอาจถูกลบไปแล้ว"
          : "ไม่พบข้อมูลคำร้องขอกู้ยืมที่ระบุ"),
      action: "dashboard",
    };
  }

  // 409 Conflict
  if (status === 409 || rawCode === "CONFLICT") {
    if (context?.isResubmit) {
      return {
        status,
        code: "CONFLICT",
        title: "คำร้องมีการเปลี่ยนแปลง",
        message:
          "คำร้องนี้ได้รับการเปลี่ยนแปลงหรือไม่อยู่ในสถานะที่แก้ไขได้แล้ว กรุณาตรวจสอบสถานะล่าสุด",
        action: "refresh",
      };
    }

    return {
      status,
      code: "CONFLICT",
      title: "มีคำร้องที่กำลังดำเนินการอยู่แล้ว",
      message: "ท่านมีคำร้องขอกู้ยืมที่กำลังดำเนินการอยู่แล้ว ระบบอนุญาตให้เปิดได้ครั้งละ 1 คำร้อง",
      action: "dashboard",
    };
  }

  // 422 Validation Error
  if (status === 422 || status === 400 || rawCode === "VALIDATION_ERROR") {
    for (const item of FIELD_ERROR_PATTERNS) {
      if (item.pattern.test(rawMessage)) {
        return {
          status,
          code: "VALIDATION_ERROR",
          title: "ข้อมูลไม่ถูกต้อง",
          message: item.message,
          field: item.field,
          action: "retry",
        };
      }
    }

    return {
      status,
      code: "VALIDATION_ERROR",
      title: "ข้อมูลไม่ถูกต้อง",
      message: rawMessage || "ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบความถูกต้องของข้อมูล",
      action: "retry",
    };
  }

  // 500 / 502 / 503 / 504 Server Errors
  if (status >= 500) {
    return {
      status,
      code: "INTERNAL_ERROR",
      title: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์",
      message: "ระบบเซิร์ฟเวอร์ขัดข้องชั่วคราว กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
      action: "retry",
    };
  }

  // Generic fallback
  return {
    status,
    code: "INTERNAL_ERROR",
    title: "เกิดข้อผิดพลาด",
    message: rawMessage || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง",
    action: "retry",
  };
}

export function mapNetworkError(error?: unknown): StudentUiError {
  return {
    status: 0,
    code: "NETWORK_ERROR",
    title: "การเชื่อมต่อขัดข้อง",
    message:
      error instanceof Error && error.message
        ? `ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: ${error.message}`
        : "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
    action: "retry",
  };
}
