// prebuild: build a bilingual search index from every live screen spec.
//
// Walks docs/screens/json/**/*.spec.json, looks up each spec's namespace in
// strings.json (directory_basename of layoutFile), extracts title + lead +
// every section heading's copy in en+ja, and emits the result to
// public/search-index.json.
//
// The SearchModal (Phase 2, not yet built) will load this file on first
// open and feed it into FlexSearch. Keeping the index out of the component
// tree means we only pay the JSON size over the wire when the user actually
// opens search.
//
// Rules:
//   - Only specs whose layoutFile has matching layout JSON AND a namespace
//     entry in strings.json make it into the index. Specs without copy yet
//     are silently skipped (they cannot be searched for anyway).
//   - URL is derived: /<directory>/<basename> — same shape the app router
//     uses. Tab-index layouts (`learn_index`, etc.) and home itself are
//     skipped: they are not standalone URLs.
//   - Section headings come from `section_*_heading` keys in the layout's
//     namespace. Order is taken from the layout file's structural order.

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { resolve, join, relative } from "node:path";

type StringValue = string | { en?: string; ja?: string };
type StringsFile = Record<string, Record<string, StringValue>>;

type Spec = {
  metadata?: { name?: string; layoutFile?: string };
};

type IndexEntry = {
  url: string;
  namespace: string;
  title: { en: string; ja: string };
  lead?: { en: string; ja: string };
  readTime?: { en: string; ja: string };
  sections: Array<{ anchor: string; heading: { en: string; ja: string } }>;
};

const PROJECT_ROOT = resolve(__dirname, "..", "..");
const stringsPath = resolve(PROJECT_ROOT, "docs", "screens", "layouts", "Resources", "strings.json");
const specsRoot = resolve(PROJECT_ROOT, "docs", "screens", "json");
const layoutsRoot = resolve(PROJECT_ROOT, "docs", "screens", "layouts");
const outPath = resolve(__dirname, "..", "public", "search-index.json");

const strings: StringsFile = JSON.parse(readFileSync(stringsPath, "utf8"));

function resolveText(v: StringValue | undefined): { en: string; ja: string } | undefined {
  if (v === undefined) return undefined;
  if (typeof v === "string") return { en: v, ja: v };
  if (v.en && v.ja) return { en: v.en, ja: v.ja };
  return undefined;
}

function walkSpecs(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walkSpecs(p, out);
    else if (entry.endsWith(".spec.json")) out.push(p);
  }
  return out;
}

function namespaceOf(layoutFile: string): string {
  // layoutFile like 'learn/installation' → 'learn_installation'.
  // Root files ('home') → 'home'.
  return layoutFile.replace(/\//g, "_").replace(/-/g, "_");
}

// A handful of pages live at a URL that differs from their layout basename
// (because the PascalCased basename would collide with a runtime import —
// the React component name is the classic case). Keep the overrides
// centralised here so the search index, sitemap, and per-page metadata all
// resolve the same URL the router actually serves.
const URL_OVERRIDES: Record<string, string> = {
  "platforms/rjui": "/platforms/react",
};

function urlOf(layoutFile: string): string | null {
  // Tab-index layouts and home are not standalone URLs.
  if (
    layoutFile === "home" ||
    /_index$/.test(layoutFile) ||
    /\/index$/.test(layoutFile) ||
    layoutFile === "index"
  ) {
    return null;
  }
  if (URL_OVERRIDES[layoutFile]) return URL_OVERRIDES[layoutFile];
  return `/${layoutFile}`;
}

function extractSectionAnchors(layoutPath: string): string[] {
  // Read the layout JSON and pull ids that look like section_* (author
  // convention in this project). Order = document order.
  const raw = JSON.parse(readFileSync(layoutPath, "utf8"));
  const anchors: string[] = [];
  function walk(node: unknown): void {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!node || typeof node !== "object") return;
    const obj = node as Record<string, unknown>;
    if (typeof obj.id === "string" && obj.id.startsWith("section_")) {
      anchors.push(obj.id);
    }
    for (const v of Object.values(obj)) walk(v);
  }
  walk(raw);
  return anchors;
}

const entries: IndexEntry[] = [];
const skipped: Array<{ spec: string; reason: string }> = [];

for (const specPath of walkSpecs(specsRoot)) {
  const spec: Spec = JSON.parse(readFileSync(specPath, "utf8"));
  const layoutFile = spec.metadata?.layoutFile;
  if (!layoutFile) {
    skipped.push({ spec: relative(PROJECT_ROOT, specPath), reason: "no layoutFile in metadata" });
    continue;
  }
  const url = urlOf(layoutFile);
  if (url === null) {
    // home + tab indexes: not standalone URLs, skip silently.
    continue;
  }
  const ns = namespaceOf(layoutFile);
  const nsEntries = strings[ns];
  if (!nsEntries) {
    skipped.push({ spec: relative(PROJECT_ROOT, specPath), reason: `namespace '${ns}' not in strings.json` });
    continue;
  }
  // Some early pages (installation) used `headline` as the hero title key
  // rather than `title`. Accept either so the index stays page-complete
  // without forcing a strings migration.
  const title = resolveText(nsEntries.title) ?? resolveText(nsEntries.headline);
  if (!title) {
    skipped.push({ spec: relative(PROJECT_ROOT, specPath), reason: `namespace '${ns}' missing title/headline` });
    continue;
  }
  const lead = resolveText(nsEntries.lead) ?? resolveText(nsEntries.subcopy);

  const layoutPath = resolve(layoutsRoot, `${layoutFile}.json`);
  let anchors: string[] = [];
  try {
    anchors = extractSectionAnchors(layoutPath);
  } catch (err) {
    // Layout missing: fine. Just no section anchors.
  }

  const sections: IndexEntry["sections"] = [];
  for (const anchor of anchors) {
    const headingKey = `${anchor}_heading`;
    const heading = resolveText(nsEntries[headingKey]);
    if (heading) sections.push({ anchor, heading });
  }

  entries.push({
    url,
    namespace: ns,
    title,
    lead,
    readTime: resolveText(nsEntries.read_time),
    sections,
  });
}

entries.sort((a, b) => a.url.localeCompare(b.url));

mkdirSync(resolve(__dirname, "..", "public"), { recursive: true });
writeFileSync(outPath, JSON.stringify({ version: 1, entries }, null, 2) + "\n");

console.log(
  `build-search-index: ${entries.length} entries, ` +
    `${entries.reduce((acc, e) => acc + e.sections.length, 0)} section headings, ` +
    `${skipped.length} skipped`,
);
for (const s of skipped) {
  console.log(`  skipped: ${s.spec} (${s.reason})`);
}
