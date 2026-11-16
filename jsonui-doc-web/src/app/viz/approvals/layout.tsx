import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Answer permissions and questions from the browser — JsonUI`,
  description: `Set up jui viz so that Claude Code's permission prompts and multiple-choice questions show as cards on the page, and answer them there instead of in the…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
