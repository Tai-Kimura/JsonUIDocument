import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Validation + drift detection — JsonUI`,
  description: `Two tools guard specs, and they check different things. \`jsonui-doc validate spec\` checks the spec file on its own — schema, required fields, cross-references…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
