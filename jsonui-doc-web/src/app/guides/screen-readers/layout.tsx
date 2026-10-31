import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Screen readers — JsonUI`,
  description: `Two attributes tell a screen reader what a layout cannot say by itself, on all three platforms from jsonui-cli 2.3.38: \`accessibilityLabel\` names a control by…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
