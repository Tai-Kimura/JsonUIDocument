import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Radio — JsonUI`,
  description: `Mutually exclusive selection within a group. Behaves as a standalone radio button; grouping is established via shared \`group\` attribute.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
