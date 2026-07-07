import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Five ways to split a spec — JsonUI`,
  description: `A single screen_spec.json is fine until the file passes 300 lines, or until two screens need to share the same shape. This article is the map: five established…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
