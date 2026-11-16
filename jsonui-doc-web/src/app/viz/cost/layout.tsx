import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Cost and migration plans — JsonUI`,
  description: `Estimate what your declared infrastructure costs a month, read it hour by hour in the server room's cost view, and price a migration plan step by step before…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
