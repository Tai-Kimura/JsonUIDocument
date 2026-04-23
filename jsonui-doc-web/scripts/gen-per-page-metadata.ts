// Generate a Next.js server-side `layout.tsx` next to every content `page.tsx`,
// each one exporting a `Metadata` object with the page's title + description
// derived from search-index.json. The pages themselves stay "use client"
// because they need the router; the sibling layout.tsx is a pure passthrough
// that Next.js composes in at render time.
//
// Output path per page: src/app/<path>/layout.tsx
// Source data: public/search-index.json (produced by scripts/build-search-index.ts)
//
// Idempotent: if layout.tsx already exists with the same frontmatter shape,
// we overwrite only the metadata object; any extra wrapper wiring stays.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { mkdirSync } from "node:fs";

interface IndexEntry {
  url: string;
  title: { en: string; ja: string };
  lead?: { en: string; ja: string };
}

interface SearchIndex {
  version: number;
  entries: IndexEntry[];
}

const PROJECT = resolve(__dirname, "..");
const indexPath = join(PROJECT, "public", "search-index.json");
const appRoot = join(PROJECT, "src", "app");

const idx: SearchIndex = JSON.parse(readFileSync(indexPath, "utf8"));

// Truncate a description to ~160 chars (search-engine sweet spot).
function truncate(s: string, n = 160): string {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  const lastSpace = cut.lastIndexOf(" ");
  return cut.slice(0, lastSpace > 80 ? lastSpace : n) + "…";
}

function layoutSource(title: string, description: string): string {
  // Escape backticks and backslashes inside template-string context.
  const escTitle = title.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
  const escDescription = description.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
  return `import type { Metadata } from "next";

// Per-page metadata. Next.js merges this with RootLayout's metadata at
// render time; we only override title + description so the site-wide
// title template ("... — JsonUI") stays consistent.
export const metadata: Metadata = {
  title: \`${escTitle}\`,
  description: \`${escDescription}\`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
`;
}

let written = 0;
let skipped = 0;

for (const entry of idx.entries) {
  // entry.url like "/learn/installation" → src/app/learn/installation/layout.tsx
  const pageDir = join(appRoot, ...entry.url.split("/").filter(Boolean));
  const pagePath = join(pageDir, "page.tsx");
  const layoutPath = join(pageDir, "layout.tsx");

  if (!existsSync(pagePath)) {
    skipped++;
    console.log(`skip (no page.tsx): ${entry.url}`);
    continue;
  }

  const title = entry.title.en; // English for the HTML <title>; localized title inside the page body.
  const description = entry.lead?.en ? truncate(entry.lead.en) : `JsonUI — ${title}`;

  mkdirSync(pageDir, { recursive: true });
  writeFileSync(layoutPath, layoutSource(`${title} — JsonUI`, description));
  written++;
}

console.log(`gen-per-page-metadata: wrote ${written} layout.tsx, skipped ${skipped}`);
