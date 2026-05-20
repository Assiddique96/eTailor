import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { getImageKitAuthParams, getImageKitPublicKey, getImageKitUrlEndpoint } from "@/lib/imagekit";

export const GET = withAuth({ requireShop: false }, async () => {
  const auth = getImageKitAuthParams();
  return NextResponse.json({
    ...auth,
    publicKey:   getImageKitPublicKey(),
    urlEndpoint: getImageKitUrlEndpoint(),
  });
});