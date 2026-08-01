import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Three platforms, one spec — JsonUI`,
  description: `The same screen_spec.json renders as SwiftUI/UIKit on iOS, Compose/XML on Android, and Next.js/React on web.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
