import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Agents for Claude / Codex — JsonUI`,
  description: `Nine agents + eleven skills + five rules that teach Claude Code (and Codex) how to run the spec-first JsonUI workflow. Install once, and every project that…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
