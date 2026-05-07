import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Install JsonUI in one line — JsonUI`,
  description: `One command installs the CLI, the MCP server, and the agent pack into Claude Code.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
