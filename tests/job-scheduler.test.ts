import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  dailyAtBangkokHour,
  everyMinutes,
  startSchedule,
  type ScheduledJob,
} from "../lib/jobs/schedule";
import { detectJobRunner } from "../lib/jobs/runtime";

// Pure scheduling logic - no DB, network, or real timers beyond one short test.

const at = (iso: string) => new Date(iso);

test("everyMinutes runs on the first tick, then only after the interval", () => {
  const rule = everyMinutes(3);
  assert.equal(rule(at("2026-09-28T09:00:00Z"), null), true);
  assert.equal(rule(at("2026-09-28T09:02:59Z"), at("2026-09-28T09:00:00Z")), false);
  assert.equal(rule(at("2026-09-28T09:03:00Z"), at("2026-09-28T09:00:00Z")), true);
});

test("dailyAtBangkokHour waits for the hour in Bangkok, then runs once per Bangkok day", () => {
  const rule = dailyAtBangkokHour(8);
  // 00:59 UTC = 07:59 Bangkok: too early.
  assert.equal(rule(at("2026-09-28T00:59:00Z"), null), false);
  // 01:00 UTC = 08:00 Bangkok: due.
  assert.equal(rule(at("2026-09-28T01:00:00Z"), null), true);
  // Later the same Bangkok day: already ran.
  assert.equal(rule(at("2026-09-28T10:00:00Z"), at("2026-09-28T01:00:00Z")), false);
  // 17:30 UTC is 00:30 the next Bangkok day, but before 08:00 there: not yet.
  assert.equal(rule(at("2026-09-28T17:30:00Z"), at("2026-09-28T01:00:00Z")), false);
  // 08:00 Bangkok the next day: due again.
  assert.equal(rule(at("2026-09-29T01:00:00Z"), at("2026-09-28T01:00:00Z")), true);
});

test("a job still running is not started again, and a failure does not stop the schedule", async () => {
  let clock = at("2026-09-28T09:00:00Z");
  let runs = 0;
  let release: () => void = () => {};
  const errors: unknown[] = [];

  const slow: ScheduledJob = {
    name: "slow",
    shouldRun: () => true,
    run: () => {
      runs++;
      return new Promise<void>((resolveRun) => {
        release = resolveRun;
      });
    },
  };
  const failing: ScheduledJob = {
    name: "failing",
    shouldRun: everyMinutes(1),
    run: async () => {
      throw new Error("boom");
    },
  };

  const stop = startSchedule([slow, failing], {
    tickMs: 5,
    now: () => clock,
    logger: { error: (...args: unknown[]) => errors.push(args) },
  });
  await new Promise((resolveWait) => setTimeout(resolveWait, 30));
  assert.equal(runs, 1, "the slow job must not overlap itself");

  release();
  clock = at("2026-09-28T09:01:00Z");
  await new Promise((resolveWait) => setTimeout(resolveWait, 30));
  stop();

  assert.ok(runs >= 2, "the slow job runs again once the previous run finished");
  assert.ok(errors.length >= 2, "the failing job is logged and retried on its interval");
});

test("the backend scheduler covers every notification job", () => {
  const source = readFileSync(resolve(import.meta.dirname, "../lib/jobs/start-scheduler.ts"), "utf8");
  for (const path of [
    "/api/cron/deliver-fon",
    "/api/cron/deliver-reminders",
    "/api/cron/deliver-payment-outcomes",
    "/api/cron/deliver-loan-outcomes",
    "/api/cron/installment-reminders",
  ]) {
    assert.match(source, new RegExp(`path: "${path.replaceAll("/", "\\/")}"`));
  }
  const instrumentation = readFileSync(resolve(import.meta.dirname, "../instrumentation.ts"), "utf8");
  assert.match(instrumentation, /process\.env\.NEXT_RUNTIME === "nodejs"/);
  assert.match(instrumentation, /detectJobRunner\(process\.env\)/);
  assert.match(instrumentation, /runner\.kind === "in-process"[\s\S]*startJobScheduler\(\)/);
});

test("vercel.json schedules the same jobs as the in-process scheduler", () => {
  const source = readFileSync(resolve(import.meta.dirname, "../lib/jobs/start-scheduler.ts"), "utf8");
  const schedulerPaths = [...source.matchAll(/path: "([^"]+)"/g)].map((match) => match[1]).sort();
  const vercel = JSON.parse(readFileSync(resolve(import.meta.dirname, "../vercel.json"), "utf8"));
  const cronPaths = vercel.crons.map((cron: { path: string }) => cron.path).sort();
  assert.deepEqual(cronPaths, schedulerPaths);
});

test("detectJobRunner picks the trigger for the host", () => {
  assert.deepEqual(detectJobRunner({}), { kind: "in-process" });
  assert.deepEqual(detectJobRunner({ VERCEL: "1" }), { kind: "vercel-cron" });
  assert.equal(detectJobRunner({ AWS_LAMBDA_FUNCTION_NAME: "fn" }).kind, "none");
  assert.equal(detectJobRunner({ NETLIFY: "true" }).kind, "none");
  // The override wins over detection in both directions.
  assert.deepEqual(detectJobRunner({ VERCEL: "1", ENABLE_JOB_SCHEDULER: "true" }), {
    kind: "in-process",
  });
  assert.equal(detectJobRunner({ ENABLE_JOB_SCHEDULER: "false" }).kind, "none");
});
