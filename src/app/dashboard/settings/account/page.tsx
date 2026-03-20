import { ImageSection } from "@/components/settings/image-settings";
import MultifactorAuthentication from "@/components/settings/multifactor-authentication";
import { PasswordSection } from "@/components/settings/password-settings";
import { ProfileSection } from "@/components/settings/profile-settings";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { unauthorized } from "next/navigation";
import React from "react";

export const metadata = {
  title: "Account Settings | Amrio",
  description: "Manage your account settings, profile information, and security preferences",
};

export default async function page() {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    unauthorized();
  }

  if (!userData.user) {
    unauthorized();
  }

  const { data, error } = await supabase.from("users").select("*").eq("id", userData.user.id).single();

  if (error) {
    console.log(error);
    return unauthorized();
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 md:py-10">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Account Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile, credentials, and account security.</p>
      </div>

      <div className="grid gap-5 md:gap-6">
        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          <ProfileSection user={data} staggerIndex={0} />
          <ImageSection user={data} staggerIndex={1} />
        </div>

        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          <PasswordSection staggerIndex={2} />
          <MultifactorAuthentication />
        </div>
      </div>
    </div>
  );
}
