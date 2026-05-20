/**
 * POST /api/upload
 * Accepts multipart/form-data with:
 *   file     — the image file
 *   folder   — ImageKit folder path (validated server-side)
 *   fileName — desired filename (without extension)
 *
 * Returns { url, filePath, fileId } on success.
 *
 * All upload operations are auth-gated — the calling code chooses
 * the folder path based on the resource being uploaded.
 */
import { NextResponse } from "next/server";
import { withAuth, ApiError } from "@/lib/api-handler";
import { uploadToImageKit } from "@/lib/imagekit";

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Allowed folder prefixes — prevents arbitrary path injection
const ALLOWED_FOLDER_PREFIXES = [
  "/etailor/",
];

export const POST = withAuth({}, async ({ request, user }) => {
  const formData = await request.formData();
  const file     = formData.get("file") as File | null;
  const folder   = formData.get("folder") as string | null;
  const fileName = formData.get("fileName") as string | null;

  if (!file)     throw new ApiError("No file provided.", 400);
  if (!folder)   throw new ApiError("folder is required.", 400);
  if (!fileName) throw new ApiError("fileName is required.", 400);

  // Validate folder path — must start with /etailor/{shopId}/
  const expectedPrefix = `/etailor/${user.shopId}/`;
  if (!folder.startsWith(expectedPrefix)) {
    throw new ApiError("Invalid upload folder.", 403);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ApiError(`File type not allowed. Use: ${ALLOWED_TYPES.join(", ")}.`, 400);
  }

  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_FILE_SIZE_MB) {
    throw new ApiError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`, 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

// Replace the uploadToImageKit call with better error surfacing:
try {
  const result = await uploadToImageKit(
    buffer,
    fileName,
    folder,
    [`shop:${user.shopId}`]
  );

  return NextResponse.json({
    url:      result.url,
    filePath: result.filePath,
    fileId:   result.fileId,
    width:    result.width,
    height:   result.height,
  }, { status: 201 });

} catch (err) {
  console.error("[UPLOAD_ERROR]", err);
  const message = err instanceof Error ? err.message : "Upload failed.";
  throw new ApiError(`ImageKit error: ${message}`, 400);
}
});