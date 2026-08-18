import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Web framework adapters — JsonUI`,
  description: `Since jsonui-cli 1.6.7, every web-framework-specific string rjui emits — the RSC directive, the Link component wiring, the router import, hook and type — is…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
