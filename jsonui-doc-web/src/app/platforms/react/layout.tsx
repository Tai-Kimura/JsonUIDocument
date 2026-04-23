import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `ReactJsonUI — JsonUI`,
  description: `The web target. rjui is the CLI, Next.js App Router is the host, Tailwind is the styling layer. The documentation site you are reading right now is built with…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
