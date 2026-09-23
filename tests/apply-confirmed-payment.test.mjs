import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");

const query = read("db/queries/payments.ts");
const service = query.slice(query.indexOf("export async function applyConfirmedPayment"));
const migration = read("db/migrations/20260922140000_repayment_ledger_link/migration.sql");

test("runs inside the caller's transaction and never reaches the prisma singleton", () => {
  // The confirm CAS (NAT-33) has to commit together with this write, so the transaction is the
  // caller's. A stray `prisma.` call here would escape it and survive a rollback.
  // TxClient, not Prisma.TransactionClient: lib/prisma exports an EXTENDED client whose tx is not
  // assignable to the base type. Imported as a type, so no prisma singleton at runtime.
  assert.match(service, /tx: TxClient/);
  assert.doesNotMatch(query, /^import \{[^}]*\} from "\.\/notifications"/m);
  assert.doesNotMatch(query, /from "@\/lib\/prisma"/);
  assert.doesNotMatch(query, /prisma\.\$transaction/);

  for (const call of [
    "tx.userRole.findFirst",
    "tx.payment.findFirst",
    "tx.loanRequest.findFirst",
    "tx.installment.findMany",
    "tx.installment.updateMany",
    "tx.fundTransaction.create",
    "tx.loanRequest.updateMany",
    "tx.loanRequest.findUniqueOrThrow",
    "tx.auditLog.create",
  ]) {
    assert.match(service, new RegExp(call.replaceAll(".", "\\.")));
  }
  assert.doesNotMatch(
    service,
    /[^x]\bprisma\.(payment|loanRequest|installment|fundTransaction|auditLog|userRole)\./,
  );
});

test("the credit amount and the loan both come from the payment row, not from parameters", () => {
  // NAT-205: the credit must equal the confirmed payment exactly. Taking either as an argument
  // lets caller drift credit the wrong number, or credit it against someone else's loan.
  assert.match(service, /\{ paymentId, actorId \}: \{ paymentId: string; actorId: string \}/);
  assert.match(service, /where: \{ id: paymentId, status: "confirmed" \}/);
  assert.match(service, /amount: payment\.amount/);
  assert.match(service, /loanId: payment\.loanId/);
  assert.match(service, /allocatePayment\(unsettled, payment\.amount\)/);
});

test("the fund is credited one repayment row carrying its payment id", () => {
  assert.match(service, /kind: "repayment"/);
  assert.match(service, /direction: 1/);
  assert.match(service, /paymentId: payment\.id/);
});

test("a second credit for the same payment maps to DUPLICATE_REPAYMENT", () => {
  assert.match(
    service,
    /error instanceof Prisma\.PrismaClientKnownRequestError && error\.code === "P2002"/,
  );
  assert.match(service, /throw new PaymentApplicationError\("DUPLICATE_REPAYMENT"\);/);

  // The P2002 can only fire if the DB index exists, so the two travel together.
  assert.match(
    migration,
    /CREATE UNIQUE INDEX "fund_transaction_one_repayment_per_payment"\s+ON "public"\."fund_transaction"\("payment_id"\)\s+WHERE "kind" = 'repayment';/,
  );

  // Rethrow, never swallow: a failed statement aborts the Postgres transaction and Prisma does
  // not savepoint per statement, so continuing would run the rest of the callback on a dead tx.
  assert.doesNotMatch(service, /return[^;]*DUPLICATE_REPAYMENT/);
});

test("the actor's role is re-checked inside the transaction", () => {
  assert.match(
    service,
    /tx\.userRole\.findFirst\(\{\s*where: \{ userId: actorId, role: \{ in: \["admin", "super_admin"\] \} \}/,
  );
  assert.match(service, /if \(!effectiveRole\) throw new PaymentApplicationError\("ACCESS_REVOKED"\);/);
});

test("installment writes are compare-and-set, guarded on the row still being unsettled", () => {
  assert.match(
    service,
    /tx\.installment\.updateMany\(\{\s*where: \{ id: entry\.id, settledAt: null \}/,
  );
  assert.match(service, /if \(changed\.count !== 1\) throw new PaymentApplicationError\("STALE_DECISION"\);/);

  // Only unsettled rows are candidates, and only for this loan - Installment.id is a global
  // autoincrement, so an unscoped query would spread one payment across other students' loans.
  assert.match(
    service,
    /tx\.installment\.findMany\(\{\s*where: \{ loanId: payment\.loanId, settledAt: null \}/,
  );
  assert.match(service, /orderBy: \{ seq: "asc" \}/);
});

test("the loan closes on a status CAS once nothing is outstanding", () => {
  assert.match(service, /if \(allocation\.closesLoan\)/);
  assert.match(
    service,
    /tx\.loanRequest\.updateMany\(\{\s*where: \{ id: payment\.loanId, status: "disbursed" \}/,
  );
  assert.match(service, /data: \{ status: "closed", closedAt: appliedAt \}/);
  assert.match(service, /if \(closed\.count !== 1\) throw new PaymentApplicationError\("STALE_DECISION"\);/);
});

test("the audit row is the only trace of an overpayment surplus", () => {
  // The fund is credited the full payment while the installments absorb less; nothing else
  // records the difference, so an admin reconciling by hand has only this row to work from.
  // "payment.applied" is the money movement; decidePayment writes the separate "payment.confirmed"
  // / "payment.rejected" row for the review outcome. Two different facts, two rows.
  assert.match(service, /action: "payment\.applied"/);
  assert.match(service, /entityType: "payment"/);
  assert.match(service, /surplus: allocation\.surplus/);
  assert.match(service, /outstandingAfter: allocation\.outstandingAfter/);
});

test("the schema mirrors the hand-written index, predicate included", () => {
  // Dropping `where:` would turn this into a plain unique constraint and forbid a second fund
  // transaction of ANY kind per payment; a renamed index shows up as permanent migrate drift.
  const schema = read("db/schema.prisma");
  assert.match(
    schema,
    /@@unique\(\[paymentId\], map: "fund_transaction_one_repayment_per_payment", where: \{ kind: "repayment" \}\)/,
  );
  assert.match(schema, /paymentId\s+String\?\s+@map\("payment_id"\) @db\.Uuid/);
});

test("seeded repayment rows carry their payment id", () => {
  // Postgres treats NULLs as distinct, so an unlinked seeded repayment is invisible to the
  // one-repayment-per-payment index - re-confirming that payment would credit the fund twice.
  const seed = read("db/seed.ts");
  assert.match(seed, /kind: "repayment" as const,[\s\S]{0,400}?paymentId: id\(number\)/);
});
