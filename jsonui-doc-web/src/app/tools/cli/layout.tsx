import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `jsonui-cli — JsonUI`,
  description: `Six sub-CLIs under one install. jui is the orchestrator — the only binary you routinely type. It delegates to sjui / kjui / rjui for the three platform…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
