// Next.js 14+ convention — this file is picked up and served at /sitemap.xml.
// Source of truth is the same search-index.json the SearchModal consumes,
// so "live URL" stays derived from a single prebuild artifact.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { MetadataRoute } from "next";

// Static-export mode (output: "export") requires this opt-in.
export const dynamic = "force-static";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jsonui.dev";

interface IndexEntry {
  url: string;
  title: { en: string; ja: string };
}

interface SearchIndex {
  version: number;
  entries: IndexEntry[];
}

export default function sitemap(): MetadataRoute.Sitemap {
  let entries: IndexEntry[] = [];
  try {
    const p = resolve(process.cwd(), "public", "search-index.json");
    const idx: SearchIndex = JSON.parse(readFileSync(p, "utf8"));
    entries = idx.entries;
  } catch {
    // prebuild wasn't run yet — return just the home.
  }

  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...entries.map((e) => ({
      url: `${SITE_URL}${e.url}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
