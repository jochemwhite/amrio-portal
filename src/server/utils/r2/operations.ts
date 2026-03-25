import "server-only";

import {
  DeleteObjectCommand,
  HeadObjectCommand,
  HeadObjectCommandOutput,
  NoSuchKey,
  PutObjectCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getR2Bucket, r2Client } from "./client";

export async function getUploadUrl(
  key: string,
  mimeType: string,
  fileSizeBytes: number,
  expiresIn = 60 * 5
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getR2Bucket(),
    Key: key,
    ContentType: mimeType,
    ContentLength: fileSizeBytes,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

export async function deleteObject(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
    })
  );
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    const response: HeadObjectCommandOutput = await r2Client.send(
      new HeadObjectCommand({
        Bucket: getR2Bucket(),
        Key: key,
      })
    );

    return Boolean(response.$metadata.httpStatusCode && response.$metadata.httpStatusCode < 400);
  } catch (error) {
    if (error instanceof NoSuchKey) {
      return false;
    }

    if (error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404) {
      return false;
    }

    throw error;
  }
}
