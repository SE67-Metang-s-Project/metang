// Decides who triggers the notification jobs on this host. Pure, so it is unit-testable.

export type JobRunner =
  /** This long-running server process runs the jobs on its own timers. */
  | { kind: "in-process" }
  /**
   * A host that freezes idle instances keeps no timers between requests, so due jobs run after
   * incoming page requests (proxy.ts).
   */
  | { kind: "on-request" }
  /** Nothing in this process runs the jobs; an outside scheduler must call the routes. */
  | { kind: "none"; reason: string };

type Env = Record<string, string | undefined>;

/**
 * `JOB_RUNNER` picks the trigger: `timer` (this process, on timers), `request` (after page
 * requests), or `off` (an outside scheduler calls the /api/cron routes). A value that is none of
 * these runs nothing, so a typo is not mistaken for a working setup. Not set: `timer`, except on
 * AWS Lambda and Netlify, where timers would not fire and nothing runs.
 */
export function detectJobRunner(env: Env): JobRunner {
  const runner = env.JOB_RUNNER?.trim();
  if (runner === "timer") return { kind: "in-process" };
  if (runner === "request") return { kind: "on-request" };
  if (runner === "off") return { kind: "none", reason: "JOB_RUNNER is off" };
  if (runner) {
    return { kind: "none", reason: `JOB_RUNNER=${runner} is not timer, request, or off` };
  }
  if (env.AWS_LAMBDA_FUNCTION_NAME || env.NETLIFY === "true") {
    return { kind: "none", reason: "serverless host without a built-in scheduler" };
  }
  return { kind: "in-process" };
}
