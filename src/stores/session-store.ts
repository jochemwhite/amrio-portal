import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createClient } from "@/lib/supabase/supabaseClient";
import { UserSession } from "@/types/custom-supabase-types";
import { SupabaseWebsite } from "@/types/cms";
import { setSessionCookies } from "@/actions/auth";

type Tenant = NonNullable<UserSession["active_tenant"]>;

// ─── Cookie helpers (client-side reads only) ──────────────────────────────────

export const ACTIVE_TENANT_COOKIE  = "active-tenant";
export const ACTIVE_WEBSITE_COOKIE = "active-website";

export const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? null;
  return null;
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "loading" | "ready";

interface SessionState {
  status: Status;
  userSession: UserSession | null;
  requiresMFA: boolean;
  error: string | null;

  hydrate: (data: UserSession) => void;
  initialize: () => Promise<void>;
  reset: () => void;
  setActiveTenant: (tenant: Tenant) => Promise<void>;
  setActiveWebsite: (website: SupabaseWebsite) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSessionStore = create<SessionState>()(
  devtools(
    (set) => ({
      status: "loading",
      userSession: null,
      requiresMFA: false,
      error: null,

      hydrate: (data) => {
        set({ status: "ready", userSession: data });
      },

      initialize: async () => {
        const supabase = createClient();
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            set({ status: "ready", userSession: null });
            return;
          }

          const { data: mfa } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (mfa && mfa.nextLevel === "aal2" && mfa.nextLevel !== mfa.currentLevel) {
            set({ status: "ready", requiresMFA: true });
            return;
          }

          const activeTenantId = getCookie(ACTIVE_TENANT_COOKIE);
          const { data, error } = await supabase.rpc("get_user_session", {
            p_uid: user.id,
            p_active_tenant_id: activeTenantId ?? undefined,
          });
          if (error) throw new Error(error.message);

          set({ status: "ready", userSession: data as UserSession });
        } catch (err: any) {
          console.error("Session init failed:", err);
          set({ status: "ready", error: err.message ?? "Unknown error" });
        }
      },

      reset: () => set({
        status: "ready",
        userSession: null,
        requiresMFA: false,
        error: null,
      }),

      // Sets cookie + revalidates dashboard layout server-side
      // No need for router.refresh() on the client
      setActiveTenant: async (tenant) => {
        set((state) => {
          if (!state.userSession) return state;
          return {
            userSession: {
              ...state.userSession,
              active_tenant: tenant,
              active_website: null,
            },
          };
        });

        await setSessionCookies({
          tenantId:  tenant.id,
          websiteId: null,
          revalidate: true,
        });
      },

      setActiveWebsite: async (website) => {
        set((state) => {
          if (!state.userSession) return state;
          return {
            userSession: {
              ...state.userSession,
              active_website: {
                id: website.id,
                name: website.name,
                url: website.domain ?? "",
              },
            },
          };
        });

        await setSessionCookies({
          tenantId:  null,
          websiteId: website.id,
          revalidate: true,
        });
      },
    }),
    { name: "SessionStore" }
  )
);
