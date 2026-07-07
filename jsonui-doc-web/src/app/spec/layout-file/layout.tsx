import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Separating the layout file — JsonUI`,
  description: `Pattern 1 of spec splitting, in detail. Move the visual tree out of the spec into a sibling Layout JSON, point \`metadata.layoutFile\` at it, and let…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
