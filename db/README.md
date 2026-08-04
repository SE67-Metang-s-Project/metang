# Database

Postgres on Neon. **`db/schema.ts` is the source of truth.**

```bash
npm run db:push      # apply schema.ts to the database
npm run db:studio    # browse the data
npm run db:seed      # dev users + 100,000 THB in the fund   (NEVER on the shared branch)
npm run db:reset     # delete all app data, then reseed       (NEVER on the shared branch)
npm run db:check     # constraint self-check, rolls back      (safe anywhere)
```

`$DATABASE_URL` comes from `.env`. Never commit it. `drizzle.config.ts` strips
`-pooler` from the host, because DDL must go to Neon's direct endpoint, not PgBouncer.

## Changing the schema

Edit `db/schema.ts`, then `npm run db:push`. Test on a Neon branch first:

```bash
npx neonctl branches create --name test
# point .env at the branch, push, check, then push to the default branch
```

Switch from `push` to `drizzle-kit generate` + `migrate` once real loan data exists
and migrations need reviewing in a PR. `push` diffs and applies silently — right
pre-launch, wrong after.

## Files

| file | role |
|---|---|
| `client.ts` | pooled runtime database connection |
| `schema.ts` | **source of truth.** Generated once by `drizzle-kit pull`, hand-edited from here on |
| `relations.ts` | FK graph, powers `db.query.*` |
| `queries/` | reusable server-side data queries |
| `migrations/` | baseline snapshot and generated migrations |
| `seed_dev.sql` | dev seed. Drizzle has no seeding — this stays |
| `check.sql` | asserts the money rules actually bite. Drizzle has no equivalent — this stays |
| `schema.dbml` | ER diagram for dbdiagram.io (NAT-8 deliverable). Update when schema.ts changes |
| `run-sql.mjs` | runs a .sql file with `$DATABASE_URL` from `.env` |
