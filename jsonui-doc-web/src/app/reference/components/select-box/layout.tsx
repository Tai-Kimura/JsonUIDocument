import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `SelectBox — JsonUI`,
  description: `Picker for choosing one value from a discrete list, or a date/time picker when \`selectItemType\` is \`Date\` (\`datePickerMode\` then picks date / time /…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
