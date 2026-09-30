import assert from "node:assert/strict";
import { test } from "node:test";
import { getCmuNames } from "@/lib/cmu-auth";
import { getEducationLevelCode, getEducationLevelName } from "@/lib/student-code";

test("the fifth digit of the student code is the stored degree code; pages show its name", () => {
  assert.equal(getEducationLevelCode("670610143"), "1");
  assert.equal(getEducationLevelCode("671250001"), "5");
  assert.equal(getEducationLevelCode("670620001"), null);
  assert.equal(getEducationLevelCode(null), null);
  assert.equal(getEducationLevelName("1"), "ปริญญาตรี");
  assert.equal(getEducationLevelName("0"), "ประกาศนียบัตรผู้ช่วยพยาบาล");
  assert.equal(getEducationLevelName("ปริญญาตรี"), null);
  assert.equal(getEducationLevelName(null), null);
});

test("names prefer the full-name fields, then first + last, and English may be missing", () => {
  assert.deepEqual(getCmuNames({ full_name_TH: " สมชาย ใจดี ", full_name_EN: "Somchai Jaidee" }), {
    fullNameTh: "สมชาย ใจดี",
    fullNameEn: "Somchai Jaidee",
  });
  assert.deepEqual(getCmuNames({ firstname_TH: "สมชาย", lastname_TH: "ใจดี" }), {
    fullNameTh: "สมชาย ใจดี",
    fullNameEn: null,
  });
});
