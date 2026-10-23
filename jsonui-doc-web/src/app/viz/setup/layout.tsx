import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Set up jui viz — JsonUI`,
  description: `Install the plugin, start the server and choose the language of the page. Then keep it up to date, remove it, or fix it when it does not work.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
