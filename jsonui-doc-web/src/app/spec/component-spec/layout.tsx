import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Component specs — JsonUI`,
  description: `Pattern 3 of spec splitting, in detail. When a custom UI shows up on two or more screens, extract its contract into…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
