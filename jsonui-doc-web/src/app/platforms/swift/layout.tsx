import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `SwiftJsonUI — JsonUI`,
  description: `iOS native output from one spec — no runtime interpreter, no Swift-Kotlin-JS interop layer. sjui is the CLI, Dynamic mode is the hot-reload story, and the…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
