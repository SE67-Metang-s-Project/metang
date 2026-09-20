# Bruno API collection — local CLI only

HTTP-level tests for `app/api/**`, generated from `public/openapi.json`. No GUI, no account, no
cloud. Reference for Bruno itself: `docs/BRUNO-API-TESTING.md`.

## Run

```bash
npm run api:test
```

One command. `scripts/api-test-isolated.mjs` does the rest:

1. starts a throwaway `postgres:17` container (`metang-test`, port 5433) and waits for it
2. `prisma migrate deploy` + `db/seed.ts` against it
3. starts the app on **port 8081** — deliberately not the dev server's 8080
4. runs the collection, then the ordered `Workflow/` walk
5. removes the container on success; **leaves it running on failure** so you can inspect it

**Requires Docker.** Nothing else — no `.env`, no secrets. The harness never reads one and never
touches the team database; it refuses outright if the connection host is not localhost.

**Stop `npm run dev` first.** Next refuses a second dev server for the same directory: the one
this harness starts on 8081 prints its banner and then exits, and every request fails with
`ECONNREFUSED`. The harness detects that and says so, but it cannot start until port 8080 is
released.

### After a red run

```bash
docker exec metang-test psql -U postgres -c "select id, status from loan_request order by id"
docker rm -f metang-test
```

The tail of the app's own output is printed above the failure summary.

### Running requests by hand

```bash
cd bruno
npx bru run "Advisor_loans/List loan requests awaiting the current advisor's decision.yml" --env isolated
npx bru run Student_loans --env isolated -r
npx bru run -r --env isolated --reporter-html reports/run.html
```

`environments/local.yml` points at 8080 for poking at your normal dev server. Note that mutating
requests then write to the **real dev database** — the isolation only exists under `api:test`.

## Coverage

| | |
|---|---|
| Route handlers in `app/api/**` | 40 |
| Operations in `public/openapi.json` | 33 |
| Requests in this collection | 33 + 13 workflow steps |
| **Executed by `npm run api:test`** | **31 requests, 85 assertions, 1 test** |

### What runs

**Reads** — every staff list and detail endpoint, plus every redirect (`/auth/login` 307,
`/auth/nurse/login` 307, `POST /auth/logout` 303, `/fund-transactions/:id/slip` 302, `/openapi`
302), asserted but never followed.

**Invariants checked on the wire, not in source text:**

- envelope shape — `data` present and `error` absent on success, `error.code` on failure
- **role-scoped field visibility** — `bankAccountNo` / `bankName` / `bankAccountName` absent for
  advisor and executive, present for admin (the role that disburses)
- seeded fund balance is exactly `95750`, and money is integer baht
- detail requests use an id chained out of the matching list response, skipping themselves when
  the list is empty

**`Workflow/`** — an ordered walk over a freshly seeded database:

| | |
|---|---|
| 01 | cancel the seeded draft — the dev-bypass student is pinned to `…0101`, who owns one |
| 02-03 | submit a loan → 201; submit again → 409 `one_open_loan_per_student` |
| 04-05 | advisor returns it → resubmit re-enters at the returning step, `attempt + 1` |
| 06-09 | advisor → admin (reduced amount + mandatory comment) → executive → `pending_disbursement` |
| 07 | `approvedAmount` above the requested amount → 422 |
| 10-12 | replayed decision → 409 · unknown id → 404 · non-JSON content type → 403 |
| 13 | **two simultaneous admin decisions → exactly one 200 and one 409** |

Step 13 is the only check in the repo that reaches the `updateMany` CAS guard and `Serializable`
isolation in `decideAdminLoanRequest` at runtime; `tests/` covers those with source-text
assertions only.

### What does not run, and why

| | |
|---|---|
| `POST /admin/loan-requests/:id/disburse` | uploads to Supabase Storage — needs `SUPABASE_URL` and a bucket the container does not provide |
| `POST /notifications/fon`, `POST /notifications/outlook` | send a real LINE message and a real email |
| `GET /auth/callback` | needs a live OAuth code from CMU Entra |

Excluded by tag: `--exclude-tags Fund_slips,Notifications`. The requests stay in the collection,
documented and runnable by hand.

**Seven handlers are missing from `public/openapi.json`** and therefore from this collection:
`GET /auth/logout` (the route exports both verbs, only POST is documented) and the three
`/cron/*` routes × GET+POST. Fixing that is a spec change, not a Bruno change.

## Adding a check

Append to any request file, above `settings:`:

```yaml
runtime:
  assertions:
    - expression: res.status
      operator: eq
      value: "200"
    - expression: res.body.data
      operator: isDefined
```

Only requests carrying assertions or tests execute (`--tests-only`), so adding them is how you
opt an endpoint into the automated run — do it deliberately for anything that writes.

Two traps worth knowing:

- `eq` coerces, so a numeric-looking string fails: `"0812345678"` compares as `812345678`. Use
  `matches` with an anchored pattern.
- `--parallel` means *CSV iterations* in parallel, not requests. Concurrency needs
  `bru.sendRequest` inside a `tests` script, as in `Workflow/13`.

For anything past a single comparison, use Chai:

```yaml
runtime:
  scripts:
    - type: tests
      code: |-
        test("bank details are not exposed to advisors", function() {
          const [first] = res.body.data;
          if (first) expect(first.bankAccountNo).to.be.undefined;
        });
```

## Re-importing after a spec change

```bash
npm run openapi:generate
npx bru import openapi --source public/openapi.json --output bruno \
  --collection-name "Me_Tang API" --collection-format opencollection --group-by tags
```

**This overwrites the directory** — every assertion, script, the `Workflow/` folder and both
environment files are lost. Import into a scratch directory and diff instead.

## Fixture coupling

The suite reads `db/seed.ts` fixtures directly and asserts on their exact values: loan ids
`REQ20260906000{1..11}` one per status, the dev-bypass student `…0101` holding the draft,
advisor `อาจารย์ที่ปรึกษา ทดสอบ` (matched by exact `fullNameTh`), and the `95750` starting balance.
Changing those fixtures breaks this suite — that is intended, but it means seed edits and
collection edits travel together.
