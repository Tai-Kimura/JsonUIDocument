import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Misc attributes — JsonUI`,
  description: `Identity, metadata, composition, and debug attributes that do not fit other categories. Mostly auxiliary, not affecting layout or behavior.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
