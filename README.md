# eTailor Platform (Next.js)

Multi-tenant tailoring management platform for designers and shops:

- Customer profiles with measurement history, style preferences and order history
- Job and production workflow tracking with due-date reminder records
- Invoices and payment records
- Employee sub-accounts with granular role permissions
- Platform-level super admin support
- Search, audit trail, and data export APIs

## Tech stack

- Next.js 16 (App Router)
- Prisma ORM + PostgreSQL
- JWT session auth (`jose`) + `bcryptjs`
- Zod for request validation

## Setup

1. Copy `.env.example` to `.env` and configure:
   - `DATABASE_URL`
   - `JWT_SECRET`
2. Generate Prisma client:
   - `npm run db:generate`
3. Run initial migration:
   - `npm run db:migrate -- --name init`
4. Seed default permissions + demo roles:
   - `npm run db:seed`
5. Start app:
   - `npm run dev`

## API modules included

- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- Users / subaccounts:
  - `GET /api/users`
  - `POST /api/users`
- Core operations:
  - `GET, POST /api/customers`
  - `GET, POST /api/jobs`
  - `GET /api/dashboard`
  - `GET /api/search?q=...`
  - `GET /api/export`

## Notes for production

- Add rate limiting and brute-force protection on auth routes.
- Add background worker (cron/queue) to dispatch due-date reminders.
- Add integration adapters (ERP/accounting, SMS, WhatsApp, email).
- Encrypt sensitive fields and configure backup retention policies.
