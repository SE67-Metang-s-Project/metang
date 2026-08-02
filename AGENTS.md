# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 16 App Router project written in TypeScript.

- `app/` contains routes, layouts, and global styles. Add route UI in `app/<route>/page.tsx`.
- `db/schema.ts` is the Drizzle schema source of truth; `db/relations.ts` defines relational mappings.
- `db/client.ts` creates the server-only Neon/Postgres connection. Reusable reads and writes belong in `db/queries/`.
- `db/migrations/` contains generated SQL migrations and Drizzle metadata. Do not hand-edit `meta/`.
- `db/seed_dev.sql` provides mock data; `db/check.sql` contains database assertions.
- `public/` stores static assets served from the site root.

Use the `@/` alias for root-relative imports, for example `@/db/client`.

## Build, Test, and Development Commands

- `npm install` installs dependencies from `package-lock.json`.
- `npm run dev` starts the local Turbopack development server.
- `npm run build` creates a production build and catches integration errors.
- `npm run lint` runs ESLint with Next.js Core Web Vitals and TypeScript rules.
- `npx tsc --noEmit` performs strict TypeScript checking.
- `npm run db:push` applies `db/schema.ts` directly to the configured database.
- `npm run db:seed` loads mock development data; `npm run db:check` runs SQL constraint checks.
- `npm run db:studio` opens Drizzle Studio.

## Coding Style & Naming Conventions

Use two-space indentation, double quotes, semicolons, trailing commas, and a 100-character line width, matching `.prettierrc`. Name React components in PascalCase, functions and variables in camelCase, and route directories in lowercase. Keep database query functions explicit and reusable, such as `getAllStudents`. Server Components are the default; add `"use client"` only when browser interactivity requires it.

## Testing Guidelines

There is currently no JavaScript test framework or coverage requirement. Before submitting changes, run `npm run lint`, `npx tsc --noEmit`, and `npm run build`. For schema or constraint changes, update `db/check.sql` and run `npm run db:check` against your own Neon testing branch.

## Commit & Pull Request Guidelines

Recent history uses concise Conventional Commit subjects such as `feat(db): database design (v1.0)`. Prefer `type(scope): summary`, for example `fix(db): enforce advisor assignment`. Pull requests should explain the change, link the relevant issue, list validation commands, and include screenshots for visible UI changes. Call out schema changes and migration requirements explicitly.

## Security & Configuration

Copy `.env.example` to `.env` and keep credentials uncommitted. Never import `db/client.ts` into a Client Component. Confirm `DATABASE_URL` targets your personal Neon branch before pushing, seeding, or checking the database.
