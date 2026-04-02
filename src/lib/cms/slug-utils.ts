const ENTRY_SLUG_PATTERN = /^\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/;
const COLLECTION_PREFIX_PATTERN = /^\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/;

export function slugifyValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^-+|-+$/g, "");
}

export function normalizeEntrySlug(value: string): string {
  const cleaned = slugifyValue(value)
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")
    .split("/")
    .map((segment) => segment.replace(/-+/g, "-").replace(/^-+|-+$/g, ""))
    .filter(Boolean)
    .join("/");

  return cleaned ? `/${cleaned}` : "";
}

export function isValidEntrySlug(value: string): boolean {
  return ENTRY_SLUG_PATTERN.test(value);
}

export function getEntrySlugInputValue(value: string | null | undefined): string {
  return (value ?? "").replace(/^\/+/, "");
}

export function normalizeCollectionSlugPrefix(value: string): string {
  const cleaned = slugifyValue(value)
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")
    .replace(/\/$/, "");

  return cleaned ? `/${cleaned}` : "";
}

export function isValidCollectionSlugPrefix(value: string): boolean {
  return COLLECTION_PREFIX_PATTERN.test(value);
}

export function normalizeUrlPath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "/";
  }

  const withoutProtocol = trimmed.replace(/^https?:\/\/[^/]+/i, "");
  const withLeadingSlash = withoutProtocol.startsWith("/") ? withoutProtocol : `/${withoutProtocol}`;
  const normalized = withLeadingSlash.replace(/\/+/g, "/").replace(/\/$/, "");

  return normalized || "/";
}

export function joinUrlPaths(...parts: Array<string | null | undefined>): string {
  const filtered = parts
    .filter((part): part is string => Boolean(part && part.trim()))
    .map((part, index) => {
      const trimmed = part.trim();
      if (index === 0) {
        return trimmed.replace(/\/+$/, "") || "/";
      }

      return trimmed.replace(/^\/+/, "").replace(/\/+$/, "");
    })
    .filter(Boolean);

  if (filtered.length === 0) {
    return "/";
  }

  const [first, ...rest] = filtered;
  if (first === "/") {
    return `/${rest.join("/")}`.replace(/\/+/g, "/");
  }

  return [first, ...rest].join("/").replace(/\/+/g, "/");
}
