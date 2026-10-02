"use client";

import type { ComponentProps } from "react";
import TopNav from "@/components/shared/TopNav";
import { useStudentLanguage } from "@/app/student/StudentLanguageProvider";

type StudentTopNavProps = ComponentProps<typeof TopNav> & {
  userNameEn?: string;
};

export default function StudentTopNav({ userNameEn, ...props }: StudentTopNavProps) {
  const { language, t } = useStudentLanguage();

  return (
    <TopNav
      {...props}
      userName={language === "en" && userNameEn ? userNameEn : props.userName}
      userRole={props.userRole === "นักศึกษา" ? t("นักศึกษา", "Student") : props.userRole}
      showSidebarButton={false}
      onOpenSidebar={undefined}
    />
  );
}
