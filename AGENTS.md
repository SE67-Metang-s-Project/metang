# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 16 App Router project written in TypeScript.

- `app/` contains routes, layouts, and global styles. Add route UI in `app/<route>/page.tsx`.
- `db/schema.prisma` is the database schema and relation source of truth.
- `lib/prisma.ts` creates the server-only Supabase/Postgres Prisma client. Reusable reads and writes belong in `db/queries/`.
- `db/migrations/` contains generated Prisma migrations. Review generated SQL before applying it.
- `db/seed.ts` provides mock development data.
- `public/` stores static assets served from the site root.

Use the `@/` alias for root-relative imports, for example `@/lib/prisma`.

## Build, Test, and Development Commands

- `npm install` installs dependencies from `package-lock.json`.
- `npm run dev` starts the local Turbopack development server.
- `npm run build` creates a production build and catches integration errors.
- `npm run lint` runs ESLint with Next.js Core Web Vitals and TypeScript rules.
- `npx tsc --noEmit` performs strict TypeScript checking.
- `npm run db:generate` regenerates Prisma Client after schema changes.
- `npm run db:migrate` creates and applies a development migration.
- `npm run db:deploy` applies pending migrations in production.
- `npm run db:push` applies `db/schema.prisma` directly without migration history.
- `npm run db:seed` loads mock development data.
- `npm run db:studio` opens Prisma Studio.

## Coding Style & Naming Conventions

Use two-space indentation, double quotes, semicolons, trailing commas, and a 100-character line width, matching `.prettierrc`. Name React components in PascalCase, functions and variables in camelCase, and route directories in lowercase. Keep database query functions explicit and reusable, such as `getAllStudents`. Server Components are the default; add `"use client"` only when browser interactivity requires it.

## Testing Guidelines

There is currently no JavaScript test framework or coverage requirement. Before submitting changes, run `npm run lint`, `npx tsc --noEmit`, and `npm run build`. Test schema changes against your own Supabase development database before deployment.

## Commit & Pull Request Guidelines

Recent history uses concise Conventional Commit subjects such as `feat(db): database design (v1.0)`. Prefer `type(scope): summary`, for example `fix(db): enforce advisor assignment`. Pull requests should explain the change, link the relevant issue, list validation commands, and include screenshots for visible UI changes. Call out schema changes and migration requirements explicitly.

## Security & Configuration

Set `INFISICAL_ENV=dev` or `INFISICAL_ENV=prod` in local `.env` and store secrets in the matching Infisical environment. Never import `lib/prisma.ts` into a Client Component. Use `DATABASE_URL` for the application pool and `DIRECT_URL` for Prisma migrations. Confirm both target your own Supabase project before pushing, seeding, or checking the database.
