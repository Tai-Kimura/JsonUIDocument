import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `How-to guides — JsonUI`,
  description: `Task-focused walkthroughs that pick up after the Learn track. Each guide is scoped to one workflow.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
