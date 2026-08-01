import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Web — JsonUI`,
  description: `Embedded web content via WKWebView (iOS), WebView (Android), \`<iframe>\` (Web). Used for embedded maps, third-party widgets, HTML previews.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
