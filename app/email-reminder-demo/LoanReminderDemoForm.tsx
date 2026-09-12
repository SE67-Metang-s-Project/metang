"use client";

import { useActionState } from "react";
import {
  sendDemoLoanReminder,
  type LoanReminderDemoState,
} from "@/app/email-reminder-demo/actions";

const initialState: LoanReminderDemoState = {
  status: "idle",
  message: "",
};

type LoanReminderDemoFormProps = {
  email: string;
};

const inputClassName =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm " +
  "outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

function getDefaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function LoanReminderDemoForm({ email }: LoanReminderDemoFormProps) {
  const [state, formAction, isPending] = useActionState(
    sendDemoLoanReminder,
    initialState,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block text-sm font-medium text-zinc-800">
        Student Name
        <input
          className={inputClassName}
          defaultValue="สมชาย ใจดี"
          name="studentName"
          required
        />
      </label>

      <label className="block text-sm font-medium text-zinc-800">
        CMU email
        <input
          className={`${inputClassName} bg-zinc-100 text-zinc-500`}
          readOnly
          type="email"
          value={email}
        />
      </label>

      <label className="block text-sm font-medium text-zinc-800">
        Installment Sequence
        <input
          className={inputClassName}
          defaultValue={1}
          min={1}
          name="installmentSeq"
          required
          type="number"
        />
      </label>

      <label className="block text-sm font-medium text-zinc-800">
        Amount Due
        <input
          className={inputClassName}
          defaultValue={5000}
          min={0}
          name="amountDue"
          required
          type="number"
        />
      </label>

      <label className="block text-sm font-medium text-zinc-800">
        Due Date
        <input
          className={inputClassName}
          defaultValue={getDefaultDueDate()}
          name="dueDate"
          required
          type="date"
        />
      </label>

      <label className="block text-sm font-medium text-zinc-800">
        Loan ID
        <input
          className={inputClassName}
          defaultValue="REQ202609060001"
          name="loanId"
          required
        />
      </label>

      <button
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "กำลังส่ง..." : "ส่งอีเมลแจ้งเตือน"}
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
