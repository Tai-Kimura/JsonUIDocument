import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Responsive design — JsonUI`,
  description: `One Layout JSON should not look the same on a 5-inch phone, an 11-inch tablet, and a split-screen iPad. The \`responsive\` block lets a single component swap…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
