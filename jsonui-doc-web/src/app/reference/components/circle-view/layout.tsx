import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `CircleView — JsonUI`,
  description: `Circular container. Equivalent to a View with \`cornerRadius: width/2\` and clipping, but guarantees a perfect circle regardless of aspect.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
