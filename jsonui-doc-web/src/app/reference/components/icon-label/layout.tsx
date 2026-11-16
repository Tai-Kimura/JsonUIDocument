import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `IconLabel — JsonUI`,
  description: `Label with an icon beside it. The \`selected\` binding switches the icon between \`icon_off\` and \`icon_on\`, and the text color between \`fontColor\` and…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
