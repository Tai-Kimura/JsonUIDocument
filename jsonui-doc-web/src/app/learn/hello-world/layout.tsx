import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Hello, JsonUI — your first screen in five minutes — JsonUI`,
  description: `Install the CLI, scaffold a project, \`jui init\`, author one JSON, \`jui build\` + \`jui verify\`, then wire a platform-specific ViewModel and run. Five…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
