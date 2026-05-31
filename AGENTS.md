<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project overview

- eTailor is a B2B tailoring management platform built with **Next.js 16 App Router**, **TypeScript 5**, **Tailwind CSS 4**, **Prisma 7**, and **PostgreSQL**.
- Backend logic lives in `src/lib`, reusable UI lives in `src/components`, and route-based pages are in `src/app`.
- API routes are implemented under `src/app/api/*` using **Next.js route handlers**.
- Database access should use `src/lib/db.ts` and the generated Prisma client at `src/generated/prisma`.

## Key conventions

- Prefer **server components** by default. Add `"use client"` only for interactive UI or browser-only hooks.
- Use `import { db } from "@/lib/db"` instead of creating a new Prisma client instance.
- Keep authorization and session logic centralized in `src/lib/auth.ts`.
- Validate request payloads with **Zod** and keep route handler logic thin.
- Keep CSS in `src/app/globals.css` and use Tailwind utility classes for component styling.
- Use `cache()` for expensive per-request helper functions in server code.

## Important files and directories

- `src/app` — App Router routes, layouts, pages, and API endpoints.
- `src/components` — Shared components, grouped by feature.
- `src/lib` — Business logic, auth, DB helpers, API utilities, and permissions.
- `prisma/schema.prisma` — Database model and enum definitions.
- `src/generated/prisma` — Generated Prisma client.
- `next.config.ts` — security headers and build settings.
- `README.md` — setup, environment variables, and high-level API overview.

## Environment requirements

This project requires:

- `DATABASE_URL`
- `JWT_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `CRON_SECRET`

If any are missing, startup should fail early.

## Recommended commands

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run reminders:run`

## Agent behavior guidance

- Do not rework the repository layout without a strong reason.
- Preserve the existing database schema shapes, enum values, and relationships unless a change is explicitly needed.
- When modifying route handlers, keep server-side data fetching and validation in server files.
- Avoid introducing new runtime dependencies unless they solve a concrete problem.
- Use existing UI patterns and utility class names rather than inventing a separate styling approach.
- For auth/session work, keep changes aligned with `src/lib/auth.ts` and the JWT cookie workflow.
