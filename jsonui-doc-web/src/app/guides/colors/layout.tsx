import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Colors and theming — JsonUI`,
  description: `One colors.json feeds every platform's colour handling: the palette per mode, the generated ColorManager, and — on web — the Tailwind \`@theme\` block. \`jui…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
