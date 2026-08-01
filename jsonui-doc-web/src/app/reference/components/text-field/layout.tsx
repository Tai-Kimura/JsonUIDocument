import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `TextField — JsonUI`,
  description: `Single-line text input for short user-entered strings. For multi-line input use TextView. For secure input toggle \`secure: true\`.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
