import { Database } from "@/types/supabase";

export type StorageFile = Database["public"]["Tables"]["files"]["Row"];
export type StorageFolder = Database["public"]["Tables"]["folders"]["Row"];
export type StorageViewMode = "grid" | "list";

export interface StorageQuota {
  usedBytes: number;
  quotaBytes: number | null;
}
