"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/generated/components/Footer";
import LanguageProvider from "@/components/extensions/LanguageProvider";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { FooterViewModel } from "@/viewmodels/FooterViewModel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const footerViewModel = useMemo(() => new FooterViewModel(router), [router]);

  return (
    <html lang="en">
      <head>
        <title>JsonUI Documentation</title>
        <meta name="description" content="JSON-driven UI framework for iOS, Android, and Web" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          {children}
          <Footer data={footerViewModel.data} />
        </LanguageProvider>
      </body>
    </html>
  );
}
