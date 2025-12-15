import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nirma ScoreDesk",
  description: "Academic companion for Nirma University students",
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
      <body className={`${inter.className} antialiased`}>
        <SessionProvider>
          <GoogleAdSense />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
