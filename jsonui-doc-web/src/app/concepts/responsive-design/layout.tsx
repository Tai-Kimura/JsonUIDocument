import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Responsive design — JsonUI`,
  description: `One Layout JSON adapts to phones, tablets, and split-screen via the responsive block. Six size-class keys, deterministic priority order, and per-platform implementation across SwiftUI, Compose, and Tailwind…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
