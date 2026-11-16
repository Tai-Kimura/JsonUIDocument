import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Writing layouts — JsonUI`,
  description: `Layout JSON is the single biggest file family you author in a JsonUI project, and a handful of idioms make it much easier to read. The same JSON ships to iOS…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
