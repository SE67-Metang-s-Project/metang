"use client";

import { useActionState } from "react";
import {
  sendDemoNotification,
  type NotificationDemoState,
} from "@/app/notification-demo/actions";

const initialState: NotificationDemoState = {
  status: "idle",
  message: "",
};

type NotificationDemoFormProps = {
  email: string;
};

const inputClassName =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm " +
  "outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export function NotificationDemoForm({ email }: NotificationDemoFormProps) {
  const [state, formAction, isPending] = useActionState(
    sendDemoNotification,
    initialState,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block text-sm font-medium text-zinc-800">
        Program
        <input
          className={inputClassName}
          defaultValue="Me Tang Demo"
          name="program"
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
        Message
        <textarea
          className={inputClassName}
          defaultValue="ทดสอบส่งการแจ้งเตือนจาก Next.js 16"
          name="message"
          required
          rows={3}
        />
      </label>

      <label className="block text-sm font-medium text-zinc-800">
        Web link
        <input
          className={inputClassName}
          defaultValue="https://www.cmu.ac.th"
          name="weblink"
          required
          type="url"
        />
      </label>

      <label className="block text-sm font-medium text-zinc-800">
        Color
        <input
          className="mt-1 h-10 w-full rounded-lg border border-zinc-300 bg-white p-1"
          defaultValue="#1CD2A3"
          name="color"
          required
          type="color"
        />
      </label>

      <button
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "กำลังส่ง..." : "ส่ง LINE notification"}
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
