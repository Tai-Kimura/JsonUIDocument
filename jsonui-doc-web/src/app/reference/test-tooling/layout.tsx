import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Test tooling reference — JsonUI`,
  description: `Two tables that answer 'does this feature work on my platform?' and 'which repo owns this?'. The feature support matrix lists where the three drivers agree and…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
