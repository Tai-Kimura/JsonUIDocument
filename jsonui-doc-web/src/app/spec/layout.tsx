import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `The spec layer — JsonUI`,
  description: `screen_spec.json is the contract everything else is generated from. These articles cover its anatomy, the six ways to split one, and how validation keeps spec…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
