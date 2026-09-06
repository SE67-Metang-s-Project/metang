import StudentDashboard from "@/components/student/dashboard/StudentDashboard";
import { StudentLanguageProvider } from "./StudentLanguageProvider";

export default function StudentPage() {
  return (
    <StudentLanguageProvider>
      <StudentDashboard />
    </StudentLanguageProvider>
  );
}
