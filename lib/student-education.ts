"use client";

import { useSyncExternalStore } from "react";

export const STUDENT_EDUCATION_LEVEL_STORAGE_KEY = "methang.student.education-level";

const STUDENT_EDUCATION_LEVEL_EVENT = "methang:student-education-level-change";

const getEducationLevelSnapshot = () =>
  window.localStorage.getItem(STUDENT_EDUCATION_LEVEL_STORAGE_KEY);

const getEducationLevelServerSnapshot = () => null;

const subscribeToEducationLevel = (onStoreChange: () => void) => {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === STUDENT_EDUCATION_LEVEL_STORAGE_KEY) onStoreChange();
  };

  window.addEventListener("storage", handleStorageChange);
  window.addEventListener(STUDENT_EDUCATION_LEVEL_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener(STUDENT_EDUCATION_LEVEL_EVENT, onStoreChange);
  };
};

export const useStudentEducationLevel = () =>
  useSyncExternalStore(
    subscribeToEducationLevel,
    getEducationLevelSnapshot,
    getEducationLevelServerSnapshot,
  );

export const saveStudentEducationLevel = (educationLevel: string) => {
  window.localStorage.setItem(STUDENT_EDUCATION_LEVEL_STORAGE_KEY, educationLevel);
  window.dispatchEvent(new Event(STUDENT_EDUCATION_LEVEL_EVENT));
};
