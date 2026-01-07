import type { Metadata } from "next";
import { Manrope, Great_Vibes } from "next/font/google"; // Import Great Vibes
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"] });
const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-logo"
}); // Configure Great Vibes

export const metadata: Metadata = {
  metadataBase: new URL('https://strideee.in'),
  title: {
    default: "Stride | Academic Dashboard",
    template: "%s | Stride"
  },
  description: "Your complete academic command center. Track grades, attendance, and resources in one place.",
  keywords: ["Stride", "Student Dashboard", "SGPA Calculator", "CGPA Calculator", "Attendance Tracker", "Engineering Notes", "PYQ"],
  authors: [{ name: "Parth Savaliya" }],
  creator: "Parth Savaliya",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://strideee.in",
    title: "Stride | Academic Dashboard",
    description: "Your complete academic command center. Track grades, attendance, and resources in one place.",
    siteName: "Stride",
    images: [{
      url: "/icon.png",
      width: 512,
      height: 512,
      alt: "Stride Logo"
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stride | Academic Dashboard",
    description: "Your complete academic command center. Track grades, attendance, and resources in one place.",
    images: ["/icon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Stride",
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icon.png',
  },
  verification: {
    google: "google-site-verification-placeholder", // User can fill this later
  },
};

import { GoogleAdSense } from "@/components/GoogleAdSense";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";
import { SessionProvider } from "next-auth/react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.className} ${greatVibes.variable} antialiased`}>
        {/* Global Background Grid Only */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <SessionProvider>
          <AnalyticsProvider>
            <GoogleAdSense />
            {children}
            <SpeedInsights />
          </AnalyticsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
