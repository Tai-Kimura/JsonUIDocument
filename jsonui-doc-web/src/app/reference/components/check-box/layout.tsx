import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `CheckBox — JsonUI`,
  description: `Binary checkbox. Unlike Radio, CheckBoxes are independent even when visually grouped — each maintains its own state.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
