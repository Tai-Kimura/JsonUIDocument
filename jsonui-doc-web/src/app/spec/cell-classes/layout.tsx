import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Collection cell classes — JsonUI`,
  description: `Pattern 5 of spec splitting, in detail. When a Collection needs more than one cell layout, or when the same cell shape shows up in two or more Collections,…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
