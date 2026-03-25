import {
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Film,
} from "lucide-react";

import type { StorageFile } from "./types";

export function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatDate(dateString: string | null): string {
  if (!dateString) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

export function isImageFile(file: StorageFile): boolean {
  return file.mime_type.startsWith("image/");
}

export function getFileTypeLabel(file: StorageFile): string {
  if (file.mime_type === "application/pdf") {
    return "PDF";
  }

  if (file.mime_type === "video/mp4") {
    return "Video";
  }

  if (file.mime_type.startsWith("image/")) {
    return "Image";
  }

  return file.file_type;
}

export function getFileIcon(file: StorageFile) {
  if (file.mime_type.startsWith("image/")) {
    return FileImage;
  }

  if (file.mime_type.startsWith("video/")) {
    return Film;
  }

  if (file.mime_type === "application/pdf") {
    return FileText;
  }

  if (file.mime_type.includes("sheet") || file.mime_type.includes("csv")) {
    return FileSpreadsheet;
  }

  return File;
}
