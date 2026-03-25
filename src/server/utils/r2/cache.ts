import "server-only";

import { env } from "@/lib/env";

import { getR2CdnUrl } from "./client";

export async function purgeFromCache(storagePath: string): Promise<void> {
  const zoneId = env.CF_ZONE_ID;
  const apiToken = env.CF_API_TOKEN;
  const fileUrl = `${getR2CdnUrl()}/${storagePath.replace(/^\/+/, "")}`;

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          files: [fileUrl],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to purge Cloudflare cache", {
        status: response.status,
        statusText: response.statusText,
        fileUrl,
        errorText,
      });
    }
  } catch (error) {
    console.error("Failed to purge Cloudflare cache", {
      fileUrl,
      error,
    });
  }
}
