import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Adding a new language — JsonUI`,
  description: `One strings.json, three platforms, any number of locales. Add en + ja + your new locale side by side; StringManager auto-resolves per-file and the generator…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
