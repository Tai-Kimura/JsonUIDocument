import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Long prose: texts files — JsonUI`,
  description: `A spec's \`description\`, \`notes\` and case \`intent\` can point into a YAML file beside the spec instead of holding the text inline. The text there is written as…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
