import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `The anatomy of a screen spec — JsonUI`,
  description: `A field-by-field walk through screen_spec.json — every top-level section, what it declares, and how it cross-references the others.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
