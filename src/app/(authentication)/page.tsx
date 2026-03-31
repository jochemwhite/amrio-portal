import SingInForm from "@/components/auth/sign-in-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to the Amrio portal to manage your content.",
};

export default async function Home() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen relative w-full flex flex-col items-center justify-center overflow-hidden rounded-md px-4 py-10">
      <Card className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input   z-10">
        <CardHeader>
          <div className="flex justify-center">
            <Image
              src="/amrio-logo-white.png"
              alt="Amrio logo"
              width={200}
              height={200}
            />
          </div>
          <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
            Welcome to the Amrio portal
          </h2>
          <p className="text-neutral-600 text-sm max-w-sm  dark:text-neutral-300">
            Login to the portal to manage your content.
          </p>
        </CardHeader>

        <CardContent>
          <SingInForm />
        </CardContent>
      </Card>

      <div className="z-10 mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-sm text-neutral-400">
        <Link
          href="/privacy-policy"
          className="underline underline-offset-4 transition hover:text-white"
        >
          Privacy Policy
        </Link>
        <Link
          href="/terms-of-service"
          className="underline underline-offset-4 transition hover:text-white"
        >
          Terms of Service
        </Link>
      </div>
    </div>
  );
}
