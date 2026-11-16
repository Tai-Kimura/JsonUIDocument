import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Branch tests — JsonUI`,
  description: `One branchContracts declaration, three platforms of real-stack unit tests: \`jsonui-test generate branch-tests\` emits vitest for web, JUnit4 (Robolectric) for…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
