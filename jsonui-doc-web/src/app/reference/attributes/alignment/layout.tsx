import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Alignment attributes — JsonUI`,
  description: `Alignment attributes control a component's position relative to its parent and siblings. Most come from Android's RelativeLayout vocabulary.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
