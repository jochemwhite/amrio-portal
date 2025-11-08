"use client";

import { useUserSession } from "@/providers/session-provider";
import { UserSession } from "@/types/custom-supabase-types";
import { useEffect, useState } from "react";

type Tenant = UserSession["tenants"][0];

const ACTIVE_TENANT_COOKIE_NAME = "active-tenant";
const ACTIVE_TENANT_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function useActiveTenant() {
  const { userSession } = useUserSession();
  const [activeTenant, setActiveTenantState] = useState<Tenant | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper function to get cookie value
  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
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

  // Initialize the active tenant from cookie or fallback to first tenant
  useEffect(() => {
    if (!userSession?.tenants || userSession.tenants.length === 0) {
      setActiveTenantState(null);
      setIsInitialized(true);
      return;
    }

    // Try to get from cookie first
    const savedTenantId = getCookie(ACTIVE_TENANT_COOKIE_NAME);

    if (savedTenantId) {
      // Find the saved tenant in the current user's tenants
      const savedTenant = userSession.tenants.find((tenant) => tenant.id === savedTenantId);
      if (savedTenant) {
        setActiveTenantState(savedTenant);
        setIsInitialized(true);
        return;
      }
    }

    // Fallback to first tenant if no saved tenant or saved tenant not found
    const firstTenant = userSession.tenants[0];
    setActiveTenantState(firstTenant);
    setCookie(ACTIVE_TENANT_COOKIE_NAME, firstTenant.id, ACTIVE_TENANT_COOKIE_MAX_AGE);
    setIsInitialized(true);
  }, [userSession]);

  // Function to set the active tenant
  const setActiveTenant = (tenant: Tenant | null) => {
    setActiveTenantState(tenant);
    if (tenant) {
      setCookie(ACTIVE_TENANT_COOKIE_NAME, tenant.id, ACTIVE_TENANT_COOKIE_MAX_AGE);
    } else {
      removeCookie(ACTIVE_TENANT_COOKIE_NAME);
    }
  };

  // Function to get all available tenants
  const availableTenants = userSession?.tenants || [];

  // Check if user has multiple tenants
  const hasMultipleTenants = availableTenants.length > 1;

  return {
    activeTenant,
    setActiveTenant,
    availableTenants,
    hasMultipleTenants,
    isInitialized,
  };
}
