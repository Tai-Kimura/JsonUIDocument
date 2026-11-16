import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Talk, prompts and notifications — JsonUI`,
  description: `Send a prompt to a session from its robot card, attach files, stop or clock out a session, read the robots' conversations, and get a browser notification when…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
