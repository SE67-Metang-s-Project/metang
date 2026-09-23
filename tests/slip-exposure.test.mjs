import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");

const spec = JSON.parse(read("public/openapi.json"));
const query = read("db/queries/loan-requests.ts");

/** Every property name in the document, paired with the schema path it sits under. */
function properties(node, path = "", found = []) {
  if (Array.isArray(node)) {
    for (const [index, item] of node.entries()) properties(item, `${path}/${index}`, found);
  } else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (key === "properties" && value && typeof value === "object") {
        for (const name of Object.keys(value)) found.push({ name, path });
      }
      properties(value, `${path}/${key}`, found);
    }
  }
  return found;
}

const props = properties(spec);
const named = (name) => props.filter((entry) => entry.name === name).map((entry) => entry.path);

test("the staff-wide loan contract exposes no slip storage location or reference", () => {
  // NAT-208: the path is private; the slip is reached through GET /api/payments/{id}/slip.
  for (const path of named("slipPath")) {
    assert.doesNotMatch(path, /LoanRequestList/, `slipPath must not appear under ${path}`);
  }
  assert.deepEqual(named("slipRef"), [], "slipRef must not appear anywhere in the contract");
});

test("staff can still tell that a slip exists", () => {
  const flags = named("hasSlip");
  assert.ok(flags.length > 0, "hasSlip must be published");
  for (const schema of [
    "LoanRequestListPayment",
    "LoanRequestListItem",
    "LoanRequestListResponse",
  ]) {
    assert.ok(
      flags.some((path) => path.includes(schema)),
      `${schema} must carry hasSlip`,
    );
  }
});

test("the disbursement ledger was not stripped along with it", () => {
  // FundTransaction slip exposure is a separate surface (super_admin only) and outside NAT-208.
  // Asserted so a future blanket removal cannot quietly take it out.
  assert.ok(
    named("slipPath").some((path) => path.includes("FundTransactionItem")),
    "FundTransactionItem.slipPath is out of scope and must remain",
  );
});

test("both slip routes are published", () => {
  assert.ok(spec.paths["/payments/{id}/slip"]?.get, "repayment slip route must be in the contract");
  assert.ok(spec.paths["/fund-transactions/{id}/slip"]?.get, "disbursement slip route must remain");
});

test("payment selects keep the path server-side and hand out a flag instead", () => {
  const globalSelect = query.slice(
    query.indexOf("const globalLoanSelect"),
    query.indexOf("satisfies Prisma.LoanRequestSelect", query.indexOf("const globalLoanSelect")),
  );
  assert.doesNotMatch(globalSelect, /slipRef/, "slipRef is never needed by any caller");
  assert.match(globalSelect, /slipPath: true/, "kept only to derive the flag");

  // The mapping is what actually removes it, so it has to exist on the way out.
  assert.match(query, /function withSlipFlag<[^>]+>\(\{ slipPath, \.\.\.payment \}: T\)/);
  assert.match(query, /hasSlip: slipPath !== null/);
  assert.match(query, /payments: loan\.payments\.map\(withSlipFlag\)/);
});

test("the response type published to staff has no path or reference", () => {
  const listTypes = read("lib/loan-request-list.ts");
  const payment = listTypes.slice(
    listTypes.indexOf("export type LoanRequestListPayment"),
    listTypes.indexOf("export type LoanRequestListItem"),
  );
  assert.doesNotMatch(payment, /slipPath/);
  assert.doesNotMatch(payment, /slipRef/);
  assert.match(payment, /hasSlip: boolean;/);
});

test("server-rendered page props link to the slip route, not the bucket path", () => {
  // These props are serialized to the browser. A bare storage path in an <img src> renders
  // nothing, so pointing at the path was both a leak and a broken image.
  assert.match(query, /slipImageUrl: p\.slipPath \? `\/api\/payments\/\$\{p\.id\}\/slip` : ""/);
  assert.doesNotMatch(query, /slipImageUrl: p\.slipPath \?\? ""/);
});
