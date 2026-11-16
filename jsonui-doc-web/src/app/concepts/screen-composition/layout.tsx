import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Screen composition — JsonUI`,
  description: `Three ways to put one Layout JSON inside another: \`include\` lets the codegen inline a sub-layout under the same ViewModel; \`TabView.tabs[].include\` runs…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
