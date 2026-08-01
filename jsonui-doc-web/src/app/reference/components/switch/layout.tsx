import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Switch — JsonUI`,
  description: `Binary ON/OFF control with an animated toggle thumb. Matches the host platform visually (iOS capsule / Android Material / Web custom).`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
