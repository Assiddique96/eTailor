/**
 * ImageKit.io integration.
 *
 * All media uploads in eTailor go through ImageKit:
 *  - Shop logos   → /etailor/{shopId}/logo/
 *  - Catalog items → /etailor/{shopId}/catalog/{categoryId}/
 *  - Style uploads → /etailor/{shopId}/styles/customers/{customerId}/
 *
 * Environment variables required (add to .env.example):
 *   IMAGEKIT_PUBLIC_KEY
 *   IMAGEKIT_PRIVATE_KEY
 *   IMAGEKIT_URL_ENDPOINT   (e.g. https://ik.imagekit.io/youraccountid)
 */
import ImageKit from "imagekit";

function getImageKit() {
  const publicKey  = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new Error(
      "ImageKit is not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT."
    );
  }

  return new ImageKit({ publicKey, privateKey, urlEndpoint });
}

export type UploadResult = {
  fileId: string;
  url: string;
  filePath: string;
  name: string;
  width?: number;
  height?: number;
};

/**
 * Upload a file from a Buffer or base64 string.
 * Returns the CDN url and filePath (needed for deletion).
 */
export async function uploadToImageKit(
  file: Buffer | string,
  fileName: string,
  folder: string,
  tags?: string[]
): Promise<UploadResult> {
  const ik = getImageKit();

  const result = await ik.upload({
    file,
    fileName,
    folder,
    tags,
    useUniqueFileName: true,
    // Deliver optimised WebP automatically
    responseFields: ["fileId", "url", "filePath", "name", "width", "height"],
  });

  return {
    fileId: result.fileId,
    url:    result.url,
    filePath: result.filePath,
    name:   result.name,
    width:  result.width,
    height: result.height,
  };
}

/**
 * Delete a file from ImageKit by its filePath.
 * Silently succeeds if the file doesn't exist.
 */
export async function deleteFromImageKit(fileId: string): Promise<void> {
  try {
    const ik = getImageKit();
    await ik.deleteFile(fileId);
  } catch (err) {
    console.warn("[ImageKit] Delete failed (file may already be gone):", err);
  }
}

/**
 * Returns a signed URL for client-side uploads.
 * The client uses this token to upload directly to ImageKit
 * without exposing the private key.
 */
export function getImageKitAuthParams() {
  const ik = getImageKit();
  return ik.getAuthenticationParameters();
}

export function getImageKitPublicKey() {
  return process.env.IMAGEKIT_PUBLIC_KEY ?? "";
}

export function getImageKitUrlEndpoint() {
  return process.env.IMAGEKIT_URL_ENDPOINT ?? "";
}
