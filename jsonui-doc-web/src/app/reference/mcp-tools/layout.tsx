import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `MCP tool API — JsonUI`,
  description: `All 33 MCP tools, grouped A–E (Lookup / Validation / Generation / Build + Runtime / API Model Discovery), with their input schemas, return shapes, and one-line…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
