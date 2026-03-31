import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "../env";

// Always accessible without a session
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/mfa", "/auth", "/privacy-policy", "/terms-of-service"];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

// Accessible even when already logged in
const ALWAYS_ACCESSIBLE_WHEN_AUTHED = ["/forgot-password", "/reset-password", "/mfa", "/auth", "/privacy-policy", "/terms-of-service"];

function isAlwaysAccessible(pathname: string) {
  return ALWAYS_ACCESSIBLE_WHEN_AUTHED.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not add any code between createServerClient and getUser()
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Not logged in — allow public routes, redirect everything else to login
  if (!user) {
    if (isPublicRoute(pathname)) return supabaseResponse;
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Logged in — always allow these regardless
  if (isAlwaysAccessible(pathname)) return supabaseResponse;

  // Logged in — redirect away from login/signup to dashboard
  if (isPublicRoute(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}
