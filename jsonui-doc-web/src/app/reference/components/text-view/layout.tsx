import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `TextView — JsonUI`,
  description: `Multi-line text input for long-form user-entered strings (comments, descriptions, messages). Grows vertically with content unless constrained by \`height\`.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
