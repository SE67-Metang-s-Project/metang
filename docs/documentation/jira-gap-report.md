# Jira vs Repo Gap Analysis — Me_Tang (2026-09-28, commit f7fc3cd)

Repo: /media/d/Personal/Doc/methang (main branch, clean at analysis time). No unmerged branches
or worktrees exist that could change any verdict (`git branch -a` → only `main`; `git worktree
list` → only the main checkout; `.claude/worktrees` → empty).

Excluded per scope: presentation/demo tickets (NAT-75,76,77,78,148-155,194-199,212), NAT-67
(superseded), and all CheckSlip/OCR slip-checking tickets/AC (team+client dropped it; noted
once here and not flagged below even where a ticket's text still mentions CheckSlip, e.g.
NAT-15, NAT-27).

**Cross-cutting caveat found while verifying "test" tickets**: several files under `tests/`
(`role-management-workflow.test.mjs`, `student-e2e-workflow.test.ts`, `executive-e2e-workflow.test.ts`,
`disburse-loan-request.test.mjs`, `workflow.test.mjs`, `notification-recipients-wiring.test.mjs`,
`admin-executive-loop.test.mjs`) do `readFileSync` on route/query source files and `assert.match()`
regex patterns against the raw text, rather than importing and executing the real functions against
real inputs. Others (`email-api-client.test.ts`, `loan-petition-access.test.ts`, etc.) call real
exported functions with mocked I/O. Per the task's own scope this still counts as coverage — a
"stale conflict" or "Serializable" claim that's asserted-present in the actual source is real
evidence the behavior is implemented, just weaker evidence than an executed test. This is noted
once here rather than re-litigated per ticket; it's flagged as a coverage-quality caveat, not used
to downgrade a verdict on its own. A verdict below is only downgraded when a named sub-claim has
**no** test of either kind.

## 1. Gap table (open tickets, full AC check; Done tickets with concrete artifacts, spot-checked)

