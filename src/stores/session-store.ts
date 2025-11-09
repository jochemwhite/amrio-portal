import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { UserSession } from "@/types/custom-supabase-types";
import { SupabaseWebsite } from "@/types/cms";
import { createClient } from "@/lib/supabase/supabaseClient";

type Tenant = UserSession["tenants"][0];

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

interface SessionState {
  // State
  userSession: UserSession | null;
  loadingSession: boolean;
  sessionError: any;
  showMFAScreen: boolean;
  
  // Internal flags
  isRefreshing: boolean;
  isInitialized: boolean;
  
  // Actions
  setUserSession: (session: UserSession | null) => void;
  setLoadingSession: (loading: boolean) => void;
  setSessionError: (error: any) => void;
  setShowMFAScreen: (show: boolean) => void;
  refreshSession: (showLoading?: boolean) => Promise<void>;
  setActiveTenant: (tenant: Tenant) => void;
  setActiveWebsite: (website: SupabaseWebsite) => void;
  checkMFA: () => Promise<void>;
  initialize: (userData: UserSession | null) => Promise<void>;
  reset: () => void;
}

// Create supabase client instance
const supabase = createClient();

// Helper to fetch user session from RPC
const getSupabaseUserSession = async (): Promise<UserSession | null> => {
  try {
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
};

export const useSessionStore = create<SessionState>()(
  devtools(
    (set, get) => ({
      // Initial state
      userSession: null,
      loadingSession: true,
      sessionError: null,
      showMFAScreen: false,
      isRefreshing: false,
      isInitialized: false,

      // Simple setters
      setUserSession: (session) => set({ userSession: session }),
      setLoadingSession: (loading) => set({ loadingSession: loading }),
      setSessionError: (error) => set({ sessionError: error }),
      setShowMFAScreen: (show) => set({ showMFAScreen: show }),

      // Initialize session
      initialize: async (userData) => {
        if (get().isInitialized) return;
        
        set({ isInitialized: true, loadingSession: true });
        
        try {
          if (userData) {
            set({ userSession: userData });
          } else {
            await get().refreshSession(false);
          }
          
          await get().checkMFA();
        } catch (error) {
          console.error("Session initialization failed:", error);
          set({ sessionError: error });
        } finally {
          set({ loadingSession: false });
        }
      },

      // Refresh session
      refreshSession: async (showLoading = true) => {
        const state = get();
        
        // Prevent concurrent refreshes
        if (state.isRefreshing) return;

        set({ isRefreshing: true });
        
        if (showLoading) {
          set({ loadingSession: true });
        }
        
        set({ sessionError: null });

        try {
          const session = await getSupabaseUserSession();
          set({ userSession: session });
        } catch (error) {
          set({ sessionError: error, userSession: null });
        } finally {
          if (showLoading) {
            set({ loadingSession: false });
          }
          set({ isRefreshing: false });
        }
      },

      // Check MFA status
      checkMFA: async () => {
        try {
          const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

          if (error) {
            console.error("MFA check error:", error);
            return;
          }

          if (data.nextLevel === "aal2" && data.nextLevel !== data.currentLevel) {
            set({ showMFAScreen: true });
          }
        } catch (error) {
          console.error("MFA check failed:", error);
        }
      },

      // Set active tenant
      setActiveTenant: (tenant) => {
        setCookie(ACTIVE_TENANT_COOKIE_NAME, tenant.id, COOKIE_MAX_AGE);

        set((state) => {
          if (!state.userSession) return state;
          
          return {
            userSession: {
              ...state.userSession,
              active_tenant: tenant,
              active_website: {
                id: "",
                name: "",
                url: "",
              },
            },
          };
        });

        // Reset active website when tenant changes
        removeCookie(ACTIVE_WEBSITE_COOKIE_NAME);
      },

      // Set active website
      setActiveWebsite: (website) => {
        setCookie(ACTIVE_WEBSITE_COOKIE_NAME, website.id, COOKIE_MAX_AGE);

        set((state) => {
          if (!state.userSession) return state;
          
          return {
            userSession: {
              ...state.userSession,
              active_website: {
                id: website.id,
                name: website.name,
                url: website.domain,
              },
            },
          };
        });
      },

      // Reset store
      reset: () => {
        set({
          userSession: null,
          loadingSession: false,
          sessionError: null,
          showMFAScreen: false,
          isRefreshing: false,
          isInitialized: false,
        });
      },
    }),
    { name: "SessionStore" }
  )
);

// Export cookie helpers for use in provider
export { getCookie, setCookie, ACTIVE_TENANT_COOKIE_NAME, ACTIVE_WEBSITE_COOKIE_NAME, COOKIE_MAX_AGE };

