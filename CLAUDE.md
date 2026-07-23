# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Me_Tang** — a CMU (Chiang Mai University) student emergency loan system. Students apply for
a short-term loan, it passes a four-step approval chain, an admin transfers the money, the
student repays in 1–3 installments with bank-slip evidence.

Requirements live in Jira project **NAT** (`patchamekchang.atlassian.net`, cloudId
`e7523e14-a5d2-4608-b637-5a0374248204`). Code comments reference NAT-xx issue keys; follow
them when changing behaviour. Real-world scale is tiny — ~20 loan requests per term — so
performance is never the constraint. Correctness around money is.

Stack: Next.js 16 App Router · React 19 · Drizzle ORM · Neon Postgres · Tailwind 4 · Vercel.

## Commands

```bash
npm run dev                 # Next dev server
npm run build
npm run lint                # eslint
npx tsc --noEmit            # typecheck — run this, `lint` does not do it

npm run db:push             # apply drizzle/schema.ts to $DATABASE_URL
npm run db:studio           # browse tables
npm run db:seed             # dev fixtures — YOUR OWN Neon branch only
npm run db:check            # constraint assertions; wrapped in a transaction that rolls back
node db/run-sql.mjs <file>  # run any .sql with $DATABASE_URL loaded from .env
```

There is no test framework and no single-test runner. `db/003_check.sql` is the entire test
suite — `do $$ … $$` blocks that each print `ok: <rule>` or raise. It requires `002_seed_dev.sql`
to have run (it references those fixed UUIDs), and later blocks depend on the `loan_request` row
inserted partway through the file, so blocks cannot simply be deleted in isolation.

**Verify schema work against a throwaway container, never against Neon:**

```bash
docker run -d --name tmp -e POSTGRES_PASSWORD=x -p 55432:5432 postgres:18-alpine
# point .env at it, db:push, db:seed, db:check, then:
docker rm -f tmp
```

## Two database directories, different jobs

| | |
|---|---|
| `drizzle/schema.ts` | **source of truth.** Edit here, then `npm run db:push` |
| `drizzle/relations.ts` | FK graph; powers `db.query.*` nested reads |
| `drizzle/meta/` | snapshot drizzle-kit diffs against |
| `db/001_init.sql` | **superseded.** The original SQL that built the schema; `schema.ts` was generated from it by `drizzle-kit pull`. Editing it does nothing |
| `db/002_seed_dev.sql`, `db/003_check.sql` | Drizzle replaces neither. Seed and assertions stay raw SQL |
| `db/schema.dbml` | ER diagram for dbdiagram.io (NAT-8 deliverable). Hand-maintained — nothing regenerates it |

Changing the schema means editing `drizzle/schema.ts` **and** `db/schema.dbml`, plus
`002`/`003` if a column or rule they reference moved.

`drizzle.config.ts` calls `process.loadEnvFile(".env")` itself (drizzle-kit is not Next.js and
will not read `.env`) and strips `-pooler` from the host — DDL must reach Neon's direct
endpoint, not PgBouncer. The app keeps the pooled host.

## Business rules are enforced in Postgres, not app code

This is deliberate: a bug in a route handler must not be able to corrupt money. When adding a
rule, add it to `drizzle/schema.ts` and assert it in `db/003_check.sql`.

- `one_executive_only` — partial unique index on `user_role(role) where role='executive'`.
  Exactly one executive exists system-wide (NAT-52), though a person may hold several roles.
- `one_open_loan_per_student` — partial unique index on `loan_request(student_id)
  where status not in ('closed','rejected','cancelled')`. Cannot borrow again until settled.
- `approved_amount <= amount` — an admin may cut a request, never raise it (NAT-46).
- `payment.slip_ref` unique — the same bank slip cannot be banked twice.
- `installment_count between 1 and 3`.

## Money model

**`numeric` arrives in JavaScript as a `string`** (`"3000.00"`). Never `parseFloat` for
arithmetic — do the maths in SQL, use `Intl.NumberFormat` only for display.

**`fund_transaction` is an append-only ledger.** Balance is
`sum(amount * direction)` — never a stored column, never an UPDATE or DELETE. Corrections are
new rows with `kind = 'adjustment'`. There is no per-student credit limit: the borrowing
ceiling *is* the pool balance (NAT-24: "กำหนดวงเงินตามที่ระบบทั้งหมดมี").

**`payment` vs `fund_transaction`** — `payment` is a *claim* ("student says they paid, here is
the slip"); it can be rejected and carries OCR fields. `fund_transaction` is *truth*. A payment
becomes a ledger row only once an admin confirms it. Note there is currently no FK linking the
two, so a confirmed payment and its ledger row are matched only by `(loan_id, amount, date)`.

## Domain shapes worth knowing before editing

- **Approval chain** (NAT-19): `pending_advisor` → `pending_admin` → `pending_executive` →
  `pending_disbursement` (back to admin to move the money) → `disbursed` → `closed`.
  One `loan_approval` row per step, so decision history survives.
- **`returned` ≠ `rejected`.** `returned` means fix and resubmit; `rejected` is a final no.
  Both `loan_status` and the `decision` enum carry the distinction.
- **`advisor_name` is `text` on both `app_user` and `loan_request`, with no FK** — a deliberate
  choice. The advisor is identified purely by name string, matched against
  `app_user.full_name_th`. There is no referential integrity to catch a typo.
- **`student_conduct` is a view**, derived from overdue installments (NAT-34). Never stored.
  Students with no loan simply do not appear; absence means clean.
- Identity is CMU SSO. `app_user` deliberately stores only the SSO join key plus what CMU does
  not own — faculty, department, and credit limit were all removed on purpose. Roles are
  app-owned (`user_role`), never taken from SSO.

## Next.js boundaries

Server Components by default; `"use client"` only on leaves that need interactivity. `lib/db.ts`
must never reach a client bundle — it holds the `pg` pool and `DATABASE_URL`. Pages that read
the database need `export const dynamic = "force-dynamic"`, otherwise Next prerenders the query
result at build time.

Authorization belongs in the `where` clause, not the UI. NAT-37 (an advisor sees only their own
advisees) means the query filters; hiding rows in the component is not sufficient.

## Conventions

See `CONTRIBUTING.md` for the target directory shape (route groups per role) and PR workflow,
and `db/README.md` for schema-change procedure. `main` is shared; branch as `NAT-xx-slug`.

`npm run db:push` intentionally omits `--force`. That prompt is the only thing standing between
a careless `schema.ts` edit and dropped columns of real loan data — do not add the flag.
