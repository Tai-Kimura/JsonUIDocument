import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Panels, cards and boards — JsonUI`,
  description: `What the right panel, a robot's card, the spec and task boards, the log and the header show, and how to move around them.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
