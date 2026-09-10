import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Flow diagram — JsonUI`,
  description: `The screen-transition diagram is drawn from what the screen specs declare, and the flow tests are checked against it.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
