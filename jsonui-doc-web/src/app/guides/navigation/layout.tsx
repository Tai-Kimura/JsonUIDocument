import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Navigation between screens — JsonUI`,
  description: `Navigation in JsonUI is a platform-external contract: the spec declares intent (transitions + onNavigate method), the generator emits a typed callback stub in…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
