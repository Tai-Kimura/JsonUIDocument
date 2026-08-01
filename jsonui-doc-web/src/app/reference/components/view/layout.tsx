import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `View — JsonUI`,
  description: `Generic container that arranges child components vertically or horizontally. The most-used component — every JsonUI screen has a View at the root of each…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
