import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Your first screen — JsonUI`,
  description: `Build a 'Recent Activity' screen from scratch: a header with a language toggle, a hero with welcome copy and a refresh button, and a scrollable collection of…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
