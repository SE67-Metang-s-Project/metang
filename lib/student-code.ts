// The fifth digit of a CMU student code names the degree. loan_request.student_education_level
// stores that digit ("0", "1", "3", "5"); pages show its name.
const educationLevelNameByCode: Record<string, string> = {
  "0": "ประกาศนียบัตรผู้ช่วยพยาบาล",
  "1": "ปริญญาตรี",
  "3": "ปริญญาโท",
  "5": "ปริญญาเอก",
};

/** The degree code a student code carries, or null when its fifth digit names no degree. */
export const getEducationLevelCode = (studentCode: string | null) => {
  const digit = studentCode?.charAt(4);
  return digit && Object.hasOwn(educationLevelNameByCode, digit) ? digit : null;
};

/** The Thai name of a stored degree code. */
export const getEducationLevelName = (code: string | null) =>
  (code && educationLevelNameByCode[code]) || null;
