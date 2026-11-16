import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Watch Codex sessions in jui viz — JsonUI`,
  description: `jui viz shows the Codex sessions on your machine beside the Claude Code ones, in the same rooms. You can answer Codex's permission requests from the page, stop…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
