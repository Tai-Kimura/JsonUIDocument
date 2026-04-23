import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Hello, JsonUI — in five minutes — JsonUI`,
  description: `Install the CLI, scaffold a project, and render text on screen. Pick your stack and follow the five steps below.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
