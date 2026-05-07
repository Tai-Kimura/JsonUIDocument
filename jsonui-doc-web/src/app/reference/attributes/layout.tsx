import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Attribute reference — JsonUI`,
  description: `Every attribute on every View, Button, Collection, TabView, etc. Structured from the same \`attribute_definitions.json\` the MCP server serves, so what you read…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
