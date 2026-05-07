import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `KotlinJsonUI — JsonUI`,
  description: `Android native output from one spec. kjui is the CLI, Dynamic mode mirrors sjui's story, and output is idiomatic Kotlin — Jetpack Compose by default, XML Views…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
