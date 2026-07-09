import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Mocking APIs in tests — JsonUI`,
  description: `Test a screen without its backend. jsonui-test generates mock responses from your OpenAPI / Swagger, serves them from a local mock server, and lets each test…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
