import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `ViewModel-owned state — JsonUI`,
  description: `The Layout has no state. Every mutation — counter increments, form inputs, toggle flips — flows through the ViewModel. Here is why that constraint makes the…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
