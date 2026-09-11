-- Rename slip evidence columns from URL to path: bank-transfer slips now live as object
-- paths in a private Supabase Storage bucket (see lib/slip-storage.ts) and must be signed
-- into a short-lived URL on read, never stored or exposed as a browsable URL.
-- Hand-written instead of Prisma-generated: `prisma migrate dev --create-only` refuses to
-- run non-interactively once it detects a possible destructive change (it can't prompt to
-- confirm a rename vs. a drop+add in a non-TTY shell), so this uses RENAME COLUMN directly
-- to preserve the existing slip data instead of the DROP+ADD Prisma would otherwise need
-- confirmation for.

BEGIN;

ALTER TABLE "public"."payment" RENAME COLUMN "slip_url" TO "slip_path";
ALTER TABLE "public"."fund_transaction" RENAME COLUMN "slip_url" TO "slip_path";

COMMIT;
