import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Style attributes — JsonUI`,
  description: `Style attributes control visual appearance: background, borders, shadows, corners, and style presets.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
