export const STUDENT_APPLICATION_PROFILE_STORAGE_KEY = "methang.student.application-profile";

export type SavedStudentApplicationProfile = {
  academicYear: string;
  advisorName: string;
  educationLevel: string;
  phoneNumber: string;
};

export const getSavedStudentApplicationProfile = (): Partial<SavedStudentApplicationProfile> => {
  if (typeof window === "undefined") return {};

  try {
    const value = window.localStorage.getItem(STUDENT_APPLICATION_PROFILE_STORAGE_KEY);
    return value ? (JSON.parse(value) as Partial<SavedStudentApplicationProfile>) : {};
  } catch {
    return {};
  }
};

export const saveStudentApplicationProfile = (profile: SavedStudentApplicationProfile) => {
  window.localStorage.setItem(STUDENT_APPLICATION_PROFILE_STORAGE_KEY, JSON.stringify(profile));
};
