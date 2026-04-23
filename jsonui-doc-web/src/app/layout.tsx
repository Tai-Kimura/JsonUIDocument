import type { Metadata } from "next";
import "./globals.css";

import { ChromeMount } from "@/components/chrome/ChromeMount";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jsonui.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "JsonUI — Declarative cross-platform UI",
  description:
    "Author screens once in JSON. JsonUI generates SwiftUI, Compose, and React with ViewModels, bindings, and localization built in.",
  openGraph: {
    title: "JsonUI — Declarative cross-platform UI",
    description:
      "Author screens once in JSON. JsonUI generates SwiftUI, Compose, and React with ViewModels, bindings, and localization built in.",
    url: SITE_URL,
    siteName: "JsonUI",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "JsonUI — Declarative cross-platform UI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JsonUI — Declarative cross-platform UI",
    description:
      "Author screens once in JSON. JsonUI generates SwiftUI, Compose, and React with ViewModels, bindings, and localization built in.",
    images: ["/og-image.png"],
  },
};

/**
 * RootLayout — the minimal Next.js shell that mounts the spec-driven
 * Chrome (TopBar + Sidebar generated from docs/screens/layouts/chrome.json)
 * alongside the page content. CSS in globals.css reserves top padding for
 * the topbar and left padding for the sidebar on the `.site-main` wrapper.
 *
 * RootLayout stays a Server Component so per-page SSR continues to work;
 * ChromeMount is the "use client" boundary for the chrome ViewModel.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ChromeMount />
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
