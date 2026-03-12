import { createClient } from "@/lib/supabase/supabaseServerClient";
import { redirect } from "next/navigation";
import Image from "next/image";
import { LogoutButton } from "@/components/auth/logout-button";
import AuthMFA from "@/components/auth/auth-mfa";
import { SparklesCore } from "@/components/ui/sparkles";

export default async function MFAPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: mfa } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!mfa || mfa.nextLevel !== "aal2" || mfa.nextLevel === mfa.currentLevel) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Card */}
      <div className="relative z-10 w-full max-w-sm mx-4 bg-[#1a1a1a] rounded-2xl shadow-2xl px-8 py-10 flex flex-col items-center gap-6">
        {/* Logo */}
        <Image
          src="/amrio-logo-white.png"
          alt="Amrio"
          width={160}
          height={48}
          priority
          className="mb-2"
        />

        {/* Heading */}
        <div className="w-full space-y-1">
          <h1 className="text-white font-bold text-xl">
            Two-factor authentication
          </h1>
          <p className="text-[#888] text-sm">
            Enter the 6-digit code from your authenticator app to continue.
          </p>
        </div>

        {/* Email */}
        <p className="w-full text-xs text-[#555]">
          Signed in as <span className="text-[#999]">{user.email}</span>
        </p>

        {/* MFA form */}
        <div className="w-full">
          <AuthMFA redirectTo="/dashboard" />
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-[#2a2a2a]" />

        {/* Sign out */}
        <LogoutButton />
      </div>
    </div>
  );
}
