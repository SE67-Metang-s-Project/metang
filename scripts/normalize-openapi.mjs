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

    const isLoanRequestPath =
      path.endsWith("/loan-requests/{id}") || path.includes("/loan-requests/{id}/");
    const isSuperAdminUserPath = path === "/super-admin/users/{id}/roles";
    if (!isLoanRequestPath && !isSuperAdminUserPath) continue;
    const parameter = operation.parameters?.find(
      (entry) => entry.in === "path" && entry.name === "id",
    );
    if (!parameter) throw new Error(`Missing id parameter for ${path}`);
    parameter.schema = { ...parameter.schema, type: "string", format: "uuid" };
    parameter.example = isSuperAdminUserPath
      ? "4cf0a318-3344-4c95-a4b7-99d3a721b3bf"
      : "1ea025de-e936-4a86-a0a2-accae663cb8e";
  }
}

writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`);
