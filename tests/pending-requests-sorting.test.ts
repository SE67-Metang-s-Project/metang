import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  sortRequestsBySubmissionDateDesc,
  getSubmittedTime,
  parseThaiDateTimeToMs,
  getRequestSubmissionTimestamp,
} from "@/lib/pending-requests-sorting";
import type { ActionRequest } from "@/components/shared/pending/RequestsCard";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

function createMockPendingRequest(overrides: Partial<ActionRequest>): ActionRequest {
  return {
    id: "REQ-001",
    name: "นักศึกษา ทดสอบ",
    studentId: "670510001",
    major: "พยาบาลศาสตร์",
    year: "3",
    objective: "ค่าเล่าเรียน",
    amount: "20,000",
    term: "2",
    submitDate: "15 ก.ย. 2569",
    requestStatus: "pending_advisor",
    ...overrides,
  };
}

test("sortRequestsBySubmissionDateDesc sorts requests with different dates (latest first)", () => {
  const reqOld = createMockPendingRequest({
    id: "REQ-OLD",
    submitDate: "10 ก.ย. 2569",
    submitTime: "10:00 น.",
  });
  const reqMid = createMockPendingRequest({
    id: "REQ-MID",
    submitDate: "15 ก.ย. 2569",
    submitTime: "10:00 น.",
  });
  const reqNew = createMockPendingRequest({
    id: "REQ-NEW",
    submitDate: "19 ก.ย. 2569",
    submitTime: "10:00 น.",
  });

  const sorted = sortRequestsBySubmissionDateDesc([reqOld, reqNew, reqMid]);
  assert.deepEqual(
    sorted.map((r) => r.id),
    ["REQ-NEW", "REQ-MID", "REQ-OLD"],
  );
});

test("sortRequestsBySubmissionDateDesc sorts requests on the same date by submission time (latest first)", () => {
  const reqMorning = createMockPendingRequest({
    id: "REQ-MORNING",
    submitDate: "19 ก.ย. 2569",
    submitTime: "08:30 น.",
  });
  const reqNoon = createMockPendingRequest({
    id: "REQ-NOON",
    submitDate: "19 ก.ย. 2569",
    submitTime: "12:15 น.",
  });
  const reqEvening = createMockPendingRequest({
    id: "REQ-EVENING",
    submitDate: "19 ก.ย. 2569",
    submitTime: "18:45 น.",
  });

  const sorted = sortRequestsBySubmissionDateDesc([reqMorning, reqEvening, reqNoon]);
  assert.deepEqual(
    sorted.map((r) => r.id),
    ["REQ-EVENING", "REQ-NOON", "REQ-MORNING"],
  );
});

test("sortRequestsBySubmissionDateDesc handles ISO submittedAt accurately", () => {
  const req1 = createMockPendingRequest({
    id: "REQ-1",
    submittedAt: "2026-09-19T10:00:00.000Z",
    submitDate: "19 ก.ย. 2569",
    submitTime: "17:00 น.",
  });
  const req2 = createMockPendingRequest({
    id: "REQ-2",
    submittedAt: "2026-09-19T12:30:00.000Z",
    submitDate: "19 ก.ย. 2569",
    submitTime: "19:30 น.",
  });

  const sorted = sortRequestsBySubmissionDateDesc([req1, req2]);
  assert.deepEqual(
    sorted.map((r) => r.id),
    ["REQ-2", "REQ-1"],
  );
});

test("sortRequestsBySubmissionDateDesc extracts submission datetime from history when submitTime is omitted", () => {
  const reqEarlier = createMockPendingRequest({
    id: "REQ-EARLIER",
    submitDate: "19 ก.ย. 2569",
    history: [
      {
        action: "ยื่นคำร้องขอกู้ยืม",
        date: "19 ก.ย. 2569 09:15",
        actor: "นักศึกษา",
      },
    ],
  });
  const reqLater = createMockPendingRequest({
    id: "REQ-LATER",
    submitDate: "19 ก.ย. 2569",
    history: [
      {
        action: "ยื่นคำร้องขอกู้ยืม",
        date: "19 ก.ย. 2569 16:30",
        actor: "นักศึกษา",
      },
    ],
  });

  const sorted = sortRequestsBySubmissionDateDesc([reqEarlier, reqLater]);
  assert.deepEqual(
    sorted.map((r) => r.id),
    ["REQ-LATER", "REQ-EARLIER"],
  );
});

test("getSubmittedTime extracts and formats time correctly", () => {
  assert.equal(
    getSubmittedTime(createMockPendingRequest({ submitTime: "14:30 น." })),
    "14:30 น.",
  );
  assert.equal(
    getSubmittedTime(createMockPendingRequest({ submitTime: "09:15" })),
    "09:15 น.",
  );
  assert.equal(
    getSubmittedTime(
      createMockPendingRequest({
        history: [{ action: "ยื่นคำร้องขอกู้ยืม", date: "18 ก.ย. 2569 11:20", actor: "นักศึกษา" }],
      }),
    ),
    "11:20 น.",
  );
});

test("pending queries and api routes sort by submittedAt desc (latest first)", () => {
  const query = read("db/queries/loan-requests.ts");
  assert.match(
    query,
    /orderBy:\s*\[\s*\{\s*submittedAt:\s*\{\s*sort:\s*"desc",\s*nulls:\s*"last"\s*\}\s*\},/,
    "getActionRequests must order by submittedAt desc with nulls last",
  );

  const advisorRoute = read("app/api/advisor/loan-requests/route.ts");
  assert.match(
    advisorRoute,
    /submittedAt:\s*\{\s*sort:\s*"desc",\s*nulls:\s*"last"\s*\}/,
    "Advisor API route must order by submittedAt desc",
  );

  const adminRoute = read("app/api/admin/loan-requests/route.ts");
  assert.match(
    adminRoute,
    /submittedAt:\s*\{\s*sort:\s*"desc",\s*nulls:\s*"last"\s*\}/,
    "Admin API route must order by submittedAt desc",
  );

  const executiveRoute = read("app/api/executive/loan-requests/route.ts");
  assert.match(
    executiveRoute,
    /submittedAt:\s*\{\s*sort:\s*"desc",\s*nulls:\s*"last"\s*\}/,
    "Executive API route must order by submittedAt desc",
  );
});

test("parseThaiDateTimeToMs and getRequestSubmissionTimestamp calculate timestamps properly", () => {
  const ms1 = parseThaiDateTimeToMs("19 ก.ย. 2569", "10:00 น.");
  const ms2 = parseThaiDateTimeToMs("19 ก.ย. 2569", "11:00 น.");
  assert.ok(ms2 > ms1);

  const req = createMockPendingRequest({
    submitDate: "19 ก.ย. 2569",
    submitTime: "10:00 น.",
  });
  assert.equal(getRequestSubmissionTimestamp(req), ms1);
});
