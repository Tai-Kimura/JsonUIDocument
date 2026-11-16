import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `TabView — JsonUI`,
  description: `Tab bar with multiple pages. Each tab's content is a separate child view; only the active tab's content is in the foreground.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
