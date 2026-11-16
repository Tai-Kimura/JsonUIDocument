import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `SafeAreaView — JsonUI`,
  description: `View that respects the host platform's safe area (notch, home indicator, status bar). Typically placed at the root of a screen.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
