"use client";

const ACTIVE_WEBSITE_COOKIE_NAME = "active-website";

/**
 * Get the active website ID from cookies on the client side
 * @returns The active website ID or null if not found
 */
export function getActiveWebsiteIdClient(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split("; ");
  const websiteCookie = cookies.find((cookie) =>
    cookie.startsWith(`${ACTIVE_WEBSITE_COOKIE_NAME}=`)
  );

  if (!websiteCookie) {
    return null;
  }

  return websiteCookie.split("=")[1] || null;
}



