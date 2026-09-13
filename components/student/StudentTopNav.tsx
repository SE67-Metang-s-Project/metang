"use client";

import TopNav, { type TopNavProps } from "@/components/shared/TopNav";
import { useStudentLanguage } from "@/app/student/StudentLanguageProvider";

type StudentTopNavProps = Omit<TopNavProps, "language" | "onLanguageChange"> & {
  userNameEn?: string;
};

export default function StudentTopNav({ userNameEn, ...props }: StudentTopNavProps) {
  const { language, setLanguage, t } = useStudentLanguage();

  return (
    <TopNav
      {...props}
      dashboardHref="/student"
      language={language}
      logoutLabel={t("ออกจากระบบ", "Log out")}
      onLanguageChange={setLanguage}
      userName={language === "en" && userNameEn ? userNameEn : props.userName}
      userRole={props.userRole === "นักศึกษา" ? t("นักศึกษา", "Student") : props.userRole}
    />
  );
}
