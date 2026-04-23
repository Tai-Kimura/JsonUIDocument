import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Building a custom component — JsonUI`,
  description: `Core JsonUI ships ~28 components; most real apps need one or two custom ones. This guide authors CodeBlock from scratch: spec first, then \`jui g converter…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
