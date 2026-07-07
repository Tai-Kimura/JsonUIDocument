import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Implementation contract check — JsonUI`,
  description: `Docs (spec / swagger / DB models) are the source of truth for what gets generated. \`jsonui-doc check\` verifies that the real running implementation still…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
