import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Hot reload everywhere — JsonUI`,
  description: `One JSON edit, three simulators update in under a second. Web is Next.js dev; iOS and Android both run a Dynamic mode that pulls Layout JSON over the network…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
