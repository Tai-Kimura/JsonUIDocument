import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Referencing the API canon from a spec — JsonUI`,
  description: `A dataFlow method that declares an \`endpoint\` is already pointing at an operation in your OpenAPI documents. It can reference that operation instead of…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
