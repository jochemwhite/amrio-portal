import ResetPasswordForm from "@/components/auth/reset-password-form";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import Image from "next/image";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Amrio portal account.",
};

export default async function ResetPasswordPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.log("no user");
    redirect("/");
  }

  return (
    <div className="w-full flex items-center justify-center relative overflow-hidden">
      <div className="relative z-10 w-full max-w-sm mx-4 bg-[#1a1a1a] rounded-2xl shadow-2xl px-8 py-10 flex flex-col items-center gap-6">
        <Image
          src="/amrio-logo-white.png"
          alt="Amrio"
          width={160}
          height={48}
          priority
          className="mb-2"
        />

        <ResetPasswordForm />
      </div>
    </div>
  );
}
