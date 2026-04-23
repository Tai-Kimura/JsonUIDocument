import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: `CLI command reference — JsonUI`,
  description: `Every jui / sjui / kjui / rjui / jsonui-test / jsonui-doc subcommand with its flags, environment variables, and exit codes. Generated from the \`--help\` output…`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
