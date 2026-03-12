"use client";

import { createClient } from "@/lib/supabase/supabaseClient";
import { UserSession } from "@/types/custom-supabase-types";
import { SupabaseWebsite } from "@/types/cms";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useSessionStore } from "@/stores/session-store";
import { Spinner } from "@/components/ui/spinner";
import { setSessionCookies } from "@/actions/auth";

type Tenant = NonNullable<UserSession["active_tenant"]>;

interface SessionProviderProps {
  children: ReactNode;
  initialSession?: UserSession | null;
}

export function SessionProvider({ children, initialSession }: SessionProviderProps) {
  const { status, hydrate, initialize, reset } = useSessionStore();
  const router = useRouter();
  const initialized = useRef(false);

  // Hydrate or initialize — runs once
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (initialSession) {
      hydrate(initialSession);
    } else {
      initialize();
    }
  }, []);

  // Persist cookies whenever the resolved session changes —
  // separate from init so it also runs after tenant/website switches
  useEffect(() => {
    if (!initialSession) return;
    setSessionCookies({
      tenantId:  initialSession.active_tenant?.id  ?? null,
      websiteId: initialSession.active_website?.id ?? null,
    });
  }, [initialSession?.active_tenant?.id, initialSession?.active_website?.id]);

  // Listen for sign-out
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        reset();
        router.push("/");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size={100} />
      </div>
    );
  }

  return <>{children}</>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUserSession() {
  const { userSession, status, setActiveTenant, setActiveWebsite } = useSessionStore();

  return {
    userSession,
    isLoading: status === "loading",
    setActiveTenant,
    setActiveWebsite,
  };
}