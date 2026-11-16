import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Why spec-first — JsonUI`,
  description: `The spec is not documentation. It is the contract the design surface, the engineer, and the agent all sign. Every other artifact — Layout JSON, ViewModel base…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
