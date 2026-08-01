import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Responsive attributes — JsonUI`,
  description: `Responsive attributes pick attribute values based on the host's size class and orientation. The same Layout JSON renders differently on iPhone, iPad, and…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
