import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `The server room: open it and find your way around — JsonUI`,
  description: `A guided tour of the 3D view of your infrastructure: how to open it, what the floors, shapes and lines mean, how to move the camera, how to show less, and how…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
