import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ForgotPasswordForm from "@/components/auth/forget-password-form";
import { SparklesCore } from "@/components/ui/sparkles";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request a password reset link for your Amrio portal account.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen w-full  flex items-center justify-center relative overflow-hidden">
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

        {/* Form */}
        <ForgotPasswordForm />

        {/* Divider */}
        <div className="w-full h-px bg-[#2a2a2a]" />

        {/* Back to login */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-[#555] hover:text-[#aaa] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </Link>
      </div>
    </div>
  );
}
