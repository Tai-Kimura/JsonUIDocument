import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `jsonui-mcp-server — JsonUI`,
  description: `Twenty-nine typed tools grouped into four families. The agents use them to inspect any JsonUI project — specs, layouts, components, builds, runtime sync —…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
