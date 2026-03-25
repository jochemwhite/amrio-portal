import { env } from "@/lib/env";

export function getPublicUrl(storagePath: string): string {
  const baseUrl = env.NEXT_PUBLIC_R2_CDN_URL.replace(/\/+$/, "");
  return `https://${baseUrl}/${storagePath.replace(/^\/+/, "")}`;
}
