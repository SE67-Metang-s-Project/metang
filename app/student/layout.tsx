import { StudentLanguageProvider } from "./StudentLanguageProvider";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <StudentLanguageProvider>{children}</StudentLanguageProvider>;
}
