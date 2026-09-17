import { checkCronAuth } from "@/lib/notifications/cron-auth";
import { apiOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { bangkokDatePlusDays } from "@/lib/date";
import type { Prisma } from "@/lib/generated/prisma/client";
import { enqueueNotification } from "@/db/queries/notifications";
import {
  INSTALLMENT_REMINDER_EVENT,
  buildInstallmentReminderDedupeKey,
} from "@/lib/notifications/installment-reminder";
import { serializeJson } from "@/lib/serialization";

async function handle(request: Request) {
  const authError = checkCronAuth(request);
  if (authError) return authError;

  const date0 = bangkokDatePlusDays(0);
  const date3 = bangkokDatePlusDays(3);
  const time0 = date0.getTime();
  const time3 = date3.getTime();

  const installments = await prisma.installment.findMany({
    where: {
      settledAt: null,
      dueDate: { in: [date0, date3] },
    },
    select: { id: true, loanId: true, dueDate: true },
  });

  let enqueuedCount = 0;

  if (installments.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const installment of installments) {
        const timeDue = installment.dueDate.getTime();
        const offsets = [];
        if (timeDue === time0) offsets.push(0);
        if (timeDue === time3) offsets.push(3);

        const isoDate = installment.dueDate.toISOString().slice(0, 10);

        for (const offset of offsets) {
          const dedupeKey = buildInstallmentReminderDedupeKey(
            installment.id,
            isoDate,
            offset as 0 | 3,
          );

          await enqueueNotification(tx as Prisma.TransactionClient, {
            dedupeKey,
            eventType: INSTALLMENT_REMINDER_EVENT,
            payload: { loanId: installment.loanId, installmentId: String(installment.id) },
          });
          enqueuedCount++;
        }
      }
    });
  }

  return apiOk(serializeJson({ enqueued: enqueuedCount }));
}

export const GET = handle;
export const POST = handle;
