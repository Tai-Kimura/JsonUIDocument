import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `jui viz: watch your agents work — JsonUI`,
  description: `\`jui viz\` shows the Claude Code sessions and subagents running on your machine (from 2.3.25 the Codex sessions too) as rooms and robots in the browser. Start…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
