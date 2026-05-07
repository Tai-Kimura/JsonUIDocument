import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `MCP tool API — JsonUI`,
  description: `All 29 MCP tools, grouped A–D (Lookup / Validation / Generation / Build + Runtime), with their input schemas, return shapes, and one-line descriptions.…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
