import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Embed — JsonUI`,
  description: `Embeds another screen as a region of this layout. The embedded screen owns its own ViewModel — independent from the parent. Use for tablet master/detail or…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
