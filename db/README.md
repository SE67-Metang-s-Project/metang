# Database

Supabase Postgres with Prisma. **`db/schema.prisma` is the source of truth.**

```bash
npm run db:generate  # regenerate Prisma Client
npm run db:status    # confirm Prisma can reach Supabase
npm run db:migrate   # create and apply a development migration
npm run db:deploy    # apply committed migrations
npm run db:deploy:env # same, without Infisical: uses the environment you already have
npm run db:pull      # introspect the database into the schema
npm run db:studio    # browse data
npm run db:seed      # load development fixtures
npm run db:reset     # delete app data and reseed
```

Set `DATABASE_URL` to the Supabase Session pooler for the application. Set `DIRECT_URL`
to the direct database URL for Prisma migrations; use the Session pooler when direct IPv6
is unavailable.

Set `INFISICAL_ENV=dev` in local `.env` (the team's development environment). `db:status`, `db:migrate`,
`db:deploy`, `db:push`, `db:pull`, `db:studio`, `db:seed` and `db:reset` run through
`scripts/with-infisical.mjs`. It stops until this file and value exist, then runs the command
under `infisical run --env <INFISICAL_ENV>` to load `DATABASE_URL` and `DIRECT_URL` from that
Infisical environment. Production runs do not use Infisical (maintenance guide, Section 3.4). If the Infisical CLI is not installed, it runs the command with
the values in `.env`. There is no default environment. `db:generate` and `db:deploy:env` do not
use the wrapper.

Supabase CLI migrations and seeds are disabled in `supabase/config.toml`; Prisma owns both.

Prisma cannot represent PostgreSQL check constraints or create views from its schema.
Keep those rules in reviewed SQL migrations.

## Files

| file | role |
|---|---|
| `schema.prisma` | schema and relations source of truth |
| `migrations/` | reviewed database migrations |
| `../lib/prisma.ts` | pooled server-only Prisma client |
| `queries/` | reusable server-side queries |
| `seed.ts` | idempotent development fixtures through Prisma Client |
| `schema.dbml` | ER diagram source for dbdiagram.io; kept by hand to match `schema.prisma` (current to migration `20261002130000_audit_log_actor_snapshot`) |
| `design/database_schema.pdf` | PDF of the database schema, version 1.0 (2026-07-23); older than the migrations, so make a new PDF from `schema.dbml` at dbdiagram.io |
| `clear.ts` | truncates all application tables; has no npm script and refuses to run unless `INFISICAL_ENV=dev` |
| `simple-workflow.ts` | upserts one test advisor and a closed history loan for a test student; has no npm script and refuses to run unless `INFISICAL_ENV=dev` |
