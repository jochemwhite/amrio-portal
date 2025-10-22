"use client";

import { useEffect, useState } from "react";
import { useActiveTenant } from "@/hooks/use-active-tenant";
import { Website } from "@/types/cms";
import { getWebsitesByTenant } from "@/actions/cms/website-actions";

const ACTIVE_WEBSITE_COOKIE_NAME = "active-website";
const ACTIVE_WEBSITE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function useActiveWebsite() {
  const { activeTenant } = useActiveTenant();
  const [activeWebsite, setActiveWebsiteState] = useState<Website | null>(null);
  const [availableWebsites, setAvailableWebsites] = useState<Website[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper function to get cookie value
  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  // Helper function to set cookie
  const setCookie = (name: string, value: string, maxAge: number) => {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
  };

  // Helper function to remove cookie
  const removeCookie = (name: string) => {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; path=/; max-age=0`;
  };

  // Fetch websites for the active tenant
  useEffect(() => {
    const fetchWebsites = async () => {
      if (!activeTenant) {
        setAvailableWebsites([]);
        setActiveWebsiteState(null);
        setIsInitialized(true);
        return;
      }

      try {
        const result = await getWebsitesByTenant(activeTenant.id);
        if (result.success && result.data) {
          setAvailableWebsites(result.data);
          
          // Try to get from cookie first
          const savedWebsiteId = getCookie(ACTIVE_WEBSITE_COOKIE_NAME);
          
          if (savedWebsiteId) {
            // Find the saved website in the current tenant's websites
            const savedWebsite = result.data.find(website => website.id === savedWebsiteId);
            if (savedWebsite) {
              setActiveWebsiteState(savedWebsite);
              setIsInitialized(true);
              return;
            }
          }

          // Fallback to first website if no saved website or saved website not found
          const firstWebsite = result.data[0];
          if (firstWebsite) {
            setActiveWebsiteState(firstWebsite);
            setCookie(ACTIVE_WEBSITE_COOKIE_NAME, firstWebsite.id, ACTIVE_WEBSITE_COOKIE_MAX_AGE);
          }
        } else {
          setAvailableWebsites([]);
          setActiveWebsiteState(null);
        }
      } catch (error) {
        console.error("Error fetching websites:", error);
        setAvailableWebsites([]);
        setActiveWebsiteState(null);
      }
      
      setIsInitialized(true);
    };

    fetchWebsites();
  }, [activeTenant]);

  // Function to set the active website
  const setActiveWebsite = (website: Website | null) => {
    setActiveWebsiteState(website);
    if (website) {
      setCookie(ACTIVE_WEBSITE_COOKIE_NAME, website.id, ACTIVE_WEBSITE_COOKIE_MAX_AGE);
    } else {
      removeCookie(ACTIVE_WEBSITE_COOKIE_NAME);
    }
  };

  // Check if tenant has multiple websites
  const hasMultipleWebsites = availableWebsites.length > 1;

  // Get website URL based on domain
  const getWebsiteUrl = (website: Website) => {
    // Handle different domain formats
    if (website.domain.startsWith('http://') || website.domain.startsWith('https://')) {
      return website.domain;
    }
    // Default to https if protocol not specified
    return `https://${website.domain}`;
  };

  return {
    activeWebsite,
    setActiveWebsite,
    availableWebsites,
    hasMultipleWebsites,
    isInitialized,
    getWebsiteUrl,
  };
} 