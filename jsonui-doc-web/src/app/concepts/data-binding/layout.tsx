import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Data binding as contract — JsonUI`,
  description: `@{variable} is not a template expression — it is a typed binding to a ViewModel field. No logic in the layout, ever. Here is what that means in practice.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
