// Decides who triggers the notification jobs on this host. Pure, so it is unit-testable.

export type JobRunner =
  /** Vercel calls the /api/cron routes on the schedule in vercel.json. */
  | { kind: "vercel-cron" }
  /** This long-running server process runs the jobs on its own timers. */
  | { kind: "in-process" }
  /** Nothing in this process runs the jobs; an outside scheduler must call the routes. */
  | { kind: "none"; reason: string };

type Env = Record<string, string | undefined>;

/**
 * `ENABLE_JOB_SCHEDULER` overrides detection: `true` forces the in-process scheduler, `false`
 * turns it off. Without it, Vercel uses Vercel Cron, other serverless hosts need an outside
 * scheduler (their instances freeze between requests, so timers would not fire), and any other
 * host is treated as a long-running server.
 */
export function detectJobRunner(env: Env): JobRunner {
  if (env.ENABLE_JOB_SCHEDULER === "true") return { kind: "in-process" };
  if (env.ENABLE_JOB_SCHEDULER === "false") {
    return { kind: "none", reason: "ENABLE_JOB_SCHEDULER is false" };
  }
  if (env.VERCEL === "1") return { kind: "vercel-cron" };
  if (env.AWS_LAMBDA_FUNCTION_NAME || env.NETLIFY === "true") {
    return { kind: "none", reason: "serverless host without a built-in scheduler" };
  }
  return { kind: "in-process" };
}
