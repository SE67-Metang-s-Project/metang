// Builds the Markdown that the tests render: one section for each situation that text can be in.
// Each section has a heading that starts with its id (T1, P2, ...); the audit names the section of
// every problem, so a failure says which situation broke.
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const image = (name) => path.join(repoRoot, "docs/documentation/images/developer-guide", name);

const words = (n, seed = "alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu") =>
  Array.from({ length: n }, (_, i) => seed.split(" ")[i % seed.split(" ").length]).join(" ");
const thaiLong =
  "ระบบจะตรวจสอบสถานะของคำร้องและแจ้งเตือนผู้ที่เกี่ยวข้องโดยอัตโนมัติเมื่อมีการเปลี่ยนแปลงสถานะของคำร้องนั้นทุกครั้งและเก็บประวัติการเปลี่ยนแปลงไว้ในระบบเพื่อการตรวจสอบย้อนหลังได้ตลอดเวลา";
const lines = (n) => Array.from({ length: n }, (_, i) => `Line ${i + 1}`).join("<br>");

export function fixtureMarkdown() {
  return `# Fixture for the PDF renderer

Version covered: fixture 1.0
Date: 2026-10-02

ZSENTINTRO. This file holds one section for each situation that text can be in.

## T1 A long middle column

| Step | Description | State |
|---|---|---|
| ZSENTT1A | ${words(110)} | Done |
| ZSENTT1B | ${words(70)} with \`some_inline_code.ts\` and **bold words** inside the long text | To do |
| ZSENTT1C | Short | Review |

## T2 Six columns with long identifiers

| Setting | Default | Valid values | Effect | Redeploy required | Secret |
|---|---|---|---|---|---|
| \`SUPABASE_SERVICE_ROLE_KEY\` | None | Supabase service role key | ${words(40)} | Yes | Yes |
| \`DATABASE_URL\` | None. Startup fails with \`DATABASE_URL is not set\`. | PostgreSQL URL of the connection pooler (session mode), with \`sslmode=require\` | Database connection of the application. | Yes, and a new build | Yes |
| \`CALLBACK_URL\` | None | URL, exactly as registered, for example \`https://<host>/metang/api/auth/callback\` | ${words(60)} | Yes, and register it | No |
| \`post_logout_redirect_uri\` | Not set | \`https://<project-ref>.supabase.co\` | Sets the address. | No (maintainer tools only) | No |

## T3 A cell with a word wider than the page

| Name | Value |
|---|---|
| ZSENTT3A | \`${"A".repeat(220)}\` |
| ZSENTT3B | https://example.com/${"segment/".repeat(30)}end |
| ZSENTT3C | ${"B".repeat(160)} |

## T4 A Thai table

| สถานะ | ความหมาย | ผู้รับผิดชอบ |
|---|---|---|
| ZSENTT4A | ${thaiLong}${thaiLong} | ผู้ดูแลระบบ |
| รออาจารย์ที่ปรึกษา | รอการพิจารณา | อาจารย์ที่ปรึกษา |
| ZSENTT4B | Mixed ไทย and English text, 12,000 บาท, ${thaiLong} | Admin |

## T5 A table inside a list

1. First step, then this table:

   | Key | Meaning |
   |---|---|
   | ZSENTT5A | ${words(50)} |
   | \`some_long_identifier_name\` | Short |

2. Second step.

## T6 Ten narrow columns

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 22 | 333 | 4,444 | 55,555 | Yes | No | ZSENTT6 | 0 | 9 |
| 10,000 | 20,000 | 30,000 | 40,000 | 50,000 | 60,000 | 70,000 | 80,000 | 90,000 | 100,000 |

## T7 Cells with markup

| Kind | Example |
|---|---|
| Bold and italic | **bold**, *italic*, ~~strike~~ ZSENTT7A |
| Code with a pipe | \`a \\| b\` |
| A link | [the link text](https://example.com/a/very/long/address/${"path/".repeat(12)}) |
| A line break | first line<br>second line<br>third line |
| An empty cell | |
| Thai and code | ใช้คำสั่ง \`npm run db:migrate\` ก่อน |

## T8 One column, and a header only

| Only |
|---|
| ZSENTT8A one column row |

| Left | Right |
|---|---|

## T9 A row taller than a page

| Key | Value |
|---|---|
| ZSENTT9A | ${lines(80)} |

## P1 Long words in running text

ZSENTP1A ${"x".repeat(130)} and then more words ${words(30)}.

A long address: https://example.com/${"directory/".repeat(25)}file.html ZSENTP1B.

A long identifier in code: \`${"very_long_identifier_".repeat(8)}end\` ZSENTP1C.

### A heading with \`inline_code_in_a_heading\` and ${words(15)}

#### ${"VeryLongHeadingWord".repeat(6)} ZSENTP1D

## P2 Thai text

${thaiLong}${thaiLong}${thaiLong} ZSENTP2A

ผู้ปกครอง ที่ปรึกษา นักศึกษา ฝ่ายการเงิน ผู้บริหาร ผู้ดูแลระบบสูงสุด ตั๊กแตน เกี่ยวกับ ปฏิบัติ กู้ยืม ชั้นปีที่ 1-4 ZSENTP2B

Mixed: ระบบ metang ใช้ \`DATABASE_URL\` และ \`DIRECT_URL\` (ห้ามใช้กับฐานข้อมูลจริง) จำนวน 500,000 บาท ZSENTP2C

Zero width space inside: ระบบ​ตรวจสอบ​คำร้อง ZSENTP2D

## P3 Symbols

Check marks and arrows: ✓ ✗ → ← ≥ ≤ × … – — “quoted” ‘single’ ☐ ☑ ฿ ZSENTP3A

## C1 Code blocks

\`\`\`ts
const longString = "${"word ".repeat(70)}";
const noBreak = "${"Z".repeat(260)}";
export async function demo(): Promise<void> {
  // ไทย comment inside code ZSENTC1A
  await fetch(withBasePath(\`/api/admin/loan-requests/\${id}/disburse\`), { method: "POST" });
}
\`\`\`

\`\`\`bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://<host>/metang/api/cron/${"installment-reminders".repeat(8)} ZSENTC1B
\`\`\`

\`\`\`sql
SELECT id, status FROM loan_request WHERE status = 'pending_admin'; -- ZSENTC1C
\`\`\`

\`\`\`unknownlang
text in a language that highlight.js does not know ZSENTC1D
\`\`\`

\`\`\`
\`\`\`

\`\`\`text
${Array.from({ length: 130 }, (_, i) => `row ${i + 1} of a code block that is longer than one page`).join("\n")}
\`\`\`

- A list item with code:

  \`\`\`js
  console.log("inside a list ZSENTC1E");
  \`\`\`

## L1 Lists

1. one
   1. two
      1. three
         1. four
            1. five
               1. six ZSENTL1A with ${words(30)}

98. ninety-eight
99. ninety-nine
100. one hundred ZSENTL1B
101. one hundred one

- [ ] open task ZSENTL1C
- [x] done task

## Q1 Blockquote

> **WARNING:** A warning with \`${"quoted_code_".repeat(8)}end\` and ${words(30)} ZSENTQ1A
>
> \`\`\`bash
> npm run db:reset
> \`\`\`

## I1 Images

![A wide diagram](${image("loan-status-map.png")})

ZSENTI1A

![A tall diagram](${image("code-map.png")})

| Picture | Note |
|---|---|
| ![in a cell](${image("er-diagram.png")}) | ZSENTI1B |

---

ZSENTEND
`;
}

export const SENTINEL_COUNT_MIN = 30;
