import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Indicator — JsonUI`,
  description: `Activity spinner for indefinite, short-duration waits (loading, network fetching). Always animated; has no progress value.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
