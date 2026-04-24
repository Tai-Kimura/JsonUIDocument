import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `jsonui-doc — JsonUI`,
  description: `The DOC GEN sub-CLI. Python tool that generates HTML, Markdown, Mermaid diagrams, per-platform test adapters, and Figma-as-HTML from JsonUI screen specs,…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
