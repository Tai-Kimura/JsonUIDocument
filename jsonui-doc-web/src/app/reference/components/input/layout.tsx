import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Input — JsonUI`,
  description: `Web-native naming alias for TextField, mirroring HTML \`<input>\`. Identical runtime behavior.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
