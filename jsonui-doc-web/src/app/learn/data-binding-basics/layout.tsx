import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Data binding basics — JsonUI`,
  description: `Build a working Counter screen from the ground up, layering in the three kinds of @{binding} one at a time: value, visibility, event. When you finish you have…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
