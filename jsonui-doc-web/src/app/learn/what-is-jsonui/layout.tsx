import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `What is JsonUI? — JsonUI`,
  description: `A cross-platform UI framework that treats the screen spec as the source of truth. You write one screen_spec.json + one Layout JSON + one ViewModel, and the…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
