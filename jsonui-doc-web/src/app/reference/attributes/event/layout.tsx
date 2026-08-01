import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Event attributes — JsonUI`,
  description: `Event attributes bind user interactions to ViewModel methods. All are optional; their omission disables the corresponding interaction.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
