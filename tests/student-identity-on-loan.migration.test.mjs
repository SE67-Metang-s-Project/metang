import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const migration = read("db/migrations/20261001120000_student_identity_on_loan_request/migration.sql");
const statements = migration
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

test("the migration runs as one transaction", () => {
  assert.match(migration, /BEGIN;/);
  assert.match(migration, /COMMIT;\s*$/);
});

test("loans are backfilled from app_user before student_id is dropped", () => {
  const backfill = statements.indexOf('SET "student_code" = u."student_code"');
  assert.ok(backfill > 0);
  assert.ok(backfill < statements.indexOf('DROP COLUMN "student_id"'));
  assert.match(statements, /RAISE EXCEPTION 'Cannot backfill loan_request\.student_code/);
  assert.match(statements, /ALTER COLUMN "student_code" SET NOT NULL/);
});

test("one open loan per student is keyed by student code", () => {
  assert.match(
    statements,
    /CREATE UNIQUE INDEX "one_open_loan_per_student" ON "public"\."loan_request"\("student_code" ASC\)\s*WHERE/,
  );
});

test("each audit row names exactly one actor: a staff id or a student code", () => {
  assert.match(statements, /ALTER COLUMN "actor_id" DROP NOT NULL/);
  assert.match(statements, /CHECK \(num_nonnulls\("actor_id", "actor_student_code"\) = 1\)/);
  // Student audit rows are repointed before the student rows are deleted.
  assert.ok(
    statements.indexOf('SET "actor_student_code" = s."student_code"') <
      statements.indexOf('DELETE FROM "public"."app_user"'),
  );
});

test("only student-only app_user rows are deleted", () => {
  assert.match(statements, /r\.role = 'student'\)\s*AND NOT EXISTS \([^)]*r\.role <> 'student'\)/);
  assert.match(statements, /DELETE FROM "public"\."user_role" WHERE "role" = 'student';/);
  assert.match(statements, /DROP COLUMN "student_code",\s*DROP COLUMN "education_level";/);
});

test("students never get an app_user row at sign-in or at submit", () => {
  const users = read("db/queries/users.ts");
  const sync = users.slice(users.indexOf("export async function syncUserFromCmuProfile"));
  assert.doesNotMatch(sync.slice(0, sync.indexOf("export async function listAdvisors")), /appUser\.create|userRole/);
  assert.doesNotMatch(read("app/api/student/loan-requests/route.ts"), /appUser\.(create|update|upsert)|userRole/);
});

test("a student's phone is saved on their open loan only, and a new loan takes it at submit", () => {
  const route = read("app/api/student/phone-number/route.ts");
  assert.match(
    route,
    /updateMany\(\{\s*where: \{ studentCode: context\.user\.studentCode, status: \{ notIn: \["closed", "rejected", "cancelled"\] \} \}/,
  );
  assert.match(route, /if \(updated\.count !== 1\) \{\s*return apiError\("CONFLICT"/);
  assert.match(read("app/api/student/loan-requests/route.ts"), /studentPhone: input\.phoneNumber \?\? student\.phone/);
});

test("resubmit refreshes the borrower's names, email, and degree from the session", () => {
  const route = read("app/api/student/loan-requests/[id]/resubmit/route.ts");
  assert.match(route, /studentNameTh: context\.user\.fullNameTh,/);
  assert.match(route, /studentNameEn: context\.user\.fullNameEn,/);
  assert.match(route, /\.\.\.\(context\.user\.email \? \{ studentEmail: context\.user\.email \} : \{\}\)/);
  assert.match(route, /studentEducationLevel: getEducationLevelCode\(context\.user\.studentCode\),/);
});

test("cancelled_by is gone: nothing still writes it", () => {
  assert.match(statements, /DROP COLUMN "cancelled_by"/);
  assert.doesNotMatch(read("db/queries/loan-requests.ts"), /cancelledBy/);
});

test("the degree is stored as its code: the backfill turns Thai names into codes, and a CHECK keeps it so", () => {
  assert.match(statements, /"student_education_level" = CASE u\."education_level"\s*WHEN 'ประกาศนียบัตรผู้ช่วยพยาบาล' THEN '0'\s*WHEN 'ปริญญาตรี' THEN '1'\s*WHEN 'ปริญญาโท' THEN '3'\s*WHEN 'ปริญญาเอก' THEN '5'/);
  assert.match(statements, /CHECK \("student_education_level" IN \('0', '1', '3', '5'\)\)/);
  assert.match(read("app/api/student/loan-requests/route.ts"), /studentEducationLevel: getEducationLevelCode\(student\.studentCode\),/);
});
