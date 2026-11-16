import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Developer menu — JsonUI`,
  description: `DeveloperMenuContainer is a DEBUG-only wrapper shipped with SwiftJsonUI and KotlinJsonUI. You put it around your app's root content, and in DEBUG builds it…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
