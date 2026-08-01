import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `The toolchain — JsonUI`,
  description: `CLI, MCP server, test runner, and the agent pack that drives Claude Code. One install, all included.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
