import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `The room and its robots — JsonUI`,
  description: `Each project is a room and each Claude Code session is a robot at a desk. This article shows how to move between rooms, tell the robots apart, read what each…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
