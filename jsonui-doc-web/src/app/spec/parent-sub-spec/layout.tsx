import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Parent + sub specs — JsonUI`,
  description: `Pattern 2 of spec splitting, in detail. One screen, multiple spec files — the parent owns the visual tree and the shared types, and each sub owns a slice of…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
