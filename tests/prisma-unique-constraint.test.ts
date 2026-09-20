import assert from "node:assert/strict";
import test from "node:test";

import { Prisma } from "@/lib/generated/prisma/client";
import { isUniqueConstraintOnField } from "@/lib/prisma-errors";

const p2002 = (message: string, meta?: Record<string, unknown>) =>
  new Prisma.PrismaClientKnownRequestError(message, {
    code: "P2002",
    clientVersion: "7.9.1",
    meta,
  });

test("matches the field list carried in meta.target", () => {
  assert.equal(isUniqueConstraintOnField(p2002("", { target: ["student_id"] }), "student_id"), true);
  assert.equal(isUniqueConstraintOnField(p2002("", { target: "student_id" }), "student_id"), true);
  assert.equal(isUniqueConstraintOnField(p2002("", { target: ["loan_id"] }), "student_id"), false);
});

// Prisma 7 driver adapters leave meta.target undefined, so the message is the only source left.
// Without this branch every P2002 fell through to a 500 instead of its mapped conflict.
test("falls back to the field list in the message when meta.target is absent", () => {
  const adapterShaped = p2002("\nUnique constraint failed on the fields: (`student_id`)", {
    modelName: "LoanRequest",
  });

  assert.equal(isUniqueConstraintOnField(adapterShaped, "student_id"), true);
  assert.equal(isUniqueConstraintOnField(adapterShaped, "loan_id"), false);
});

test("matches one field out of a composite constraint", () => {
  const composite = p2002("Unique constraint failed on the fields: (`loan_id`,`step`)");

  assert.equal(isUniqueConstraintOnField(composite, "step"), true);
  assert.equal(isUniqueConstraintOnField(composite, "attempt"), false);
});

test("ignores errors that are not P2002", () => {
  const serialization = new Prisma.PrismaClientKnownRequestError(
    "Unique constraint failed on the fields: (`student_id`)",
    { code: "P2034", clientVersion: "7.9.1" },
  );

  assert.equal(isUniqueConstraintOnField(serialization, "student_id"), false);
  assert.equal(isUniqueConstraintOnField(new Error("boom"), "student_id"), false);
});
