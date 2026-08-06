# Database

Supabase Postgres with Prisma. **`db/schema.prisma` is the source of truth.**

```bash
npm run db:generate  # regenerate Prisma Client
npm run db:status    # confirm Prisma can reach Supabase
npm run db:migrate   # create and apply a development migration
npm run db:deploy    # apply committed migrations
npm run db:studio    # browse data
npm run db:seed      # load development fixtures
npm run db:reset     # delete app data and reseed
```

Set `DATABASE_URL` to the Supabase Session pooler for the application. Set `DIRECT_URL`
to the direct database URL for Prisma migrations; use the Session pooler when direct IPv6
is unavailable.

Set `INFISICAL_ENV=dev` or `INFISICAL_ENV=prod` in local `.env`. Every `db:*` command
stops until this file and value exist, then loads `DATABASE_URL` and `DIRECT_URL` from the
matching Infisical environment. There is no default environment.

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
| `schema.dbml` | ER diagram source for dbdiagram.io |
