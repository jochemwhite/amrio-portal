import nodemailer from "nodemailer";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/SupabaseAdminClient";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: true, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
} as any);

interface EmailData {
  to: string;
  subject: string;
  text: string;
  html: string;
}


export async function sendEmail({ to, subject, text, html }: EmailData): Promise<{ success: boolean, error: string | null }> {
  const mailOptions = {
    from: `Amrio Portal <${env.SMTP_FROM}>`,
    to: to,
    subject: subject,
    text: text,
    html: html,
  };

  let status = 'sent';
  let error_message = null;
  let message_id = null;
  const sent_at = new Date().toISOString();

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
    console.log("Message ID:", info.messageId);
    message_id = info.messageId;
  } catch (error) {
    console.error("Error sending email:", error);
    status = 'failed';
    error_message = error instanceof Error ? error.message : String(error);
  }

  // Log to Supabase
  await supabaseAdmin.from('email_logs').insert([
    {
      to_address: to,
      subject,
      text_body: text,
      html_body: html,
      sent_at,
      status,
      error_message,
      message_id,
    },
  ]);

  return { success: status === 'sent', error: error_message };
}
