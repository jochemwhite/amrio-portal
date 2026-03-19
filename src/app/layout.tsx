import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Amrio Portal",
    template: "%s | Amrio Portal",
  },
  description: "Manage websites, pages, layouts, and collections in the Amrio portal.",
  applicationName: "Amrio Portal",
  openGraph: {
    type: "website",
    title: "Amrio Portal",
    description: "Manage websites, pages, layouts, and collections in the Amrio portal.",
    siteName: "Amrio Portal",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amrio Portal",
    description: "Manage websites, pages, layouts, and collections in the Amrio portal.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased ${geistSans.className}`}
      >
        {children}
      </body>
    </html>
  );
}
