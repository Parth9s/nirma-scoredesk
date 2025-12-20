import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://nirma-scordesk.vercel.app'),
  title: {
    default: "Nirma ScoreDesk | Academic Dashboard",
    template: "%s | Nirma ScoreDesk"
  },
  description: "The ultimate academic companion for Nirma University students. Calculate SGPA/CGPA, track attendance, and access study resources.",
  keywords: ["Nirma University", "ScoreDesk", "SGPA Calculator", "CGPA Calculator", "Nirma Attendance", "Engineering Notes", "PYQ"],
  authors: [{ name: "Parth Savaliya" }],
  creator: "Parth Savaliya",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://nirma-scordesk.vercel.app",
    title: "Nirma ScoreDesk - Student Dashboard",
    description: "Track your academic progress, calculate grades, and access resources at Nirma University.",
    siteName: "Nirma ScoreDesk",
    images: [{
      url: "/icon.png", // Next.js will resolve this
      width: 512,
      height: 512,
      alt: "Nirma ScoreDesk Logo"
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nirma ScoreDesk",
    description: "Your academic dashboard for Nirma University.",
    images: ["/icon.png"], // Same icon
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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nirma ScoreDesk",
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

import { SessionProvider } from "next-auth/react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.className} antialiased`}>
        {/* Global Background Grid Only */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <SessionProvider>
          <GoogleAdSense />
          {children}
          <SpeedInsights />
        </SessionProvider>
      </body>
    </html>
  );
}
