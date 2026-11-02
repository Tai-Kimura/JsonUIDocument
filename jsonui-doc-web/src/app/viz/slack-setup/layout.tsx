import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Set up the Slack intake, step by step — JsonUI`,
  description: `This page walks through connecting \`jui viz\` to Slack: making the Slack app, the scopes and tokens, Socket Mode (from jsonui-cli 2.5.0), slack.json, the…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
