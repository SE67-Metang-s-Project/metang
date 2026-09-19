"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import {
  sendDemoReviewerNotification,
  type FonReviewerDemoState,
} from "@/app/demo/fon-reviewer/actions";
import type { ReviewerRole } from "@/lib/reviewer-deeplink";

const initialState: FonReviewerDemoState = {
  status: "idle",
  message: "",
};

const inputClassName =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm " +
  "outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

const ROLE_LABELS: Record<ReviewerRole, string> = {
  advisor: "Advisor",
  admin: "Admin",
  super_admin: "Super Admin",
  executive: "Executive",
};

type FonReviewerDemoFormProps = {
  recipientsByRole: Record<ReviewerRole, string[]>;
};

export function FonReviewerDemoForm({ recipientsByRole }: FonReviewerDemoFormProps) {
  const [state, formAction, isPending] = useActionState(
    sendDemoReviewerNotification,
    initialState,
  );
  const [role, setRole] = useState<ReviewerRole>("advisor");
  const recipients = useMemo(() => recipientsByRole[role] ?? [], [recipientsByRole, role]);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block text-sm font-medium text-zinc-800">
        Reviewer Role
        <select
          className={inputClassName}
          name="role"
          onChange={(e) => setRole(e.target.value as ReviewerRole)}
          value={role}
        >
          {(Object.keys(ROLE_LABELS) as ReviewerRole[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-zinc-800">
        Recipient Email
        {recipients.length === 0 ? (
          <p className="mt-1 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            ไม่พบผู้ใช้ในบทบาทนี้
          </p>
        ) : (
          <select className={inputClassName} name="recipientEmail" required>
            {recipients.map((email) => (
              <option key={email} value={email}>
                {email}
              </option>
            ))}
          </select>
        )}
      </label>

      <label className="block text-sm font-medium text-zinc-800">
        Loan ID
        <input className={inputClassName} defaultValue="REQ202609060001" name="loanId" />
      </label>

      <label className="block text-sm font-medium text-zinc-800">
        Student Name
        <input className={inputClassName} defaultValue="สมชาย ใจดี" name="studentName" required />
      </label>

      <label className="block text-sm font-medium text-zinc-800">
        Amount
        <input
          className={inputClassName}
          defaultValue={30000}
          min={0}
          name="amount"
          required
          type="number"
        />
      </label>

      <label className="block text-sm font-medium text-zinc-800">
        Event Label
        <input
          className={inputClassName}
          defaultValue="มีคำร้องใหม่รอการตรวจสอบ"
          name="eventLabel"
          required
        />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-zinc-800">
        <input defaultChecked name="dryRun" type="checkbox" />
        Dry run (log payload to server console instead of sending)
      </label>

      <button
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "กำลังส่ง..." : "ส่งการแจ้งเตือน"}
      </button>

      {state.status !== "idle" ? (
        <p
          aria-live="polite"
          className={`rounded-lg px-3 py-2 text-sm ${
            state.status === "success"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
