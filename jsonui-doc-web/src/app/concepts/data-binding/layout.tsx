import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Data binding as contract — JsonUI`,
  description: `\`@{variable}\` is how a layout JSON names a field on its ViewModel. What the field holds, how strongly it is type-checked, and whether the widget can write back…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
