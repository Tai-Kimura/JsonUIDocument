import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Watch Codex sessions in jui viz — JsonUI`,
  description: `From jsonui-cli 2.3.25, jui viz shows the Codex sessions on your machine beside the Claude Code ones, in the same rooms. You can answer Codex's permission…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
