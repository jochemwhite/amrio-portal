import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (!token_hash || !type) {
    redirect("/");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  });

  if (error) {
    console.error("OTP verification error:", error);

    if (
      error.code === "otp_expired" ||
      error.message.toLowerCase().includes("expired") ||
      error.message.toLowerCase().includes("invalid")
    ) {
      redirect(`/?error=expired&type=${type}`);
    }

    redirect("/?error=invalid-token");
  }

  redirect(next);
}