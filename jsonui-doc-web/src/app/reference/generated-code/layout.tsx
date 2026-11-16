import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Generated code — JsonUI`,
  description: `What \`jui build\` writes into your repository, what it promises about that code, and every knob that changes it. Generated views are size-bounded on purpose —…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
