import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `ScrollView — JsonUI`,
  description: `Vertically (default) or horizontally scrollable container. Children that exceed the visible bounds become scrollable.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
