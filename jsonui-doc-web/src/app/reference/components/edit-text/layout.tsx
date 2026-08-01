import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `EditText — JsonUI`,
  description: `Android-native naming alias for TextField. Identical runtime behavior; exists to preserve attribute-name familiarity for Android engineers migrating from XML…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
