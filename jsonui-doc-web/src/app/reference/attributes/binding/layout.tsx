import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Binding attributes — JsonUI`,
  description: `Binding attributes link JSON values to ViewModel state via the \`@{...}\` syntax. Three kinds: value binding, string resolution, and event binding.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
