import assert from "node:assert/strict";
import { after, test } from "node:test";

// The outbox claim on the real database: a row whose lease expired at the final attempt is marked
// failed instead of being reclaimed forever. Uses its own event type, so no worker touches it.

if (!process.env.DATABASE_URL) throw new Error("outbox-claim-cap needs DATABASE_URL; run it via npm run api:test");

const EVENT = "test_claim_cap";

// Loaded inside the test: tsx compiles this file to CJS, which has no top-level await.
const load = async () => ({
  ...(await import("../../lib/prisma")),
  ...(await import("../../db/queries/notifications")),
});

after(async () => (await import("../../lib/prisma")).prisma.$disconnect());

test("claim fails an exhausted expired lease and claims only live rows", async () => {
  const { prisma, claimDueNotifications } = await load();
  const past = new Date(Date.now() - 60_000);
  const [exhausted, live] = await Promise.all([
    prisma.notificationOutbox.create({
      data: { dedupeKey: `${EVENT}:exhausted`, eventType: EVENT, payload: {}, status: "processing", attemptCount: 5, availableAt: past },
    }),
    prisma.notificationOutbox.create({
      data: { dedupeKey: `${EVENT}:live`, eventType: EVENT, payload: {}, status: "processing", attemptCount: 2, availableAt: past },
    }),
  ]);

  const claimed = await claimDueNotifications(10, EVENT);
  assert.deepEqual(claimed.map((row) => row.id), [live.id]);
  assert.equal(claimed[0].attemptCount, 3);

  const failed = await prisma.notificationOutbox.findUniqueOrThrow({ where: { id: exhausted.id } });
  assert.equal(failed.status, "failed");
  assert.equal(failed.attemptCount, 5);
  assert.match(failed.lastError ?? "", /lease expired/);
});
