# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 16 App Router project written in TypeScript.

- `app/` contains routes, layouts, and global styles. Add route UI in `app/<route>/page.tsx`.
- `db/schema.prisma` is the database schema and relation source of truth.
- `lib/prisma.ts` creates the server-only Supabase/Postgres Prisma client. Reusable reads and writes belong in `db/queries/`.
- `db/migrations/` contains generated Prisma migrations. Review generated SQL before applying it.
- `db/seed.ts` provides mock development data.
- `public/` stores static assets served from the site root.
- `docs/documentation/developer-guide.md` explains setup, tests, CI, database changes, and which documents to update after a change.

Use the `@/` alias for root-relative imports, for example `@/lib/prisma`.

## Build, Test, and Development Commands

- `npm install` installs dependencies from `package-lock.json`.
- `npm run dev` starts the local Turbopack development server on port 8080. It needs `INFISICAL_ENV` in `.env`; `npm run dev-normal` skips that check.
- `npm run build` creates a production build and catches integration errors.
- `npm run lint` runs ESLint with Next.js Core Web Vitals and TypeScript rules.
- `npx tsc --noEmit` performs strict TypeScript checking.
- `npm test` runs the unit tests (`tests/*.test.ts` and `tests/*.test.mjs`, with `node:test` through `tsx`).
- `npm run api:test` runs the database tests and the Bruno collection against a throwaway Postgres container (Docker required; see `bruno/README.md`).
- `npm run ci:local` runs the CI checks in order (lint, `tsc`, build, `npm test`, `npm run api:test`), then deletes the build output in `.next` and the `metang-test` container. Docker is required. Stop any `npm run dev` or `npm run start` server first; it refuses to run while port 8080 or 3000 is in use or a dev server holds `.next/dev/lock`. Add `-- --install` to run `npm ci` first.
- `npm run db:generate` regenerates Prisma Client after schema changes.
- `npm run db:migrate` creates and applies a development migration.
- `npm run db:deploy` applies pending migrations through Infisical. `npm run db:deploy:env` does the same with the environment you already have, without Infisical.
- `npm run db:push` applies `db/schema.prisma` directly without migration history.
- `npm run db:seed` loads mock development data.
- `npm run db:studio` opens Prisma Studio.

## Coding Style & Naming Conventions

Use two-space indentation, double quotes, semicolons, trailing commas, and a 100-character line width, matching `.prettierrc`. Name React components in PascalCase, functions and variables in camelCase, and route directories in lowercase. Keep database query functions explicit and reusable, such as `getAllLoanRequest`. Server Components are the default; add `"use client"` only when browser interactivity requires it.

## Testing Guidelines

Unit tests use the built-in `node:test` runner (`npm test`); there is no coverage requirement. Before submitting changes, run `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `npm test`. The pre-push hook runs lint and `tsc`; CI runs all of them plus `npm run api:test`. Test schema changes against your own Supabase development database or the throwaway container of `npm run api:test` before deployment.

## Commit & Pull Request Guidelines

Recent history uses concise Conventional Commit subjects such as `feat(db): database design (v1.0)`. Prefer `type(scope): summary`, for example `fix(db): enforce advisor assignment`. Pull requests should explain the change, link the relevant issue, list validation commands, and include screenshots for visible UI changes. Call out schema changes and migration requirements explicitly.

### Commit Messages

Do not commit unless the user asks. Write each message as a subject, a body, and a footer:

- **Subject:** `type(scope): summary` in lowercase imperative, with no final period and about 72 characters or fewer. Add `!` after the scope for a breaking change, for example `feat(api)!: ...`. Put the Jira key in parentheses at the end when one applies, for example `(NAT-236)`.
- **Body:** after a blank line, say what changed and why. Wrap lines at about 76 characters. Use a bullet list when the commit has several parts.
- **Schema and migration notes:** if the commit changes `db/schema.prisma` or adds a migration, name the migration and say if it is one-way or needs a backup first. If it changes neither, say "No schema change and no migration."
- **Validation:** list the checks you ran (`npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm test`) and say which you did not run.
- **Footer:** end an AI-assisted commit with its `Co-Authored-By:` line.

## Security & Configuration

Set `INFISICAL_ENV=dev` in local `.env` and keep the team's development secrets in the Infisical `dev` environment. Production secrets are plain environment variables on the host and never go through Infisical. Never import `lib/prisma.ts` into a Client Component. Use `DATABASE_URL` for the application pool and `DIRECT_URL` for Prisma migrations. Confirm both target your own Supabase project before pushing, seeding, or checking the database.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
