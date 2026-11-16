import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `NetworkImage — JsonUI`,
  description: `Image loaded from a URL with automatic caching, placeholder, and error handling.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
