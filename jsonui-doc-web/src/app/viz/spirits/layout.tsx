import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Skill spirits and your own 3D models — JsonUI`,
  description: `While a session uses a skill, a spirit stands behind its robot. This article shows what you see, the two bundled models, and how to add your own .glb model for…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
