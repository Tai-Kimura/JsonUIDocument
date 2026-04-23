import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Writing screen tests — JsonUI`,
  description: `JSON tests drive your real app. Author tests/screens/*.test.json files, run them with the jsonui-test runner, and assert layout + navigation + state on…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
