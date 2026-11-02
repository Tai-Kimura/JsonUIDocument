import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Turn Slack messages into tasks with jui viz — JsonUI`,
  description: `From jsonui-cli 2.4.0, \`jui viz\` can fetch messages from Slack channels, mask secrets on your machine, sort each message into one of your projects, and have a…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
