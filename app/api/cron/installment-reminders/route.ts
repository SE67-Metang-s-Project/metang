import { checkCronAuth } from "@/lib/notifications/cron-auth";
import { apiOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { bangkokDatePlusDays } from "@/lib/date";
import { enqueueNotification } from "@/db/queries/notifications";
import {
  INSTALLMENT_REMINDER_EVENT,
  INSTALLMENT_REMINDER_OFFSETS,
  buildInstallmentReminderDedupeKey,
} from "@/lib/notifications/installment-reminder";
import { serializeJson } from "@/lib/serialization";

async function handle(request: Request) {
  const authError = checkCronAuth(request);
  if (authError) return authError;

  // A due date that is `offset` days from today gets that reminder. Each due date matches one
  // offset, so an installment never gets two reminders in one run.
  const offsetByDueTime = new Map(
    INSTALLMENT_REMINDER_OFFSETS.map((offset) => [bangkokDatePlusDays(offset).getTime(), offset]),
  );

  const installments = await prisma.installment.findMany({
    where: {
      settledAt: null,
      dueDate: { in: [...offsetByDueTime.keys()].map((time) => new Date(time)) },
    },
    select: { id: true, loanId: true, dueDate: true },
  });

  let enqueuedCount = 0;

  if (installments.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const installment of installments) {
        const offset = offsetByDueTime.get(installment.dueDate.getTime());
        if (offset === undefined) continue;

        const isoDate = installment.dueDate.toISOString().slice(0, 10);
        const dedupeKey = buildInstallmentReminderDedupeKey(installment.id, isoDate, offset);

        await enqueueNotification(tx, {
          dedupeKey,
          eventType: INSTALLMENT_REMINDER_EVENT,
          payload: { loanId: installment.loanId, installmentId: String(installment.id) },
        });
        enqueuedCount++;
      }
    });
  }

  return apiOk(serializeJson({ enqueued: enqueuedCount }));
}

export const GET = handle;
export const POST = handle;
