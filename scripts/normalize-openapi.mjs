import { readFileSync, writeFileSync } from "node:fs";

const file = "public/openapi.json";
const document = JSON.parse(readFileSync(file, "utf8"));
const requiredRequestBodies = {
  LoanInput: [
    "advisorName",
    "amount",
    "studentYear",
    "purpose",
    "bankName",
    "bankAccountNo",
    "bankAccountName",
    "installmentCount",
  ],
  AdvisorDecisionBody: ["decision"],
  PhoneNumberBody: ["phoneNumber"],
  RoleMutationBody: ["action", "role"],
};
// next-openapi-gen only emits application/json request bodies, so a file-upload route generates a
// contract its own handler rejects. Restate those bodies as multipart/form-data here.
const multipartRequestBodies = {
  DisburseLoanRequestBody: { slip: { type: "string", format: "binary" } },
};
const loanInputExample = {
  advisorName: "อาจารย์ทดสอบ",
  amount: 5000,
  studentYear: 2,
  purpose: "ค่าใช้จ่ายฉุกเฉิน",
  additionalNote: "ค่าใช้จ่ายสำหรับอุปกรณ์การเรียน",
  bankName: "ธนาคารกรุงไทย",
  bankAccountNo: "1234567890",
  bankAccountName: "นักศึกษาทดสอบ",
  installmentCount: 1,
};

// next-openapi-gen drops negative numeric literals from a union, so `direction: 1 | -1` in
// lib/loan-api-types.ts generates as `enum: [1]` - which would tell a consumer that every
// disbursement row is invalid. Restore both members here.
const direction = document.components?.schemas?.FundTransactionItem?.properties?.direction;
if (!direction) throw new Error("Missing FundTransactionItem.direction schema");
direction.type = "integer";
direction.enum = [1, -1];

for (const [path, operations] of Object.entries(document.paths ?? {})) {
  for (const operation of Object.values(operations)) {
    if (!operation || typeof operation !== "object") continue;

    const requestSchema = operation.requestBody?.content?.["application/json"]?.schema;
    const schemaName = requestSchema?.$ref?.split("/").pop();
    const required = requiredRequestBodies[schemaName];
    if (required) {
      operation.requestBody.required = true;
      document.components.schemas[schemaName].required = required;
    }
    if (schemaName === "LoanInput") {
      operation.requestBody.content["application/json"].example = loanInputExample;
    }

    const multipart = multipartRequestBodies[schemaName];
    if (multipart) {
      operation.requestBody.required = true;
      operation.requestBody.content = {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: multipart,
            required: Object.keys(multipart),
          },
        },
      };
    }

    const isLoanRequestPath =
      path.endsWith("/loan-requests/{id}") || path.includes("/loan-requests/{id}/");
    const isSuperAdminUserPath = path === "/super-admin/users/{id}/roles";
    if (!isLoanRequestPath && !isSuperAdminUserPath) continue;
    const parameter = operation.parameters?.find(
      (entry) => entry.in === "path" && entry.name === "id",
    );
    if (!parameter) throw new Error(`Missing id parameter for ${path}`);
    parameter.schema = isLoanRequestPath
      ? { ...parameter.schema, type: "string", pattern: "^REQ\\d{8}\\d{4}$" }
      : { ...parameter.schema, type: "string", format: "uuid" };
    parameter.example = isSuperAdminUserPath
      ? "4cf0a318-3344-4c95-a4b7-99d3a721b3bf"
      : "REQ202609060000";
  }
}

writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`);
