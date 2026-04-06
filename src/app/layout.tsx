import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { getBranding } from "@/lib/branding";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const branding = getBranding();

export const metadata: Metadata = {
  title: branding.metaTitle,
  description: branding.metaDescription,
  icons: branding.faviconUrl ? { icon: branding.faviconUrl } : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Inject primary color as CSS custom property for whitelabeling
  const brandStyle = branding.primaryColor !== '#3b82f6'
    ? { '--primary': branding.primaryColor, '--accent': branding.primaryColor, '--ring': branding.primaryColor } as React.CSSProperties
    : undefined;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex bg-background text-foreground" style={brandStyle}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
