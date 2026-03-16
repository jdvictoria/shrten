import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const font = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "shrten — Free URL Shortener",
    template: "%s | shrten",
  },
  description:
    "shrten is a fast, free URL shortener. Create short links in seconds, track click analytics, and manage all your links from one dashboard.",
  keywords: [
    "url shortener",
    "link shortener",
    "short links",
    "free url shortener",
    "link analytics",
    "click tracking",
    "shrten",
  ],
  authors: [{ name: "shrten" }],
  creator: "shrten",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "shrten",
    title: "shrten — Free URL Shortener",
    description:
      "Create short links in seconds, track click analytics, and manage all your links from one dashboard.",
  },
  twitter: {
    card: "summary_large_image",
    title: "shrten — Free URL Shortener",
    description:
      "Create short links in seconds, track click analytics, and manage all your links from one dashboard.",
    creator: "@shrten",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${font.className} h-svh flex flex-col`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
