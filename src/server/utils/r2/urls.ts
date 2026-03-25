import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getPublicUrl } from "@/lib/r2/urls";
import { getR2Bucket, r2Client } from "./client";

export { getPublicUrl };

export async function getPrivateUrl(storagePath: string, expiresIn = 60 * 60): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getR2Bucket(),
    Key: storagePath,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}
