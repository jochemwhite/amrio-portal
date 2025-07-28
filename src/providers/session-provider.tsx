"use client";

import AuthMFA from "@/components/auth/auth-mfa";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/supabaseClient";
import { UserSession } from "@/types/custom-supabase-types";
import { Database } from "@/types/supabase";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState, useRef } from "react";

interface UserSessionContextValue {
  userSession: UserSession | null;
  loadingSession: boolean;
  sessionError: any;
  refreshSession: () => Promise<void>;
}

const UserSessionContext = createContext<UserSessionContextValue | null>(null);

interface UserSessionProviderProps {
  children: ReactNode;
  userData: UserSession | null;
}

export const UserSessionProvider: React.FC<UserSessionProviderProps> = ({ children, userData }) => {
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
      const { data: { user } } = await supabase.auth.getUser();
      
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

  const refreshSession = useCallback(async (showLoading = true) => {
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
  }, [getSupabaseUserSession]);

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
        const { data: { user } } = await supabaseRef.current.auth.getUser();
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

  const setupRealtimeSubscription = useCallback((userId: string) => {
    // Clean up existing subscription
    if (subscriptionRef.current?.realtime) {
      subscriptionRef.current.realtime.unsubscribe();
    }

    const rolesChannel = supabaseRef.current
      .channel(`user_global_roles_channel_${userId}`)
      .on(
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
      auth: subscriptionRef.current?.auth || null // Ensure auth property is always defined
    };
  }, [handleRoleChange]);

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
          const { data: { session } } = await supabaseRef.current.auth.getSession();
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
    const { data: { subscription: authSubscription } } = supabaseRef.current.auth.onAuthStateChange(
      async (event, session) => {

        
        // Ignore token refresh events that don't require UI updates
        if (event === 'TOKEN_REFRESHED') {
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
      }
    );

    subscriptionRef.current = {
      ...subscriptionRef.current,
      auth: authSubscription,
      realtime: subscriptionRef.current?.realtime || null
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

  const contextValue: UserSessionContextValue = {
    userSession,
    loadingSession,
    sessionError,
    refreshSession,
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

  return (
    <UserSessionContext.Provider value={contextValue}>
      {children}
    </UserSessionContext.Provider>
  );
};

export const useUserSession = (): UserSessionContextValue => {
  const context = useContext(UserSessionContext);
  if (!context) {
    throw new Error("useUserSession must be used within a UserSessionProvider");
  }
  return context;
};