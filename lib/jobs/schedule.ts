// Pure scheduling rules and loop for the in-process job scheduler. No imports of app code, so this
// file stays importable in unit tests without DATABASE_URL or the server-only condition.

export type ShouldRun = (now: Date, lastRun: Date | null) => boolean;

export type ScheduledJob = {
  name: string;
  shouldRun: ShouldRun;
  run: () => Promise<void>;
};

/** Due when `minutes` have passed since the last run, and on the first tick after startup. */
export function everyMinutes(minutes: number): ShouldRun {
  return (now, lastRun) => !lastRun || now.getTime() - lastRun.getTime() >= minutes * 60_000;
}

function bangkokDayAndHour(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return { day: `${value.year}-${value.month}-${value.day}`, hour: Number(value.hour) };
}

/**
 * Due once per Bangkok calendar day, at the first tick at or after `hour` o'clock Bangkok time.
 * A restart later that day runs it again, so only schedule jobs that are idempotent per day.
 */
export function dailyAtBangkokHour(hour: number): ShouldRun {
  return (now, lastRun) => {
    const today = bangkokDayAndHour(now);
    if (today.hour < hour) return false;
    return !lastRun || bangkokDayAndHour(lastRun).day !== today.day;
  };
}

type Logger = Pick<Console, "error">;

/**
 * Returns a tick that checks every job and starts the due ones. A job still running from an earlier
 * tick is skipped, so one job never overlaps itself; different jobs run side by side. The promise
 * the tick returns settles when the jobs it started have finished, so a serverless host can keep
 * the invocation alive until then (`after()`).
 */
export function createTick(
  jobs: ScheduledJob[],
  { now = () => new Date(), logger = console as Logger } = {},
) {
  const state = new Map(jobs.map((job) => [job.name, { lastRun: null as Date | null, running: false }]));

  return async () => {
    const current = now();
    const started: Promise<void>[] = [];
    for (const job of jobs) {
      const jobState = state.get(job.name)!;
      if (jobState.running || !job.shouldRun(current, jobState.lastRun)) continue;

      jobState.running = true;
      jobState.lastRun = current;
      started.push(
        job
          .run()
          .catch((error) => logger.error(`Scheduled job ${job.name} failed`, error))
          .finally(() => {
            jobState.running = false;
          }),
      );
    }
    await Promise.all(started);
  };
}

/**
 * Ticks every `tickMs` on a long-running server. Returns a stop function. The timer is unref'd so
 * it never keeps a process alive on its own.
 */
export function startSchedule(
  jobs: ScheduledJob[],
  { tickMs = 60_000, ...options }: { tickMs?: number } & Parameters<typeof createTick>[1] = {},
) {
  const tick = createTick(jobs, options);

  const timer = setInterval(tick, tickMs);
  timer.unref?.();
  tick();

  return () => clearInterval(timer);
}
