import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const bankFields = ["bankName", "bankAccountNo", "bankAccountName"];

function responseRef(document, path, method, status = "200") {
  return document.paths?.[path]?.[method]?.responses?.[status]?.content?.["application/json"]?.schema?.$ref;
}

test("Executive routes use role-safe pending queue and bank-free selection", () => {
  const auth = read("lib/loan-auth.ts");
  assert.match(auth, /getDevelopmentLoanContext\("executive"\)/);
  const query = read("db/queries/loan-requests.ts");
  const selection = query.slice(query.indexOf("export const executiveLoanSelect"), query.indexOf("const globalLoanSelect"));
  for (const field of bankFields) assert.doesNotMatch(selection, new RegExp(`\\b${field}\\b`));
  for (const file of [
    "app/api/executive/loan-requests/route.ts",
    "app/api/executive/loan-requests/[id]/route.ts",
  ]) {
    assert.match(read(file), /getExecutiveAccess/);
    assert.match(read(file), /pending_executive/);
    assert.match(read(file), /executiveLoanSelect/);
  }
  assert.equal(existsSync(resolve(root, "app/api/executive/route.ts")), false);
});

test("Executive decision is atomic, final-only, and has no out-of-scope effects", () => {
  const query = read("db/queries/loan-requests.ts");
  const service = query.slice(query.indexOf("export type ExecutiveDecisionErrorCode"));
  assert.match(service, /prisma\.\$transaction\(async \(tx\) => \{/);
  assert.match(service, /where: \{ id, status: "pending_executive" \}/);
  assert.match(service, /updateMany/);
  assert.match(service, /pending_disbursement/);
  assert.match(service, /tx\.loanApproval\.update/);
  assert.match(service, /tx\.auditLog\.create/);
  assert.doesNotMatch(service, /returned|notification|outbox|transfer|fundTransaction|installment|payment/);
  const route = read("app/api/executive/loan-requests/[id]/decision/route.ts");
  assert.match(route, /parseExecutiveDecisionInput/);
  assert.match(route, /STALE_DECISION/);
  assert.match(route, /P2002.*P2034/s);
});

test("OpenAPI publishes the NAT-85 Executive contract", () => {
  const document = JSON.parse(read("public/openapi.json"));
  for (const [path, method, schema] of [
    ["/executive/loan-requests", "get", "ExecutiveQueueResponse"],
    ["/executive/loan-requests/{id}", "get", "ExecutiveLoanRequestDetailResponse"],
    ["/executive/loan-requests/{id}/decision", "post", "ExecutiveLoanRequestDetailResponse"],
  ]) assert.equal(responseRef(document, path, method), `#/components/schemas/${schema}`);
  const decision = document.components.schemas.ExecutiveDecisionBody;
  assert.ok(decision);
  assert.doesNotMatch(JSON.stringify(decision), /returned/);
  for (const name of ["ExecutiveQueueItem", "ExecutiveLoanRequestDetail"]) {
    const schema = document.components.schemas[name];
    assert.ok(schema, `missing ${name}`);
    for (const field of bankFields) assert.equal(schema.properties?.[field], undefined);
  }
});
