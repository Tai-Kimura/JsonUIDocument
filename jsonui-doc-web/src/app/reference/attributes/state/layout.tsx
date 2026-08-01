import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `State attributes — JsonUI`,
  description: `State attributes control visibility, interaction, and opacity. Most are Boolean; \`visibility\` is tri-state.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
