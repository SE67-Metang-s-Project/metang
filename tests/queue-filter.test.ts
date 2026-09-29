import assert from "node:assert/strict";
import { test } from "node:test";
import { parseListParams } from "@/lib/list-params";
import {
  QUEUE_FILTERS,
  isQueueFilter,
  pendingStatusFor,
  statusesForFilter,
} from "@/lib/queue-filter";

// EXPERIMENT server-paging (revert: EXPERIMENT-server-paging.local.md)
// These are the filters the queue lists applied in the browser before the server took them over.

test("each role's pending tab is the status it acts on", () => {
  assert.equal(pendingStatusFor("advisor"), "pending_advisor");
  assert.equal(pendingStatusFor("admin"), "pending_admin");
  assert.equal(pendingStatusFor("executive"), "pending_executive");
  for (const role of ["advisor", "admin", "executive"] as const) {
    assert.deepEqual(statusesForFilter(role, "pending"), [pendingStatusFor(role)]);
  }
});

test("approved is every status past the role's own step", () => {
  assert.deepEqual(statusesForFilter("admin", "approved"), [
    "pending_executive",
    "pending_disbursement",
    "disbursed",
    "closed",
  ]);
  assert.deepEqual(statusesForFilter("advisor", "approved"), [
    "pending_admin",
    "pending_executive",
    "pending_disbursement",
    "disbursed",
    "closed",
  ]);
  assert.deepEqual(statusesForFilter("executive", "approved"), [
    "pending_disbursement",
    "disbursed",
    "closed",
  ]);
});

test("all selects every status and any other filter is that status", () => {
  assert.equal(statusesForFilter("admin", "all"), null);
  for (const filter of ["rejected", "cancelled", "returned", "disbursed", "closed", "pending_executive"] as const) {
    assert.deepEqual(statusesForFilter("admin", filter), [filter]);
  }
});

test("only known filters are accepted", () => {
  for (const filter of QUEUE_FILTERS) assert.ok(isQueueFilter(filter), filter);
  for (const bad of ["", "ALL", "pending;drop", "unknown", "pending_admin,closed"]) {
    assert.equal(isQueueFilter(bad), false, bad);
  }
});

test("list params: defaults, caps and rejects", () => {
  const parse = (query: string) => parseListParams(new URLSearchParams(query));
  assert.deepEqual(parse(""), { page: 1, limit: 5, q: "" });
  assert.deepEqual(parse("page=3&limit=20&q=abc"), { page: 3, limit: 20, q: "abc" });
  assert.equal(parse("limit=500")?.limit, 50, "limit is capped, not rejected");
  for (const bad of ["page=0", "page=-1", "page=1.5", "page=abc", "limit=0", "limit=x", `q=${"x".repeat(101)}`]) {
    assert.equal(parse(bad), null, bad);
  }
});
