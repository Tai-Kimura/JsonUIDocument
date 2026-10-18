import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `jui viz: watch your agents work — JsonUI`,
  description: `\`jui viz\` shows the Claude Code sessions and subagents running on your machine as rooms and robots in the browser. Each project folder gets a room, and each…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
