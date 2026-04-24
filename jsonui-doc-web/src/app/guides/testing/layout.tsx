import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Writing screen tests — JsonUI`,
  description: `JsonUI tests are JSON files — same language as your layouts. One file describes a screen or a flow, and a per-platform driver (XCUITest for iOS, Espresso for…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
