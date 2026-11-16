import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Long prose: texts files — JsonUI`,
  description: `A spec's prose fields — \`description\`, \`notes\`, a unit case's \`intent\`, and the other free-text fields listed below — can point into a YAML file beside the…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
