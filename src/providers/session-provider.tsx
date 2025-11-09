"use client";

import AuthMFA from "@/components/auth/auth-mfa";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/supabaseClient";
import { UserSession } from "@/types/custom-supabase-types";
import { Database } from "@/types/supabase";
import { SupabaseWebsite } from "@/types/cms";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState, useRef } from "react";
import { getWebsitesByTenant } from "@/actions/cms/website-actions";

type Tenant = UserSession["tenants"][0];

interface UserSessionContextValue {
  userSession: UserSession | null;
  loadingSession: boolean;
  sessionError: any;
  refreshSession: () => Promise<void>;
  setActiveTenant: (tenant: Tenant) => void;
  setActiveWebsite: (website: SupabaseWebsite) => void;
}

const UserSessionContext = createContext<UserSessionContextValue | null>(null);

interface UserSessionProviderProps {
  children: ReactNode;
  userData: UserSession | null;
  initialActiveTenant?: Tenant | null;
  initialActiveWebsite?: SupabaseWebsite | null;
}

// Cookie constants
const ACTIVE_TENANT_COOKIE_NAME = "active-tenant";
const ACTIVE_WEBSITE_COOKIE_NAME = "active-website";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Cookie helper functions
const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

const setCookie = (name: string, value: string, maxAge: number) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

const removeCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0`;
};

export const UserSessionProvider: React.FC<UserSessionProviderProps> = ({ children, userData, initialActiveTenant, initialActiveWebsite }) => {
  const [userSession, setUserSession] = useState<UserSession | null>(userData);
  const [loadingSession, setLoadingSession] = useState<boolean>(true);
  const [sessionError, setSessionError] = useState<any>(null);
  const [showMFAScreen, setShowMFAScreen] = useState(false);

  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const subscriptionRef = useRef<{ auth: any; realtime: any } | null>(null);
  const initializationRef = useRef(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);
  const lastSessionRef = useRef<string | null>(null);
  const isUserAlreadySignedInRef = useRef(false);

  const getSupabaseUserSession = useCallback(async (): Promise<UserSession | null> => {
    try {
      const supabase = supabaseRef.current;
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      const { data, error } = await supabase.rpc("get_user_session", {
        p_uid: user.id,
      });

      if (error) {
        console.error("Error fetching user session from RPC:", error);
        throw error;
      }

      return data as UserSession;
    } catch (error) {
      console.error("Unexpected error during RPC call:", error);
      throw error;
    }
  }, []);

  const refreshSession = useCallback(
    async (showLoading = true) => {
      if (isRefreshingRef.current) return; // Prevent concurrent refreshes

      isRefreshingRef.current = true;

      // Clear any pending refresh timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      if (showLoading) {
        setLoadingSession(true);
      }
      setSessionError(null);

      try {
        const session = await getSupabaseUserSession();
        setUserSession(session);
      } catch (error) {
        setSessionError(error);
        setUserSession(null);
      } finally {
        if (showLoading) {
          setLoadingSession(false);
        }
        isRefreshingRef.current = false;
      }
    },
    [getSupabaseUserSession]
  );

  const checkMFA = useCallback(async () => {
    try {
      const { data, error } = await supabaseRef.current.auth.mfa.getAuthenticatorAssuranceLevel();

      if (error) {
        console.error("MFA check error:", error);
        return;
      }

      if (data.nextLevel === "aal2" && data.nextLevel !== data.currentLevel) {
        setShowMFAScreen(true);
      }
      setLoadingSession(false);
    } catch (error) {
      console.error("MFA check failed:", error);
    }
  }, []);

  const handleRoleChange = useCallback(
    async (payload: RealtimePostgresChangesPayload<Database["public"]["Tables"]["user_global_roles"]["Row"]>) => {
      try {
        const {
          data: { user },
        } = await supabaseRef.current.auth.getUser();
        const currentUserId = user?.id;
        const changedUserId = (payload.new as any)?.user_id || (payload.old as any)?.user_id;

        if (currentUserId && changedUserId === currentUserId) {
          // Debounce role change refresh to avoid excessive updates
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }

          refreshTimeoutRef.current = setTimeout(() => {
            refreshSession(false); // Don't show loading for background refresh
          }, 500);
        }
      } catch (error) {
        console.error("Error handling role change:", error);
      }
    },
    [refreshSession]
  );

  const setupRealtimeSubscription = useCallback(
    (userId: string) => {
      // Clean up existing subscription
      if (subscriptionRef.current?.realtime) {
        subscriptionRef.current.realtime.unsubscribe();
      }

      const rolesChannel = supabaseRef.current.channel(`user_global_roles_channel_${userId}`).on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_global_roles",
          filter: `user_id=eq.${userId}`,
        },
        handleRoleChange
      );

      rolesChannel.subscribe();

      subscriptionRef.current = {
        ...subscriptionRef.current,
        realtime: rolesChannel,
        auth: subscriptionRef.current?.auth || null, // Ensure auth property is always defined
      };
    },
    [handleRoleChange]
  );

  // Cleanup function
  const cleanup = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    if (subscriptionRef.current?.auth) {
      subscriptionRef.current.auth.unsubscribe();
    }
    if (subscriptionRef.current?.realtime) {
      subscriptionRef.current.realtime.unsubscribe();
    }
    subscriptionRef.current = null;
    isRefreshingRef.current = false;
    lastSessionRef.current = null;
    isUserAlreadySignedInRef.current = false;
  }, []);

  // Function to set active tenant
  const setActiveTenant = useCallback((tenant: Tenant) => {
    setCookie(ACTIVE_TENANT_COOKIE_NAME, tenant.id, COOKIE_MAX_AGE);

    setUserSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        active_tenant: tenant,
      };
    });

    // Reset active website when tenant changes
    removeCookie(ACTIVE_WEBSITE_COOKIE_NAME);
    setUserSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        active_website: {
          id: "",
          name: "",
          url: "",
        },
      };
    });
    router.refresh();
  }, []);

  // Function to set active website
  const setActiveWebsite = useCallback((website: SupabaseWebsite) => {
    setCookie(ACTIVE_WEBSITE_COOKIE_NAME, website.id, COOKIE_MAX_AGE);

    setUserSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        active_website: {
          id: website.id,
          name: website.name,
          url: website.domain,
        },
      };
    });
    router.refresh();
  }, []);

  // Initialize session once on mount
  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    const initializeSession = async () => {
      try {
        if (userData) {
          setUserSession(userData);
          isUserAlreadySignedInRef.current = true;
        } else {
          // Fetch fresh session
          await refreshSession(true);
          // Set signed in flag if we got a session
          const {
            data: { session },
          } = await supabaseRef.current.auth.getSession();
          if (session) {
            isUserAlreadySignedInRef.current = true;
            lastSessionRef.current = session.access_token;
          }
        }
        await checkMFA();
        setLoadingSession(false);
      } catch (error) {
        console.error("Session initialization failed:", error);
        setSessionError(error);
        setLoadingSession(false);
      } finally {
      }
    };

    initializeSession();
  }, []); // Empty dependency array - run only once

  // Set up auth state listener
  useEffect(() => {
    const {
      data: { subscription: authSubscription },
    } = supabaseRef.current.auth.onAuthStateChange(async (event, session) => {
      // Ignore token refresh events that don't require UI updates
      if (event === "TOKEN_REFRESHED") {
        return;
      }

      try {
        switch (event) {
          case "SIGNED_IN":
            if (session) {
              const currentSessionId = session.access_token;

              // Check if this is actually a new sign-in or just a session restoration
              if (lastSessionRef.current === currentSessionId && isUserAlreadySignedInRef.current) {
                return;
              }

              // Check if user was already signed in (prevents alt-tab triggers)
              if (isUserAlreadySignedInRef.current && userSession) {
                return;
              }

              lastSessionRef.current = currentSessionId;
              isUserAlreadySignedInRef.current = true;

              await refreshSession(true);
            }
            break;
          case "SIGNED_OUT":
            lastSessionRef.current = null;
            isUserAlreadySignedInRef.current = false;
            setUserSession(null);
            setShowMFAScreen(false);
            setSessionError(null);
            router.push("/");
            break;
          case "MFA_CHALLENGE_VERIFIED":
            setShowMFAScreen(false);
            break;
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        setSessionError(error);
      }
    });

    subscriptionRef.current = {
      ...subscriptionRef.current,
      auth: authSubscription,
      realtime: subscriptionRef.current?.realtime || null,
    };

    return () => {
      authSubscription.unsubscribe();
    };
  }, [refreshSession, checkMFA, router]);

  // Set up realtime subscription when user session changes
  useEffect(() => {
    const userId = userSession?.user_info?.id;

    if (userId) {
      setupRealtimeSubscription(userId);
    }

    return () => {
      if (subscriptionRef.current?.realtime) {
        subscriptionRef.current.realtime.unsubscribe();
      }
    };
  }, [userSession?.user_info?.id, setupRealtimeSubscription]);

  // Handle redirect logic after initialization
  useEffect(() => {
    if (!userSession && !loadingSession && !sessionError) {
      router.push("/");
    }
  }, [userSession, loadingSession, sessionError, router]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Initialize active tenant from props or cookie
  useEffect(() => {
    if (!userSession?.tenants || userSession.tenants.length === 0) return;

    let selectedTenant: Tenant | null = null;

    // Use initial prop if provided
    if (initialActiveTenant && userSession.tenants.find((t) => t.id === initialActiveTenant.id)) {
      selectedTenant = initialActiveTenant;
    } else {
      // Try to get from cookie
      const savedTenantId = getCookie(ACTIVE_TENANT_COOKIE_NAME);
      if (savedTenantId) {
        selectedTenant = userSession.tenants.find((tenant) => tenant.id === savedTenantId) || null;
      }
    }

    // Fallback to first tenant
    if (!selectedTenant) {
      selectedTenant = userSession.tenants[0];
    }

    // Set the tenant
    setCookie(ACTIVE_TENANT_COOKIE_NAME, selectedTenant.id, COOKIE_MAX_AGE);
    setUserSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        active_tenant: selectedTenant!,
      };
    });
  }, [userSession?.tenants, initialActiveTenant]);

  // Initialize active website from props or cookie
  useEffect(() => {
    const initializeActiveWebsite = async () => {
      const activeTenant = userSession?.active_tenant;
      if (!activeTenant) return;

      try {
        const result = await getWebsitesByTenant(activeTenant.id);
        if (result.success && result.data && result.data.length > 0) {
          const websites = result.data as SupabaseWebsite[];
          let selectedWebsite: SupabaseWebsite | null = null;

          // Use initial prop if provided
          if (initialActiveWebsite && websites.find((w) => w.id === initialActiveWebsite.id)) {
            selectedWebsite = initialActiveWebsite;
          } else {
            // Try to get from cookie
            const savedWebsiteId = getCookie(ACTIVE_WEBSITE_COOKIE_NAME);
            if (savedWebsiteId) {
              selectedWebsite = (websites.find((website) => website.id === savedWebsiteId) || null) as SupabaseWebsite | null;
            }
          }

          // Fallback to first website
          if (!selectedWebsite) {
            selectedWebsite = websites[0];
          }

          // Set the website if we have one
          if (selectedWebsite) {
            setCookie(ACTIVE_WEBSITE_COOKIE_NAME, selectedWebsite.id, COOKIE_MAX_AGE);
            setUserSession((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                active_website: {
                  id: selectedWebsite!.id,
                  name: selectedWebsite!.name,
                  url: selectedWebsite!.domain,
                },
              };
            });
          }
        }
      } catch (error) {
        console.error("Error fetching websites:", error);
      }
    };

    initializeActiveWebsite();
  }, [userSession?.active_tenant, initialActiveWebsite]);

  const contextValue: UserSessionContextValue = {
    userSession,
    loadingSession,
    sessionError,
    refreshSession,
    setActiveTenant,
    setActiveWebsite,
  };

  if (loadingSession) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size={100} />
      </div>
    );
  }

  if (showMFAScreen) {
    return (
      <div className="flex justify-center items-center h-screen">
        <AuthMFA onSuccess={() => setShowMFAScreen(false)} />
      </div>
    );
  }

  return <UserSessionContext.Provider value={contextValue}>{children}</UserSessionContext.Provider>;
};

export const useUserSession = (): UserSessionContextValue => {
  const context = useContext(UserSessionContext);
  if (!context) {
    throw new Error("useUserSession must be used within a UserSessionProvider");
  }
  return context;
};
