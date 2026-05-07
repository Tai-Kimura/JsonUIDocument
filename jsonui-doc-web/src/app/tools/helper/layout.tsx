import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `jsonui-helper (VS Code) — JsonUI`,
  description: `Syntax highlighting + schema-aware completion + preview-on-save for Layout JSON and screen_spec.json. One install away from a JsonUI-native editing experience.…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
