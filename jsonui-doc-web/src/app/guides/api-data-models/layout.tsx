import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `API data models — JsonUI`,
  description: `Cookbook companion to /concepts/data-models-from-openapi. Fifteen short recipes covering setup, the add-schema/build/proxy loop, path + schema filter syntax,…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
