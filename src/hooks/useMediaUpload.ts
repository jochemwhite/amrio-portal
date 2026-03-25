"use client";

import { useState } from "react";

import { confirmUpload } from "@/actions/cloudflare/media";

type UploadProgress = "idle" | "uploading" | "confirming" | "done" | "error";

interface UploadUrlResponse {
  uploadUrl: string;
  fileId: string;
  key: string;
}

type ConfirmedUpload = Awaited<ReturnType<typeof confirmUpload>>;

function isUploadUrlResponse(payload: UploadUrlResponse | { error?: string }): payload is UploadUrlResponse {
  return "uploadUrl" in payload && "fileId" in payload && "key" in payload;
}

export function useMediaUpload() {
  const [progress, setProgress] = useState<UploadProgress>("idle");
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(
    file: File,
    tenantId: string,
    websiteId: string,
    folderId?: string
  ): Promise<ConfirmedUpload> {
    setProgress("uploading");
    setError(null);

    try {
      const uploadUrlResponse = await fetch("/api/media/upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId,
          websiteId,
          folderId,
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });

      const uploadUrlPayload = (await uploadUrlResponse.json()) as
        | UploadUrlResponse
        | { error?: string };

      if (!uploadUrlResponse.ok || !isUploadUrlResponse(uploadUrlPayload)) {
        throw new Error(
          "error" in uploadUrlPayload && uploadUrlPayload.error
            ? uploadUrlPayload.error
            : "Failed to create upload URL."
        );
      }

      const storageResponse = await fetch(uploadUrlPayload.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!storageResponse.ok) {
        throw new Error("Failed to upload file to Cloudflare R2.");
      }

      setProgress("confirming");

      const confirmedFile = await confirmUpload(uploadUrlPayload.fileId, file.name);

      setProgress("done");

      return confirmedFile;
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Media upload failed unexpectedly.";

      setError(message);
      setProgress("error");
      throw new Error(message);
    }
  }

  function reset() {
    setProgress("idle");
    setError(null);
  }

  return {
    uploadFile,
    progress,
    error,
    reset,
  };
}
