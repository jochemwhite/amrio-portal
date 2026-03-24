import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Amrio Portal",
    template: "%s | Amrio Portal",
  },
  description:
    "Manage websites, pages, layouts, and collections in the Amrio portal.",
  applicationName: "Amrio Portal",
  openGraph: {
    type: "website",
    title: "Amrio Portal",
    description:
      "Manage websites, pages, layouts, and collections in the Amrio portal.",
    siteName: "Amrio Portal",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amrio Portal",
    description:
      "Manage websites, pages, layouts, and collections in the Amrio portal.",
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
        style={
          {
            "--font-geist-sans": "ui-sans-serif, system-ui, sans-serif",
            "--font-geist-mono": "ui-monospace, SFMono-Regular, monospace",
            "--font-sans": "var(--font-geist-sans)",
          } as CSSProperties
        }
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}
