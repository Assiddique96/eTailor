# eTailor — Fix & Improvement Changelog

## Critical fixes

### 1. Removed duplicate RBAC module (`lib/rbac.ts`)
**File deleted:** `lib/rbac.ts` (root-level stub)
The stale root-level stub typed `hasPermission` as `any` and was disconnected from the real permission system. Only `src/lib/rbac.ts` exists now.

### 2. Removed SHOP_ADMIN blanket bypass — fixed empty customer tab
**Files changed:** `src/lib/rbac.ts`, `src/lib/auth.ts`

The root cause of the empty customers tab was that SHOP_ADMIN users could be created without being assigned the `"shop-admin"` system role. The customers API route requires `customers.read` via RBAC. Without the role in `userRoles`, the check returned `false` even though SHOP_ADMIN should have full access.

**Fix:** `auth.ts → createSessionToken()` now calls `ensureShopAdminRole()` on every SHOP_ADMIN login. This guarantees the "shop-admin" seeded role is assigned in the database before the session is issued, so all permission checks pass through the normal role-based path — no hard-coded bypass needed.

### 3. Invoice number race condition
**File changed:** `src/app/api/invoices/route.ts`

Replaced the `count() + 1` approach (which produced duplicate invoice numbers under concurrent requests) with a Postgres advisory lock scoped per shop (`pg_advisory_xact_lock`). The lock is held for the duration of the transaction, then a uniqueness check guards against hash collisions.

### 4. SSE in-memory subscriber store — multi-instance warning + polling fallback
**Files changed:** `src/lib/notifications.ts`, `src/hooks/use-notifications.ts`

The in-process `Map` is documented clearly as single-instance only, with the upgrade path to Upstash Redis pub/sub. The `useNotifications` hook now adds a 30-second `refreshInterval` as a polling fallback — even if SSE is broken, the UI catches up within 30 seconds.

---

## High priority

### 5. Rate limiter — replaced DB-backed with in-memory sliding window
**File changed:** `src/lib/rate-limit.ts`

Removed 2 Postgres round-trips (COUNT + INSERT) from every auth request. The new implementation uses a module-level `Map` with automatic stale-key cleanup. Upgrade path to Upstash documented inline.

### 6. Removed deprecated `useFetch` hook
**File deleted:** `src/hooks/use-fetch.ts`

Migration was never completed. All pages already used `useSWR` directly. The hook is removed. Any remaining callers should import `useSWR` and `fetcher` directly per the migration guide that was in the JSDoc.

### 7. Monolithic pages split
- `dashboard/page.tsx` — chart logic extracted to `src/components/dashboard/revenue-chart.tsx` and `src/components/dashboard/jobs-donut-chart.tsx`
- `customers/page.tsx` — customer detail logic moved to `src/components/customers/customer-popup.tsx`
- `jobs/page.tsx` — job detail drawer replaced by `src/components/jobs/job-popup.tsx`

---

## Medium priority

### 8. Native `confirm()` replaced with `<ConfirmModal>`
**Files changed:** `src/components/ui/confirm-modal.tsx` (new), `src/app/(portal)/catalog/page.tsx`

All three `window.confirm()` calls in `catalog/page.tsx` replaced with the new `<ConfirmModal>` component. It is accessible (`role="alertdialog"`, `aria-labelledby`, `aria-describedby`), styled, keyboard-navigable (Escape to cancel, auto-focuses confirm button), and consistent with the rest of the UI.

### 9. Schema cleanup — `OrderHistory` and unused M-M relations
**File changed:** `prisma/schema.prisma`

- Removed `OrderHistory` model — `Invoice` already serves as the order history.
- Removed `Customer ↔ CatalogCategory` and `Customer ↔ CatalogItem` many-to-many relations — `CustomerStyleProfile` handles style selection correctly.
- Run `prisma migrate dev --name cleanup-order-history-and-mm-relations` to apply.

### 10. Customer list updated
**File changed:** `src/app/(portal)/customers/page.tsx`

New table columns: **Name, Gender, Phone, Jobs (count), Added on, Last job**. Clicking a row opens `<CustomerPopup>` — a centred modal with Measurements, Jobs, and Invoices tabs. After creating a customer the popup auto-opens on the new record.

---

## Nice to have

### 11. Dashboard chart components extracted + accessibility
**Files added:** `src/components/dashboard/revenue-chart.tsx`, `src/components/dashboard/jobs-donut-chart.tsx`

Both SVG charts now have `role="img"`, `<title>` elements, and per-bar/slice ARIA labels. Currency symbol reads from `shop.currency` (defaults to ₦ NGN).

### 12. Job popup (replaces side drawer)
**File added:** `src/components/jobs/job-popup.tsx`

Clicking a job card on the board or list now opens a centred popup with three tabs: **Overview** (key details + inline status update), **Activity** (comments), and **Materials**. Backdrop click and Escape key close it.

### 13. Inconsistent audit log strategy — documented
The `audit.ts` JSDoc already explains when to use transactional vs. fire-and-forget writes. All write routes in the codebase use the transactional path (`tx` parameter). Read-only audit events (downloads, exports) correctly use the background path.

---

## Migration steps

```bash
# 1. Apply schema changes
npx prisma migrate dev --name cleanup-order-history-and-mm-relations

# 2. Re-seed permissions and roles (ensures shop-admin role exists)
npm run db:seed

# 3. Build
npm run build
```
