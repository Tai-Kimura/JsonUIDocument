import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Parent + sub specs — JsonUI`,
  description: `Pattern 2 of spec splitting, in detail. One screen, several spec files: since jsonui-cli 1.7.6 the parent is a pure container — it names the sub-specs and…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
