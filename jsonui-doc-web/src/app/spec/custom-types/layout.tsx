import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Custom types — JsonUI`,
  description: `Pattern 4 of spec splitting, in detail. Declare reusable row / entry shapes once inside \`dataFlow.customTypes\` and reference them by name (\`[ActivityRow]\`)…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
