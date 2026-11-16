import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Initial state and the state bridge — JsonUI`,
  description: `A test can start a screen with the data it needs. The values in \`initialState\` go into the screen's Data when the app launches. The app reports which ones it…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
