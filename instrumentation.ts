export async function register() {
  // Picks who runs the notification jobs on this host (see lib/jobs/runtime.ts). Several server
  // instances are safe - outbox claims use FOR UPDATE SKIP LOCKED and every enqueue is deduplicated.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { detectJobRunner } = await import("./lib/jobs/runtime");
    const runner = detectJobRunner(process.env);

    if (runner.kind === "in-process") {
      const { startJobScheduler } = await import("./lib/jobs/start-scheduler");
      startJobScheduler();
    } else if (runner.kind === "on-request") {
      console.info("Job scheduler: running due jobs after page requests (proxy.ts)");
    } else {
      console.warn(
        `Job scheduler not started (${runner.reason}). ` +
          "Call the /api/cron routes from an outside scheduler.",
      );
    }
  }
}
