import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Button — JsonUI`,
  description: `Interactive component that triggers a ViewModel event handler on tap. The visual is determined by \`style\` and child content; the tap target is always the full…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
