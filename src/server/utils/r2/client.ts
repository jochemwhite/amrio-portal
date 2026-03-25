import "server-only";

import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

export function getCloudflareAccountId(): string {
  return env.CF_ACCOUNT_ID;
}

export function getR2AccessKeyId(): string {
  return env.R2_ACCESS_KEY_ID;
}

export function getR2SecretAccessKey(): string {
  return env.R2_SECRET_ACCESS_KEY;
}

export function getR2Bucket(): string {
  return env.R2_BUCKET;
}

export function getR2CdnUrl(): string {
  return env.NEXT_PUBLIC_R2_CDN_URL.replace(/\/+$/, "");
}

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${getCloudflareAccountId()}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: getR2AccessKeyId(),
    secretAccessKey: getR2SecretAccessKey(),
  },
});
