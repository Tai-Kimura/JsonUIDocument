import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Learn JsonUI — JsonUI`,
  description: `Start with a 5-minute one-liner install and work through the hello-world tutorial in your platform of choice.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
