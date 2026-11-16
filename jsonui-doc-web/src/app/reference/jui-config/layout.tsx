import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `jui.config.json — JsonUI`,
  description: `The keys the toolchain reads from jui.config.json that a project most often sets, in one place: core directories, platform roots, build normalization, API…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
