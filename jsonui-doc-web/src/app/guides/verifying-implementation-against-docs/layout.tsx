import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Verifying implementation against docs — JsonUI`,
  description: `Set up \`jsonui-doc check\` end to end: declare checks in your config, wire up an adapter for whichever backend framework you're using, run the check locally and…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
