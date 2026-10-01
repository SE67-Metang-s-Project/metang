import { withBasePath } from "@/lib/base-path";
import {
  createTick,
  dailyAtBangkokHour,
  everyMinutes,
  startSchedule,
  type ScheduledJob,
  type ShouldRun,
} from "./schedule";

type CronHandler = (request: Request) => Promise<Response>;

/**
 * The backend runs the notification jobs itself. Each job calls the same route handler an outside
 * scheduler would, with the same CRON_SECRET check, so the job logic has one home. Two triggers:
 * `startJobScheduler` ticks on a timer on a long-lived Node.js server (`next start` or `next dev`),
 * and `runDueJobs` ticks once per call on a host that freezes idle instances (`JOB_RUNNER=request`),
 * where timers would stop. Both keep the last run of each job in memory, so a job is not run
 * twice at once in one process; the jobs are safe across instances (see instrumentation.ts).
 *
 * `path` is the app-root route (the `app/api/cron/*` module each job imports). The scheduler
 * calls the handler directly, so the base path is added only to the request URL it builds.
 */
const JOBS: { path: string; shouldRun: ShouldRun; load: () => Promise<{ GET: CronHandler }> }[] = [
  {
    path: "/api/cron/deliver-fon",
    shouldRun: everyMinutes(1),
    load: () => import("@/app/api/cron/deliver-fon/route"),
  },
  {
    path: "/api/cron/deliver-reminders",
    shouldRun: everyMinutes(3),
    load: () => import("@/app/api/cron/deliver-reminders/route"),
  },
  {
    path: "/api/cron/deliver-payment-outcomes",
    shouldRun: everyMinutes(3),
    load: () => import("@/app/api/cron/deliver-payment-outcomes/route"),
  },
  {
    path: "/api/cron/deliver-loan-outcomes",
    shouldRun: everyMinutes(3),
    load: () => import("@/app/api/cron/deliver-loan-outcomes/route"),
  },
  {
    // 08:00 Bangkok, the time the reminders were sent before; enqueueing is idempotent per day.
    path: "/api/cron/installment-reminders",
    shouldRun: dailyAtBangkokHour(8),
    load: () => import("@/app/api/cron/installment-reminders/route"),
  },
];

const STARTED = Symbol.for("methang.jobScheduler.started");
const TICK = Symbol.for("methang.jobScheduler.tick");

function toScheduledJobs(secret: string): ScheduledJob[] {
  return JOBS.map((job) => ({
    name: job.path,
    shouldRun: job.shouldRun,
    run: async () => {
      const { GET } = await job.load();
      const response = await GET(
        new Request(new URL(withBasePath(job.path), "http://localhost"), {
          headers: { Authorization: `Bearer ${secret}` },
        }),
      );
      const body = await response.text();
      if (!response.ok) {
        console.error(`Scheduled job ${job.path} returned ${response.status}: ${body}`);
      } else if (!body.includes('"processed":0') && !body.includes('"enqueued":0')) {
        console.info(`Scheduled job ${job.path}: ${body}`);
      }
    },
  }));
}

export function startJobScheduler() {
  const globalState = globalThis as { [STARTED]?: boolean };
  if (globalState[STARTED]) return;

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("Job scheduler not started: CRON_SECRET is not set");
    return;
  }
  globalState[STARTED] = true;

  startSchedule(toScheduledJobs(secret));
  console.info(`Job scheduler started: ${JOBS.map((job) => job.path).join(", ")}`);
}

/**
 * Runs the jobs that are due now and resolves when they finish. For a serverless host: pass it to
 * `after()` so the invocation stays alive until the jobs are done. The first call in a new
 * instance runs every job once; a warm instance runs a job again only when its interval passed.
 */
export function runDueJobs() {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("Due jobs not run: CRON_SECRET is not set");
    return Promise.resolve();
  }

  const globalState = globalThis as { [TICK]?: () => Promise<void> };
  globalState[TICK] ??= createTick(toScheduledJobs(secret));
  return globalState[TICK]();
}
