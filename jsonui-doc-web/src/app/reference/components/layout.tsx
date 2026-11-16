import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Component reference — JsonUI`,
  description: `Every built-in component plus the custom components this site registers (CodeBlock, TableOfContents). Each entry is a small card: name, one-line role,…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
