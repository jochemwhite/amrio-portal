"use client";

import { createClient } from "@/lib/supabase/supabaseClient";
import { LogOut } from "lucide-react";


export function LogoutButton() {
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 text-xs text-[#555] hover:text-[#aaa] transition-colors"
    >
      <LogOut className="h-3.5 w-3.5" />
      Sign out
    </button>
  );
}
