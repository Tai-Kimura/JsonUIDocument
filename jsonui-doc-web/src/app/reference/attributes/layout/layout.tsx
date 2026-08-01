import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Layout attributes — JsonUI`,
  description: `Layout attributes define the size and axis behavior of a component. They apply to every component regardless of type.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
