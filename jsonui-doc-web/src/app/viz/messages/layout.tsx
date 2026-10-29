import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Send messages between sessions with jui viz — JsonUI`,
  description: `From jsonui-cli 2.3.26, \`jui viz message\` sends a message from one session on your machine to another: Claude Code to Codex, Codex to Claude Code, or between…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
