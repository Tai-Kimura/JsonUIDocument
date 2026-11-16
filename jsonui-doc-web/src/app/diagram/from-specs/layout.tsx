import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Drawn from the specs, checked against the flow tests — JsonUI`,
  description: `The screen-transition diagram is drawn from one source — what each screen spec declares under \`transitions[].destination\` — and the flow tests are checked…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
