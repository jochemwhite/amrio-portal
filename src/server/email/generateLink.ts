import { env } from "@/lib/env";
import type { EmailOtpType } from "@supabase/supabase-js";

interface props {
  token: string;
  type: EmailOtpType;
  next: string;
}

export default function generateLink({ next, token, type }: props): string {
  return `${env.NEXT_PUBLIC_APP_URL}/auth/confirm?token_hash=${token}&type=${type}&next=${next}`;
}
