import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `jsonui-test-runner — JsonUI`,
  description: `JSON-authored tests that drive a real running app. Screen tests, flow tests, and user-action tests — all in the same 'lookup + interact + assert' DSL, executed…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
