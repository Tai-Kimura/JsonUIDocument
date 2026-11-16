import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Slider — JsonUI`,
  description: `Continuous numeric input over a defined range. Can be constrained to discrete values via \`step\`.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
