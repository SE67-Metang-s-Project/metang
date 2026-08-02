import { getAllStudents } from "@/db/queries/users";

export const dynamic = "force-dynamic";

export default async function AdvisorStudentsPage() {
  const students = await getAllStudents();

  return (
    <ul>
      {students.map((student) => (
        <li key={student.id}>
          {student.studentCode} — {student.fullNameTh}
        </li>
      ))}
    </ul>
  );
}
