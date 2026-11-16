import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Contract gaps — JsonUI`,
  description: `Branch contracts say what a method does for the outcomes they list. \`jsonui-test contracts coverage\` asks the reverse: of every response status the OpenAPI…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
