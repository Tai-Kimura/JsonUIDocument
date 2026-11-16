import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Progress — JsonUI`,
  description: `Linear or circular progress indicator. Set \`progress\` (0.0–1.0) for determinate progress.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
