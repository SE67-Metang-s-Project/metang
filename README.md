# Me_Tang

CMU student emergency loan system. Next.js 16 + Drizzle + Neon Postgres, deployed on Vercel.

## Getting started

```bash
git clone <repo> && cd methang
npm install
cp .env.example .env          # then fill in DATABASE_URL — see below
npm run dev
```

## Database: get your own branch

**Do not share one database.** Neon branches are copy-on-write and near-instant, so
each person works against their own:

```bash
npx neonctl auth                                   # once, opens a browser
npx neonctl branches create --name dev-<yourname>
npx neonctl connection-string dev-<yourname>       # paste into .env
```

Your branch starts as a copy of `main`. Break it however you like:

```bash
npm run db:seed                      # fake users + 100,000 THB, safe on your own branch
npx neonctl branches reset dev-<yourname> --parent   # start over from main
```

## Schema changes

`db/schema.ts` is the source of truth.

1. Edit `db/schema.ts`
2. `npm run db:push` — applies to **your** branch
3. `npm run db:check` — proves the constraints still bite
4. Open a PR with the `schema.ts` diff
5. After merge, **one person** runs `db:push` against `main`

Also update `db/schema.dbml` — it is the ER diagram deliverable (NAT-8) and nothing
regenerates it.

## Scripts

| | |
|---|---|
| `npm run dev` | Next dev server |
| `npm run db:push` | apply `schema.ts` to `$DATABASE_URL` |
| `npm run db:studio` | browse tables in the browser |
| `npm run db:seed` | dev data — **your own branch only** |
| `npm run db:check` | constraint self-check, rolls back |
| `npm run lint` / `npx tsc --noEmit` | |

## Rules

- `.env` is never committed. Neon credentials go through a password manager, not chat.
- Money is `numeric` and arrives in JS as a **string**. Do the arithmetic in SQL, format in TS.
- `fund_transaction` is an append-only ledger. Balance is `sum(amount * direction)`, never a
  stored column. Corrections are new rows, not edits.

See `db/README.md` for schema detail.
