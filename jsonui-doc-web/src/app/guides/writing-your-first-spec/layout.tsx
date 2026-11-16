import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Writing your first spec — JsonUI`,
  description: `A hands-on walk-through of a complete screen_spec.json. We will author a Counter screen from scratch — check your setup, declare state and handlers, then run…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
