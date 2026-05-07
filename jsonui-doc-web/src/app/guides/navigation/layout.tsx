import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `Navigation between screens — JsonUI`,
  description: `Wire onNavigate in the ViewModel to each platform's router: Next.js App Router on web, NavigationStack / UINavigationController on iOS, Jetpack Compose…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
