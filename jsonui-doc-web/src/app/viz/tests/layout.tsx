import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Watching tests — JsonUI`,
  description: `Run your JsonUI tests as usual and watch each case go by in jui viz, then read whether the run passed and which spec it belongs to.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
