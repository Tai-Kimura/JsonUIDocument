import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Segment — JsonUI`,
  description: `Segmented control — mutually exclusive horizontal button group. Shows 2–5 options at a time.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
