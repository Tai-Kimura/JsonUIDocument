import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `DB schema check (docs/db ⇔ live DB) — JsonUI`,
  description: `Every table under \`docs/db/\` is a schema-only OpenAPI file describing the real database. The builtin db-schema checker in \`jsonui-doc check\` compares those…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
