import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import type { Database } from "@/types/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";
  const errorUrl = new URL("/auth-error", request.url);

  if (!token_hash || !type) {
    errorUrl.searchParams.set("reason", "missing-token");
    errorUrl.searchParams.set("next", next);
    return NextResponse.redirect(errorUrl);
  }

  let response = NextResponse.redirect(new URL(next, request.url));

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.redirect(new URL(next, request.url));
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

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
      errorUrl.searchParams.set("reason", "expired");
      errorUrl.searchParams.set("type", type);
      errorUrl.searchParams.set("next", next);
      return NextResponse.redirect(errorUrl);
    }

    errorUrl.searchParams.set("reason", "verification-failed");
    errorUrl.searchParams.set("type", type);
    errorUrl.searchParams.set("next", next);
    return NextResponse.redirect(errorUrl);
  }

  return response;
}
