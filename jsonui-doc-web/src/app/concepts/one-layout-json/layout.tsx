import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `One Layout JSON per screen — JsonUI`,
  description: `The same file drives SwiftUI, Jetpack Compose, and React. Not a lowest-common-denominator intermediate format — the generator emits each platform's idiomatic…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
