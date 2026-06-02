import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, canAccessShop } from "@/lib/rbac";
import type { PermissionKey } from "@/lib/permissions";
import type { User } from "@/generated/prisma/client";

type UserWithRoles = User & {
  userRoles: Array<{
    role: { permissions: Array<{ permission: { key: string } }> };
  }>;
};

export type AuthedRequest = {
  request: Request;
  user: UserWithRoles;
};

type HandlerOptions = {
  /** Permission required to access this route. Omit to require auth only. */
  permission?: PermissionKey;
  /** If true, requires user.shopId to be present. Default: true. */
  requireShop?: boolean;
};

type AuthedHandler = (ctx: AuthedRequest) => Promise<NextResponse | Response>;

/**
 * Higher-order wrapper that handles auth, shop context, and permission checks
 * for every route in a single place.
 *
 * Usage:
 *   export const GET = withAuth({ permission: "customers.read" }, async ({ request, user }) => {
 *     ...
 *   });
 */
export function withAuth(
  options: HandlerOptions,
  handler: AuthedHandler
): (request: Request) => Promise<NextResponse | Response> {
  const { permission, requireShop = true } = options;

  return async (request: Request) => {
    try {
      const user = await getCurrentUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }

      if (requireShop && !user.shopId) {
        return NextResponse.json(
          { error: "Shop context required." },
          { status: 400 }
        );
      }

      if (
        requireShop &&
        user.shopId &&
        !canAccessShop(user, user.shopId)
      ) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }

      if (permission && !hasPermission(user, permission)) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }

      return await handler({ request, user });
    } catch (error) {
      // Zod validation errors bubble up from the handler
      if (error instanceof z.ZodError) {
        const flat = error.flatten();
        const msg = flat.formErrors?.[0] ?? Object.values(flat.fieldErrors ?? {}).flat()[0] ?? "Invalid input.";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      // Named domain errors (e.g. "NOT_FOUND")
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status }
        );
      }
      // Prisma-specific errors mapped to meaningful HTTP responses
      const prismaResponse = classifyPrismaError(error);
      if (prismaResponse) return prismaResponse;

      console.error("[API Error]", request.method, request.url, error);
      return NextResponse.json(
        { error: "An unexpected error occurred." },
        { status: 500 }
      );
    }
  };
}

/**
 * Typed domain error for clean control flow inside handlers.
 *
 * Usage:
 *   throw new ApiError("Invoice not found.", 404);
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Prisma error classifier ───────────────────────────────────────────────────

type PrismaError = { code: string; meta?: { target?: string[] } };

function isPrismaError(e: unknown): e is PrismaError {
  return typeof e === "object" && e !== null && "code" in e;
}

/**
 * Maps well-known Prisma error codes to HTTP-meaningful responses.
 * Returns null for unknown errors (falls through to generic 500).
 */
export function classifyPrismaError(e: unknown): NextResponse | null {
  if (!isPrismaError(e)) return null;

  switch (e.code) {
    case "P2002": {
      const fields = e.meta?.target?.join(", ") ?? "field";
      return NextResponse.json(
        { error: `A record with this ${fields} already exists.` },
        { status: 409 }
      );
    }
    case "P2025":
      return NextResponse.json({ error: "Record not found." }, { status: 404 });
    case "P2003":
      return NextResponse.json(
        { error: "Related record not found." },
        { status: 400 }
      );
    case "P1001":
    case "P1002":
      return NextResponse.json(
        { error: "Database connection error. Please try again." },
        { status: 503 }
      );
    default:
      return null;
  }
}
