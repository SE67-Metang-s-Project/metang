"use client";

import { useActionState } from "react";
import {
  sendDemoReviewerNotification,
  type FonReviewerDemoState,
} from "@/app/fon-reviewer-demo/actions";

const initialState: FonReviewerDemoState = {
  status: "idle",
  message: "",
};

const inputClassName =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm " +
  "outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export function FonReviewerDemoForm() {
  const [state, formAction, isPending] = useActionState(
    sendDemoReviewerNotification,
    initialState,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block text-sm font-medium text-zinc-800">
        Reviewer Role
        <select className={inputClassName} defaultValue="advisor" name="role">
          <option value="advisor">Advisor</option>
          <option value="admin">Admin</option>
          <option value="executive">Executive</option>
        </select>
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
