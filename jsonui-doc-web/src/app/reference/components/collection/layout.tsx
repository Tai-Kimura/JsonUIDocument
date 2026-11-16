import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Collection — JsonUI`,
  description: `Virtualized list/grid for dynamic arrays. Renders only visible items. Supports vertical/horizontal lists, multi-column grids, section headers, paging, and lazy…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
