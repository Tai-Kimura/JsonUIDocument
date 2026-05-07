import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `JSON Schema — JsonUI`,
  description: `Formal JSON Schema for Layout JSON and screen_spec.json. Downloadable; drop the URL into any JSON-aware editor (VS Code, IntelliJ, Neovim with coc-json) to get…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
