import test from "node:test";
import assert from "node:assert/strict";
import { getVisiblePages } from "../components/shared/TablePagination";

test("getVisiblePages returns empty array for 0 or negative pages", () => {
  assert.deepEqual(getVisiblePages(1, 0), []);
  assert.deepEqual(getVisiblePages(1, -5), []);
});

test("getVisiblePages handles 1 to 3 total pages", () => {
  assert.deepEqual(getVisiblePages(1, 1), [1]);
  assert.deepEqual(getVisiblePages(1, 2), [1, 2]);
  assert.deepEqual(getVisiblePages(2, 2), [1, 2]);
  assert.deepEqual(getVisiblePages(1, 3), [1, 2, 3]);
  assert.deepEqual(getVisiblePages(2, 3), [1, 2, 3]);
  assert.deepEqual(getVisiblePages(3, 3), [1, 2, 3]);
});

test("getVisiblePages centers current page in the middle when totalPages > 3", () => {
  // 5 total pages
  // Page 1: cannot center 1, returns [1, 2, 3]
  assert.deepEqual(getVisiblePages(1, 5), [1, 2, 3]);

  // Page 2: 2 is in the middle -> [1, 2, 3]
  assert.deepEqual(getVisiblePages(2, 5), [1, 2, 3]);

  // Page 3: 3 is in the middle -> [2, 3, 4]
  assert.deepEqual(getVisiblePages(3, 5), [2, 3, 4]);

  // Page 4: 4 is in the middle -> [3, 4, 5]
  assert.deepEqual(getVisiblePages(4, 5), [3, 4, 5]);

  // Page 5: 5 is at the end -> [3, 4, 5]
  assert.deepEqual(getVisiblePages(5, 5), [3, 4, 5]);
});

test("getVisiblePages handles larger totalPages (e.g. 10)", () => {
  assert.deepEqual(getVisiblePages(1, 10), [1, 2, 3]);
  assert.deepEqual(getVisiblePages(2, 10), [1, 2, 3]);
  assert.deepEqual(getVisiblePages(6, 10), [5, 6, 7]);
  assert.deepEqual(getVisiblePages(9, 10), [8, 9, 10]);
  assert.deepEqual(getVisiblePages(10, 10), [8, 9, 10]);
});

test("pagination condition: triggers only when rows exceed 5", () => {
  const pageSize = 5;

  // 5 rows or fewer: does not exceed 5
  for (let count = 0; count <= 5; count++) {
    const exceeds5 = count > pageSize;
    assert.equal(exceeds5, false, `Count ${count} should not exceed 5`);
  }

  // 6 rows: exceeds 5, requires pagination
  assert.equal(6 > pageSize, true);
  assert.equal(Math.ceil(6 / pageSize), 2);

  // 12 rows: exceeds 5, requires 3 pages
  assert.equal(12 > pageSize, true);
  assert.equal(Math.ceil(12 / pageSize), 3);
});

test("pagination slicing divides items into chunks of 5", () => {
  const items = Array.from({ length: 12 }, (_, i) => `item-${i + 1}`);
  const pageSize = 5;

  const page1 = items.slice(0, pageSize);
  assert.deepEqual(page1, ["item-1", "item-2", "item-3", "item-4", "item-5"]);

  const page2 = items.slice(5, 10);
  assert.deepEqual(page2, ["item-6", "item-7", "item-8", "item-9", "item-10"]);

  const page3 = items.slice(10, 15);
  assert.deepEqual(page3, ["item-11", "item-12"]);
});

