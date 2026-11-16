import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Adding a new language — JsonUI`,
  description: `One strings.json feeds three different output shapes: a Swift StringManager struct, an Android strings.xml resource tree, and a reactive TypeScript…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
