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
  ReviewerNotificationBody: ["loanId"],
  LoanReminderBody: ["loanId"],
  // SystemSettingBody has no entry here on purpose - it's a partial patch, every field is
  // genuinely optional (one endpoint serves two independent settings-tab forms).
};
// next-openapi-gen only emits application/json request bodies, so a file-upload route generates a
// contract its own handler rejects. Restate those bodies as multipart/form-data here.
const multipartRequestBodies = {
  DisburseLoanRequestBody: { slip: { type: "string", format: "binary" } },
  StudentPaymentBody: {
    slip: { type: "string", format: "binary" },
    amount: { type: "integer" },
    paidAt: { type: "string", format: "date-time" },
  },
};
// Not every multipart field is mandatory - paidAt defaults to now when omitted.
const multipartOptionalFields = {
  StudentPaymentBody: ["paidAt"],
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
            required: Object.keys(multipart).filter(
              (field) => !(multipartOptionalFields[schemaName] ?? []).includes(field),
            ),
          },
        },
      };
    }

    const isLoanRequestPath =
      path.endsWith("/loan-requests/{id}") || path.includes("/loan-requests/{id}/");
    const isSuperAdminUserPath = path === "/super-admin/users/{id}/roles";
    // Every {id} under a payments path is a Payment id. Worth spelling out: a payment response
    // also carries installmentId and installment.id, and reaching for one of those is the easy
    // mistake - the route answers 404 because the value is not even a uuid.
    const isPaymentPath =
      path === "/payments/{id}/slip" ||
      path === "/admin/payments/{id}" ||
      path.startsWith("/admin/payments/{id}/");
    // A fund transaction id is a bigint, a different id space again from both of the above.
    const isFundTransactionPath = path === "/fund-transactions/{id}/slip";
    if (!isLoanRequestPath && !isSuperAdminUserPath && !isPaymentPath && !isFundTransactionPath) {
      continue;
    }
    const parameter = operation.parameters?.find(
      (entry) => entry.in === "path" && entry.name === "id",
    );
    if (!parameter) throw new Error(`Missing id parameter for ${path}`);

    if (isLoanRequestPath) {
      parameter.schema = { ...parameter.schema, type: "string", pattern: "^REQ\\d{8}\\d{4}$" };
      parameter.example = "REQ202609060000";
      parameter.description = "The loan request id.";
    } else if (isPaymentPath) {
      parameter.schema = { ...parameter.schema, type: "string", format: "uuid" };
      parameter.example = "00000000-0000-0000-0000-000000000304";
      parameter.description =
        "The payment id - the `id` field of a payment, not its `installmentId` or `installment.id`.";
    } else if (isFundTransactionPath) {
      parameter.schema = { ...parameter.schema, type: "string", pattern: "^\\d{1,18}$" };
      parameter.example = "1";
      parameter.description =
        "The fund transaction id - the ledger row's own id, not a loan id or a payment id.";
    } else {
      parameter.schema = { ...parameter.schema, type: "string", format: "uuid" };
      parameter.example = "4cf0a318-3344-4c95-a4b7-99d3a721b3bf";
      parameter.description = "The user id.";
    }
  }
}

writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`);
