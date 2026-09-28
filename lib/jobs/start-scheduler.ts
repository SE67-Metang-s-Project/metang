import { dailyAtBangkokHour, everyMinutes, startSchedule, type ShouldRun } from "./schedule";

type CronHandler = (request: Request) => Promise<Response>;

/**
 * The backend runs the notification jobs itself, on a long-lived Node.js server (`next start` or
 * `next dev`). Each job calls the same route handler an outside scheduler would, with the same
 * CRON_SECRET check, so the job logic has one home. Not for serverless hosting: a frozen or
 * recycled instance would stop the timers.
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
    // 08:00 Bangkok, the time the reminders were sent before; enqueueing is idempotent per day.
    path: "/api/cron/installment-reminders",
    shouldRun: dailyAtBangkokHour(8),
    load: () => import("@/app/api/cron/installment-reminders/route"),
  },
];

const STARTED = Symbol.for("methang.jobScheduler.started");

export function startJobScheduler() {
  const globalState = globalThis as { [STARTED]?: boolean };
  if (globalState[STARTED]) return;

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("Job scheduler not started: CRON_SECRET is not set");
    return;
  }
  globalState[STARTED] = true;

  startSchedule(
    JOBS.map((job) => ({
      name: job.path,
      shouldRun: job.shouldRun,
      run: async () => {
        const { GET } = await job.load();
        const response = await GET(
          new Request(new URL(job.path, "http://localhost"), {
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
    })),
  );
  console.info(`Job scheduler started: ${JOBS.map((job) => job.path).join(", ")}`);
}
