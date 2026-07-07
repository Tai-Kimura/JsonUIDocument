import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Data models from OpenAPI — JsonUI`,
  description: `\`jui build\` reads OpenAPI files in \`docs/api/\` and emits two layers per platform: a fully regenerated **DTO** (wire-shape 1:1) plus a one-time **Domain…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
