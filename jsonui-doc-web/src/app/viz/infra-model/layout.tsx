import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Writing the infra model — JsonUI`,
  description: `What to put in docs/infra so the server room can draw it: the files, the fields, what must never be written, the commands that check the model and draft it,…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
