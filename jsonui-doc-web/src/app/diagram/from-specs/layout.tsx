import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Drawn from the specs, checked against the flow tests — JsonUI`,
  description: `Since jsonui-cli 1.8.66 the screen-transition diagram is drawn from one source — what each screen spec declares under \`transitions[].destination\` — and the…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
