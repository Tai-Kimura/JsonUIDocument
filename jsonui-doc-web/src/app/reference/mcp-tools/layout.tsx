import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `MCP tool API — JsonUI`,
  description: `All 57 MCP tools, grouped A–H (Lookup / Validation / Generation / Build + Runtime / API Model Discovery / Test Tooling / jui viz / Server room), with their…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
