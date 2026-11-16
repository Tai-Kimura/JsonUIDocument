import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Branch contracts — JsonUI`,
  description: `A screen spec can declare each method's branches as a machine-checkable table. The optional \`branchContracts\` section keeps those declarations inside a closed…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
