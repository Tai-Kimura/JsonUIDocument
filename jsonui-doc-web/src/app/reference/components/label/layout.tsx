import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Label — JsonUI`,
  description: `Display component for rendering a single-line or multi-line text string. Label is read-only; use TextField or TextView for user input.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
