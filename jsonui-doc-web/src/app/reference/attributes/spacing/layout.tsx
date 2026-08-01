import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Spacing attributes — JsonUI`,
  description: `Spacing attributes control empty space around and inside a component. Margins are outside the component; paddings are inside.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
