"use client";

import AuthMFA from "@/components/auth/auth-mfa";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/supabaseClient";
import { UserSession } from "@/types/custom-supabase-types";
import { Database } from "@/types/supabase";
import { SupabaseWebsite } from "@/types/cms";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import React, { ReactNode, useCallback, useEffect, useRef } from "react";
import { getWebsitesByTenant } from "@/actions/cms/website-actions";
import { useSessionStore, getCookie, setCookie, ACTIVE_TENANT_COOKIE_NAME, ACTIVE_WEBSITE_COOKIE_NAME, COOKIE_MAX_AGE } from "@/stores/session-store";

type Tenant = UserSession["tenants"][0];

interface UserSessionProviderProps {
  children: ReactNode;
  userData: UserSession | null;
  initialActiveTenant?: Tenant | null;
  initialActiveWebsite?: SupabaseWebsite | null;
}

export const UserSessionProvider: React.FC<UserSessionProviderProps> = ({ children, userData, initialActiveTenant, initialActiveWebsite }) => {
  // Use Zustand store
  const {
    userSession,
    loadingSession,
    sessionError,
    showMFAScreen,
    setShowMFAScreen,
    setSessionError,
    refreshSession,
    checkMFA,
    setActiveTenant,
    setActiveWebsite,
    initialize,
    reset,
  } = useSessionStore();

  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const subscriptionRef = useRef<{ auth: any; realtime: any } | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSessionRef = useRef<string | null>(null);
  const isUserAlreadySignedInRef = useRef(false);

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
    lastSessionRef.current = null;
    isUserAlreadySignedInRef.current = false;
  }, []);

  // Initialize session once on mount
  useEffect(() => {
    const initializeSession = async () => {
      await initialize(userData);

      // Set signed in flag if we got a session
      const {
        data: { session },
      } = await supabaseRef.current.auth.getSession();
      if (session) {
        isUserAlreadySignedInRef.current = true;
        lastSessionRef.current = session.access_token;
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
            reset();
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
    if (userSession.active_tenant?.id) return; // Already set

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
    setActiveTenant(selectedTenant);
  }, [userSession?.tenants, userSession?.active_tenant?.id, initialActiveTenant, setActiveTenant]);

  // Initialize active website from props or cookie
  useEffect(() => {
    const initializeActiveWebsite = async () => {
      const activeTenant = userSession?.active_tenant;
      if (!activeTenant) return;
      if (userSession.active_website?.id) return; // Already set

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
            setActiveWebsite(selectedWebsite);
          }
        }
      } catch (error) {
        console.error("Error fetching websites:", error);
      }
    };

    initializeActiveWebsite();
  }, [userSession?.active_tenant, userSession?.active_website?.id, initialActiveWebsite, setActiveWebsite]);

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

  return <>{children}</>;
};

// Custom hook to use the session store with router refresh wrappers
export const useUserSession = () => {
  const store = useSessionStore();
  const router = useRouter();

  return {
    userSession: store.userSession,
    loadingSession: store.loadingSession,
    sessionError: store.sessionError,
    refreshSession: store.refreshSession,
    setActiveTenant: (tenant: Tenant) => {
      store.setActiveTenant(tenant);
      router.refresh();
    },
    setActiveWebsite: (website: SupabaseWebsite) => {
      store.setActiveWebsite(website);
      router.refresh();
    },
  };
};
