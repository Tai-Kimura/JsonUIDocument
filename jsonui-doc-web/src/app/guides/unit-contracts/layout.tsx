import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Unit contracts — JsonUI`,
  description: `The spec declares which unit test cases exist and on which platforms; \`jsonui-test generate unit-stubs\` writes the missing ones as failing stubs, and \`--check\`…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
