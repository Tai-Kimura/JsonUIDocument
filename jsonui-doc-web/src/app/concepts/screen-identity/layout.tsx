import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Screen identity and navigation assertion — JsonUI`,
  description: `A test should be able to say 'we are on the my-page screen' without knowing a single element inside it. That needs one shared answer to 'what is a screen, and…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
