import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Hot reload everywhere — JsonUI`,
  description: `One JSON edit, three simulators update in under a second. On web the React dev server you already run does it — Next.js dev in the default setup, but any dev…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
