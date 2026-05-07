import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Building a custom component — JsonUI`,
  description: `Authoring a custom component in JsonUI is a three-layer contract — spec, project whitelist, platform converter — plus a scaffold and a hand-editable component…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
