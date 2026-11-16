import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Blur — JsonUI`,
  description: `Applies a platform-native blur effect (iOS UIBlurEffect / Android RenderEffect / Web CSS backdrop-filter) to everything behind this view.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
