import { StudentLanguageProvider } from "./StudentLanguageProvider";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudentLanguageProvider>
      {children}
      <footer aria-hidden="true" className="h-[45px]" />
    </StudentLanguageProvider>
  );
}
