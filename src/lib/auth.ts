import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";
import { PERMISSIONS } from "@/lib/permissions";

const SESSION_COOKIE = "etailor_session";
const encoder = new TextEncoder();
const SESSION_DURATION_DAYS = 7;
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * SESSION_DURATION_DAYS;

type SessionPayload = {
  sub: string;
  jti: string;
  shopId?: string;
  platformRole: "SUPER_ADMIN" | "SHOP_ADMIN" | "EMPLOYEE";
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured.");
  return encoder.encode(secret);
}

function generateJti(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Ensures a SHOP_ADMIN user always has the "shop-admin" system role assigned.
 * This is the fix for the empty customers tab: previously SHOP_ADMIN had a
 * blanket `return true` bypass in hasPermission(). Now access is fully driven
 * by role permissions in the DB. If a SHOP_ADMIN user doesn't have the
 * "shop-admin" role row, this function creates it so they always have full access.
 */
async function ensureShopAdminRole(userId: string, shopId: string) {
  const systemRole = await db.role.upsert({
    where: { shopId_name: { shopId, name: "shop-admin" } },
    update: { description: "Full access — assigned to shop owners." },
    create: {
      shopId,
      name: "shop-admin",
      description: "Full access — assigned to shop owners.",
      isSystem: true,
    },
    select: { id: true },
  });

  for (const permissionKey of PERMISSIONS) {
    const permission = await db.permission.upsert({
      where: { key: permissionKey },
      update: {},
      create: { key: permissionKey, label: permissionKey },
    });

    await db.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: systemRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: systemRole.id,
        permissionId: permission.id,
      },
    });
  }

  const existing = await db.userRole.findFirst({
    where: { userId, roleId: systemRole.id },
  });
  if (!existing) {
    await db.userRole.create({ data: { userId, roleId: systemRole.id } });
  }
}

export async function createSessionToken(
  payload: Omit<SessionPayload, "jti">
): Promise<{ token: string; jti: string }> {
  const jti = generateJti();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  // If this user is a SHOP_ADMIN, guarantee they have the system role so that
  // all permission-guarded routes work correctly without a hard-coded bypass.
  if (payload.platformRole === "SHOP_ADMIN" && payload.shopId) {
    await ensureShopAdminRole(payload.sub, payload.shopId);
  }

  const token = await new SignJWT({ ...payload, jti })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
    .sign(getJwtSecret());

  await db.session.create({
    data: { jti, userId: payload.sub, expiresAt },
  });

  return { token, jti };
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function revokeSession(opts: { jti?: string; userId?: string }) {
  if (opts.userId) {
    await db.session.updateMany({
      where: { userId: opts.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return;
  }
  if (opts.jti) {
    await db.session.updateMany({
      where: { jti: opts.jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

/**
 * Cached per-request user lookup. The `cache()` wrapper ensures that multiple
 * calls within the same request lifecycle share one DB round-trip.
 */
export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const verified = await jwtVerify(token, getJwtSecret());
    const userId = verified.payload.sub;
    const jti = verified.payload.jti as string | undefined;
    if (!userId || !jti) return null;

    const session = await db.session.findUnique({ where: { jti } });
    if (!session || session.revokedAt !== null) return null;

    const user = await db.user.findUnique({
      where: { id: userId, isActive: true },
      include: {
        userRoles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    });

    return user;
  } catch {
    return null;
  }
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
