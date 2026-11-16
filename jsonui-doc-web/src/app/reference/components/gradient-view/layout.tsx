import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `GradientView — JsonUI`,
  description: `View with a linear gradient background. For simple 2-stop gradients, the \`gradient\` attribute on a regular View is sufficient — use GradientView when…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
