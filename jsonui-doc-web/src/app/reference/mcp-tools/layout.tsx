import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `MCP tool API — JsonUI`,
  description: `All 42 MCP tools, grouped A–F (Lookup / Validation / Generation / Build + Runtime / API Model Discovery / Test Tooling), with their input schemas, return…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
