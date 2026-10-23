import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `jui viz: watch your agents work — JsonUI`,
  description: `jui viz now has a section of its own, with one article per feature. Start with the overview, or jump to the feature you need.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
