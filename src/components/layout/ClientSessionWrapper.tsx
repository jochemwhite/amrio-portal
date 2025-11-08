"use client";

import { UserSessionProvider } from "@/providers/session-provider";
import { UserSession } from "@/types/custom-supabase-types";
import { SupabaseWebsite } from "@/types/cms";
import React from "react";

type Tenant = UserSession["tenants"][0];

interface ClientSessionWrapperProps {
  children: React.ReactNode;
  userData: UserSession | null;
  initialActiveTenant?: Tenant | null;
  initialActiveWebsite?: SupabaseWebsite | null;
}

export const ClientSessionWrapper: React.FC<ClientSessionWrapperProps> = ({ 
  children, 
  userData,
  initialActiveTenant,
  initialActiveWebsite
}) => {
  return (
    <UserSessionProvider 
      userData={userData}
      initialActiveTenant={initialActiveTenant}
      initialActiveWebsite={initialActiveWebsite}
    >
      {children}
    </UserSessionProvider>
  );
};