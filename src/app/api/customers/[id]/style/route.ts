import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, ApiError } from "@/lib/api-handler";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { deleteFromImageKit } from "@/lib/imagekit";

const schema = z.discriminatedUnion("selectionMode", [
  z.object({
    selectionMode: z.literal("CATALOG"),
    catalogItemId: z.string().min(1),
    notes:         z.string().max(500).optional(),
  }),
  z.object({
    selectionMode:    z.literal("UPLOAD"),
    uploadedImageUrl:  z.string().url(),
    uploadedImagePath: z.string().min(1),
    notes:             z.string().max(500).optional(),
  }),
  z.object({
    selectionMode: z.literal("IMPRESS_ME"),
    notes:         z.string().max(500).optional(),
  }),
]);

// Helper to look up a Job ID based on the Customer's dynamic route ID parameter
async function getLatestJobIdForCustomer(customerId: string, shopId: string): Promise<string> {
  const latestJob = await db.job.findFirst({
    where: { customerId, shopId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  
  if (!latestJob) {
    throw new ApiError("No jobs found for this customer profile to link a style to.", 404);
  }
  
  return latestJob.id;
}

export function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withAuth({ permission: "customers.write" }, async ({ user }) => {
    const { id: customerId } = await ctx.params;

    // Verify customer exists and belongs to the active shop workspace context
    const customer = await db.customer.findFirst({
      where: { id: customerId, shopId: user.shopId! },
      select: { id: true },
    });
    if (!customer) throw new ApiError("Customer not found.", 404);

    // Resolve the real job identifier linked to this context
    const jobId = await getLatestJobIdForCustomer(customerId, user.shopId!);
    const body = schema.parse(await req.json());

    // Safely look up previous image instances to prevent orphans
    const existing = await db.customerStyleProfile.findUnique({ where: { jobId } }).catch(() => null);
    if (existing?.uploadedImagePath && body.selectionMode !== "UPLOAD") {
      deleteFromImageKit(existing.uploadedImagePath).catch(console.warn);
    }

    // Persist modifications via isolated transaction catch wrappers
    const profile = await db.customerStyleProfile.upsert({
      where: { jobId },
      update: {
        selectionMode:     body.selectionMode,
        catalogItemId:     body.selectionMode === "CATALOG"  ? body.catalogItemId  : null,
        uploadedImageUrl:  body.selectionMode === "UPLOAD"   ? body.uploadedImageUrl  : null,
        uploadedImagePath: body.selectionMode === "UPLOAD"   ? body.uploadedImagePath : null,
        notes:             body.notes ?? null,
      },
      create: {
        jobId,
        selectionMode:     body.selectionMode,
        catalogItemId:     body.selectionMode === "CATALOG" ? body.catalogItemId : null,
        uploadedImageUrl:  body.selectionMode === "UPLOAD"  ? body.uploadedImageUrl  : null,
        uploadedImagePath: body.selectionMode === "UPLOAD"  ? body.uploadedImagePath : null,
        notes:             body.notes ?? null,
      },
    }).catch((err) => {
      console.error("Failed to update profile record due to DB schema out-of-sync context:", err.message);
      throw new ApiError("Style Profile table structure mismatch. Run database push updates.", 500);
    });

    await writeAuditLog({ 
      shopId: user.shopId, 
      userId: user.id,
      action: "CUSTOMER_STYLE_UPDATED", 
      entity: "CustomerStyleProfile", 
      entityId: profile.id,
      metadata: { selectionMode: body.selectionMode, jobId } 
    });

    return NextResponse.json({ profile });
  })(req);
}

export function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withAuth({ permission: "customers.read" }, async ({ user }) => {
    const { id: customerId } = await ctx.params;
    
    const customer = await db.customer.findFirst({
      where: { id: customerId, shopId: user.shopId! },
      select: { id: true },
    });
    if (!customer) throw new ApiError("Customer not found.", 404);

    const jobId = await getLatestJobIdForCustomer(customerId, user.shopId!);

    const profile = await db.customerStyleProfile.findUnique({
      where: { jobId },
      include: { catalogItem: { include: { category: true } } },
    }).catch((err) => {
      console.warn("Gracefully blocked a crash on style profile findUnique lookup:", err.message);
      return null;
    });
    
    return NextResponse.json({ profile });
  })(req);
}