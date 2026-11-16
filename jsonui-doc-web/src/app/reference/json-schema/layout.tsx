import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `JSON Schema — JsonUI`,
  description: `Where JSON Schema fits in JsonUI today: the spec-file schemas ship inside the jsonui-helper VS Code extension, Layout JSON is validated by the toolchain…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