| Key | Jira status | Claim (short) | Repo evidence | Verdict |
|---|---|---|---|---|
| NAT-206 | To Do | Enqueue student notification in same tx as payment confirm/reject, carry reject reason, resolve recipient server-side | Implemented after this analysis (uncommitted): `db/queries/payment-review.ts` `decidePayment()` enqueues a `payment_outcome` outbox row in the same Serializable transaction; worker `app/api/cron/deliver-payment-outcomes/route.ts` emails the student via the Outlook API; template `lib/email-api/payment-outcome-template.ts`; tests `tests/payment-outcome.test.ts`, `tests/payment-outcome-wiring.test.mjs`. | IMPLEMENTED, Jira not yet updated |
| NAT-169 | Done | Repayment e2e tests cover submission, review, confirm/reject, redistribution, ledger credit, "student confirm/reject notification," overdue conduct, reminders, idempotency, loan closure | Since NAT-206 (the notification itself) is missing, a genuine test of it cannot exist — confirmed 0 "notif" hits across every repayment test file (`repayment-allocation.test.ts`, `repayment-conduct.test.ts`, `apply-confirmed-payment.test.mjs`, `payment-decision.test.mjs`, `payment-decision-validation.test.ts`, `payment-review-errors.test.ts`, `repayment-ledger-link.migration.test.mjs`). Test files exist for the other named sub-claims (submission, confirm/reject transaction, redistribution, ledger credit, conduct, idempotency, loan closure) — not independently re-verified line-by-line here beyond what's cited elsewhere in this report; only the one notification sub-claim is unimplemented/untested. | PARTIAL (one of many named sub-claims has no coverage of either kind, because the underlying feature doesn't exist) |
| NAT-124 | Done | FON integration tests: recipient routing per role, deep links, retries, and **sanitized errors** | Recipient routing: `tests/reviewer-notification.test.ts:17-19` (`REVIEWER_STEP_BY_STATUS.pending_advisor/admin/executive`). Deep links: `buildReviewerRequestPath`/`buildReviewerRequestUrl` tests in the same file. Retries: `tests/fon-delivery.test.ts:144-146` (`classifyStatusFailure` retryable statuses). "Sanitized errors": `grep -n "sanitiz\|leak\|secret\|token" tests/fon-delivery.test.ts tests/reviewer-notification.test.ts` → 0 matches — unlike the Outlook client (NAT-172, which has an explicit "never leaks the client secret" test), no test of either kind (executed or static) asserts FON errors are sanitized. | PARTIAL (3 of 4 named sub-claims covered; "sanitized errors" has no test) |
| NAT-27 | To Do | Student end-to-end repayment: private slip storage; atomic/idempotent confirm; fund ledger credit; overpayments reduce/redistribute; loan closes at zero; conduct derived and non-editable; student notified on confirm/reject | Verified working: private slip storage (`lib/slip-storage.ts`); atomic/idempotent confirm + ledger credit (`db/queries/payments.ts` `applyConfirmedPayment`, unique constraint `fund_transaction_one_repayment_per_payment`); redistribution across unsettled installments oldest→last→ascending without rewriting `amountDue` (`lib/loan-validation.ts:291-330`); loan closes at zero outstanding; conduct is a pure derivation with no stored/editable input (`lib/repayment-conduct.ts`). Fails: student notification (NAT-206, confirmed missing). Noted as fact only, not separately scored: a payment whose amount exceeds total outstanding across all installments is rejected with `OVERPAYMENT_REQUIRES_CONTACT` in `decidePayment` rather than applied — a deliberate policy choice, not evaluated as pass/fail here. | PARTIAL |
| NAT-15 | To Do | Prod deploy on Vercel: CMU prod callback/logout, SESSION_SECRET, Infisical, DB, private storage, FON, Outlook, authenticated reminder schedule; must pass `npm test`/lint/tsc/build; smoke test full flow | `lib/notifications/cron-auth.ts` (read in full) requires `Authorization: Bearer <CRON_SECRET>`, returns 401 otherwise; called from all 3 `app/api/cron/*/route.ts` — this AC is genuinely met. No `.vercel/` directory, no `.vercel*` in git, no deploy/vercel commits (`git log --all --oneline | grep -i "vercel\|deploy"` → 0 hits) — no evidence of an actual deployment or its validation. The "pass npm test" AC is unmeetable as written since no such script exists (NAT-209). | MISSING (no deployment evidence; blocked on NAT-209) |
| NAT-209 | In Progress | Single `npm test` running both suites; TS suite resolves `server-only` without manual flags; 9 named failures fixed; OpenAPI regenerated; lint/tsc clean; stale failing-test note in the repository guide updated | `package.json` (read in full): no `test` script. `AGENTS.md` line 36 (the checked-in repo guide) still reads "There is currently no JavaScript test framework or coverage requirement" — unchanged, and contradicted by the 69-file `tests/` directory. `tests/email-api-client.test.ts:1-3` still instructs `NODE_OPTIONS="--conditions=react-server" npx tsx --test tests/email-api-client.test.ts` — a manual flag. | MISSING (In Progress status accurate) |
| NAT-213 | To Do | Create CD | `.github` does not exist. No CI/CD config anywhere in the repo. | MISSING |
| NAT-214 | To Do | Document of Using and Maintaining | At analysis time only the prompt template existed. A draft is now in `docs/documentation/maintenance-guide.md` (1.0 draft, 2026-09-28) with open `[TO VERIFY]` items. | DRAFT WRITTEN, needs review |
| NAT-200 | Done | Many bank-account rows (bank/code/#/name/type/branch/primary/active/note) with DB-enforced single-primary-active constraint; rich faculty address (Thai/English names, tax id, building/street/sub-district/district/province/postal code, phones, ext, fax, email, website, LINE, opening hours, closed-days note, submission location, contract header) — "no settings fixture remains in use" | `db/schema.prisma:276-291` `model SystemSetting` is a **singleton** (`id Int @id @default(1)`) with only 8 editable fields (`bankName, accountName, accountNumber, contactLocationTh, contactLocationEn, contactPhone, contactExt, contactEmail`) — no multi-row bank-account model, no primary/active flags, none of the rich address fields. `db/queries/system-settings.ts` confirms the same 8 fields, one row (`id: 1`). **Smoking-gun evidence the richer model was designed but never wired to the backend**: `components/shared/mock-data/mockSystemSettings.ts` defines `SystemBankAccount` (bankCode, accountType, branch, `isPrimary`, `isActive`, note, promptPayId…) and `SystemAddressData` (facultyNameTh/En, departmentTh/En, taxId, building, streetAddress, subDistrict, district, province, postalCode, phone, phoneSecondary, internalExt, fax, email, officialWebsite, lineOfficial, openingHours, closedDaysNote) — almost verbatim the AC's field list — and `components/superadmin/setting/SystemContactInfoTab.tsx` (rendered by both `SystemBankTab.tsx` and `SystemAddressTab.tsx`, which are both thin re-exports of it) imports from that mock-data file and contains comments `"// 2. Update mock system address"` / `"// 3. Update mock bank accounts list"` — the SuperAdmin settings UI is still editing an in-memory/mock bank-account list and address record, not the real API, confirming the AC's "no settings fixture remains in use when this task closes" is violated. Also confirmed by commit `b68469c "revert(student): restore contact fixtures"`, which removed a "contact-hours migration and settings fields" and restored fixture-backed behavior; `components/student/loan-details/ContactFooter.tsx:23-24` comment: "opening hours isn't modeled yet, so it still comes from the fixture." SuperAdmin-only-write, audit-record, and narrow-student-read behaviors for the 8 real fields *are* implemented and tested. | JIRA-DONE-BUT-MISSING |
| NAT-202 | Done | SuperAdmin settings API + narrow Student read; "promoting a primary account demotes the previous one in the same transaction" | Read/write endpoints exist (`app/api/super-admin/settings/route.ts`, `app/api/system-settings/route.ts`) and work for the 8 real singleton fields. But since `SystemSetting` is a singleton row (`id: 1`, see NAT-200), there is no second bank account to demote — confirmed no promote/demote logic in `updateSystemSetting` (`db/queries/system-settings.ts`, read in full: single `tx.systemSetting.update({ where: { id: 1 }, ... })`, no `isPrimary`/second-row handling anywhere). | PARTIAL (the part of the AC describing multi-account promotion cannot exist; the singleton read/write itself is real) |
| NAT-203 | Done | Integration: Connect SuperAdmin banking info settings UI to live APIs | The settings UI (`SystemContactInfoTab.tsx`, serving both the "bank" and "address" tabs) is connected to `fetchSystemSetting`/`saveSystemSetting` for the 8 real fields, but the bank-account list and address fields beyond those 8 are still backed by `mockSystemSettings.ts` (see NAT-200), not the live API. | PARTIAL (connected for the fields that exist server-side, mock-backed for the rest) |
| NAT-204 | Done | Tests for SuperAdmin-only writes, "the single primary active account guard," audit records, narrow student read | `grep -n "primary\|isPrimary" tests/system-setting-access.test.ts tests/system-setting.migration.test.mjs` → 0 matches — no test of the "single primary active account guard" exists, because the feature itself doesn't exist (NAT-200). SuperAdmin-only-write, audit-record, and narrow-student-read sub-claims are genuinely tested in those two files. | PARTIAL (1 of 4 named sub-claims — the primary/active guard — has no test of any kind, because the feature is missing) |
| NAT-100 / NAT-105 / NAT-110 / NAT-115 / NAT-118 | Done | "\[Role\] end-to-end integration tests ... through the UI" (NAT-115: "... and UI refresh") | No UI test framework exists: no Playwright/Cypress/Testing-Library in `package.json`; `.planning/codebase/TESTING.md:13` states "Neither is a UI testing framework." The two files literally named "e2e" (`student-e2e-workflow.test.ts`, `executive-e2e-workflow.test.ts`) do not render or drive anything — they `readFileSync` route source and `assert.match` regex like `/getExecutiveAccess/`, `/@auth cookieAuth/` against the raw text (see cross-cutting caveat above). There is no advisor-e2e, admin-e2e, or RBAC-e2e file; the real behaviors are exercised only by narrower workflow/unit tests (`advisor-workflow.test.ts`, `admin-executive-loop.test.mjs`, `role-management-workflow.test.mjs`). The specific "through the UI"/"UI refresh" claim in all five tickets has no supporting evidence. | JIRA-DONE-BUT-MISSING (the literal UI-driven claim; underlying route/logic checks exist as static source assertions, not live tests) |

Not gaps — informational only, no required-vocabulary verdict needed:
- **NAT-215** (parent, In Progress) and its subtasks **NAT-217** (Advisor, In Progress), **NAT-219**
  (SuperAdmin, In Progress), **NAT-220** (Executive, In Progress): all have empty Jira descriptions
  (no AC to check). `git log --oneline -5 -- components/<role> app/<role>` for each shows active
  recent commits (e.g. `76196ac feat(requests): expand status and student views`, `7374d6f
  style(ui): refine shared interface`), consistent with "In Progress."
- **NAT-226** (To Do): Jira summary is literally `----`, description empty — no identifiable scope
  to check. Flagged as a Jira hygiene issue, not a repo gap.

## 2. Verified-OK Done tickets (spot-checked with evidence)

| Key | Evidence |
|---|---|
| NAT-79 (outbox durability) | `db/schema.prisma:227-241` `model NotificationOutbox`; `db/queries/notifications.ts:67-93` claim query uses `FOR UPDATE SKIP LOCKED` on `status IN ('pending','retry','processing')`. |
| NAT-86 (transactional enqueue) | `db/queries/notifications.ts:53-54` `enqueueNotification` upserts on `dedupeKey` inside the caller's transaction. |
| NAT-87 (outbox model + migration) | `db/schema.prisma:227-241` `model NotificationOutbox`; migration `db/migrations/20260817163556_notification_outbox/`. |
| NAT-88 / NAT-90 (retry/claim) | `db/queries/notifications.ts:118-140` exponential backoff + permanent-vs-retry classification; same file's claim query prevents duplicate concurrent processing. |
| NAT-93 (protect final SuperAdmin, incl. concurrency) | `db/queries/users.ts:79` throws `FINAL_SUPER_ADMIN` when `superAdminCount <= 1`, inside a `$transaction` opened at `Prisma.TransactionIsolationLevel.Serializable` (`db/queries/users.ts:134`) — real code, race-safe by isolation level. |
| NAT-94 (role-management API tests) | `tests/role-management-workflow.test.mjs:29-37` asserts (static source-pattern) `Serializable` isolation, `FINAL_SUPER_ADMIN`, `tx.auditLog.create`, and grant/revoke calls all present in `db/queries/users.ts`'s role-mutation function. Counts as coverage per the caveat above; weaker than an executed concurrency test but the underlying code is confirmed race-safe (see NAT-93). |
| NAT-128 (Advisor workflow tests) | Assigned-only access: `tests/loan-petition-access.test.ts:55-61` denies `OTHER_ADVISOR_ID` access to a loan assigned to a different advisor. Conflicts: `tests/workflow.test.mjs:52-59` asserts the advisor-decision CAS update scopes on `{ id, advisorId, status: "pending_advisor" }` and throws `STALE_DECISION` when `changed.count !== 1`. Audit history: `tests/workflow.test.mjs:40` asserts `tx.auditLog.create`. Decisions/validation: `tests/advisor-workflow.test.ts` (`parseAdvisorDecisionInput` comment requirements). All 4 named sub-claims have coverage, spread across three files. |
| NAT-52 (single active Executive) | `db/schema.prisma` `UserRole @@unique([role], map: "one_executive_only", where: { role: "executive" })` — DB-enforced. |
| NAT-49 / NAT-95 (audit logging) | `db/schema.prisma:244-256` `model AuditLog`; written same-transaction in `payment-review.ts`/`payments.ts` and `db/queries/users.ts` role mutations. |
| NAT-133 (RBAC access-control tests, "every predefined role") | `tests/loan-petition-access.test.ts:110,122` includes `super_admin` alongside student/advisor/admin/executive — all named roles present. |
| NAT-137 (Executive workflow tests) | `tests/executive-workflow.test.mjs:40` `assert.match(service, /tx\.auditLog\.create/)`; `:44` `assert.match(route, /STALE_DECISION/)`. |
| NAT-201 (settings schema/migration/queries, empty description — existence check only) | `db/schema.prisma:276-291` `model SystemSetting`; migration `db/migrations/20260922130000_system_setting/`; `db/queries/system-settings.ts`. All three named artifacts exist, in the reduced singleton shape described under NAT-200. |
| NAT-208 (slip exposure restriction) | `lib/slip-access.ts`; `db/queries/loan-requests.ts:195-196` `withSlipFlag` strips `slipPath`; slip served via signed link at `app/api/payments/[id]/slip/route.ts`. |
| NAT-205 (repayment fund ledger) | `db/queries/payments.ts` `applyConfirmedPayment` creates one `fundTransaction` (`kind: "repayment"`) guarded by unique constraint `fund_transaction_one_repayment_per_payment`. |
| NAT-211 (T-1 reminder) | `db/queries/notifications.ts:7` `InstallmentReminderOffsetDays = 0 \| 1 \| 3`; `app/api/cron/installment-reminders/route.ts:39` adds offset 1, same cron/dedupe-key builder reused. |
| NAT-28 (installment reminder scheduling) | Same route computes `date0/date1/date3` via `bangkokDatePlusDays`, filters `settledAt: null`, enqueues idempotently. |
| NAT-156 / NAT-170 / NAT-171 (Outlook delivery, claimed-only) | `app/api/cron/deliver-reminders/route.ts:5,33` calls `claimDueNotifications(20, INSTALLMENT_REMINDER_EVENT)` before delivery — only claimed rows are delivered. `lib/email-api/loan-reminder-template.ts` provides the configured reminder template; `lib/email-api/client.ts` is the configured Outlook API client. |
| NAT-172 (Outlook provider tests) | `tests/email-api-client.test.ts:83` retry-once-on-401, `:118` no-retry-on-permanent-failure, `:154` "a failed token request never leaks the client secret in the thrown error" (sanitization), `:178` concurrent-call token-refresh dedupe; `tests/deliver-reminders-outcome.test.ts` covers `classifyDeliveryFailure` retryable vs permanent. |
| NAT-165 (disbursement tests) | `tests/disburse-loan-request.test.mjs:64` `["P2002","P2034"].includes(error.code)`, `:68` "insufficient balance", `:96` "CAS update and the unique disbursement index guard the same race together". |
| NAT-181 / NAT-225 (Executive chart) | `components/shared/financial/FinancialOverview.tsx:268` contains a real hand-built `<svg>` chart, consumed by `ExecutiveDashboard.tsx`. |
| NAT-60 / NAT-184 (loan report "PDF") | No PDF library in `package.json`; implemented via browser print — `components/shared/disburse-debt/LoanPetitionDocument.tsx:33,57` call `window.print()`. Legitimate lightweight approach, not a gap, but a maintainer expecting a server-generated PDF file should know this is print-dialog based. |
| NAT-183 (slip storage bucket) | `lib/slip-storage.ts:5` `SLIP_BUCKET = process.env.SUPABASE_SLIP_BUCKET ?? "bank_payment_slips"`. Not in `db/migrations` (normal — Storage buckets aren't schema objects). |
| NAT-16, NAT-18, NAT-44, NAT-180, NAT-185, NAT-186, NAT-188 (empty-description Done tickets, existence check only) | NAT-16: `lib/cmu-auth.ts` + `docs/CMU-ENTRA-SSO.md`. NAT-18: `lib/line-notification.ts`, `lib/line-notification-template.ts`. NAT-44: `lib/reviewer-deeplink.ts`. NAT-180: bilingual strings across `LoanPetitionModal.tsx`, `TopNav.tsx`, `LoanFormSelect.tsx`. NAT-185: `app/login/page.tsx`. NAT-186: `lib/student-education.ts`. NAT-188: `public/metang-logo.png` + `public/logo-variations/`. All present at a plausible existence-only level. |

## 3. Mismatches worth noting for maintenance (repo has things Jira doesn't mention)

- `scripts/api-test-isolated.mjs` (`npm run api:test`) runs the Bruno collection in an isolated
  container — a real, working test entry point that partially satisfies the spirit of NAT-209 but
  isn't `npm test` and doesn't cover the `tests/*.test.ts`/`.mjs` unit suites.
- `test-cases/loan-business-logic-test-cases.xlsx` — a QA test-case workbook (with a LibreOffice
  lock file still present) not referenced by any ticket.
- `.planning/codebase/*.md` (generated 2026-09-28) hold much of the source material used for the
  NAT-214 maintenance guide draft in `docs/documentation/maintenance-guide.md`.
- `bruno/` is a full second, per-role API-test suite not called out by any ticket beyond the
  already-Done "Testing: API" (NAT-182).
- The notification outbox was dropped and later restored: migration `db/migrations/
  20260905110000_remove_payment_ocr/` era changes were followed by `db/migrations/
  20260916100000_restore_notification_outbox/` — worth knowing before assuming outbox history is
  linear; no ticket documents the drop/restore cycle.
- Several `tests/*.test.mjs`/`.test.ts` files are static source-regex assertions rather than live
  executed tests (see cross-cutting caveat above) — worth knowing before trusting "N tests pass" as
  proof of runtime behavior.

## Counts (by key)

- MISSING: 3 (NAT-15, NAT-209, NAT-213); NAT-214 draft and NAT-206 implementation done after analysis
- PARTIAL: 6 keys (NAT-27, NAT-169, NAT-124, NAT-202, NAT-203, NAT-204)
- JIRA-DONE-BUT-MISSING: 6 keys (NAT-200, NAT-100, NAT-105, NAT-110, NAT-115, NAT-118 — for the
  five "through the UI" tickets, the literal deliverable named by the ticket — UI-driven end-to-end
  tests — is entirely absent, not one sub-claim among several, so these stay JIRA-DONE-BUT-MISSING
  rather than PARTIAL)
- Not a gap / status matches repo, no verdict needed: 5 (NAT-215, NAT-217, NAT-219, NAT-220,
  NAT-226 — NAT-226 additionally flagged as an empty/unverifiable ticket)
- Verified-OK Done tickets spot-checked: 21 keys — NAT-16, 18, 28, 44, 49, 52, 60, 79, 86, 87, 88,
  90, 93, 94, 95, 128, 133, 137, 156, 165, 170, 171, 172, 180, 181, 183, 184, 185, 186, 188, 201,
  205, 208, 211, 225 (that's 35 keys grouped into 21 evidence rows where several tickets share one
  artifact, e.g. NAT-88/NAT-90 or NAT-156/170/171)
