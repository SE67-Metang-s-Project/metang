import { StudentLanguageProvider } from "./StudentLanguageProvider";

export default function StudentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <StudentLanguageProvider>{children}</StudentLanguageProvider>;
}