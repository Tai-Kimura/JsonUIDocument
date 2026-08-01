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

// Section index pages are real URLs (/learn, /spec, …) but only learn/ and
// spec/ have index spec files — the other five are layout + hand-written VM
// only, so the spec walk below cannot see them. Declared explicitly; the
// walk's urlOf() null-skip on */index keeps the two spec-backed ones from
// double-entering.
const SECTION_INDEXES: Array<{ url: string; namespace: string }> = [
  { url: "/learn", namespace: "learn_index" },
  { url: "/guides", namespace: "guides_index" },
  { url: "/concepts", namespace: "concepts_index" },
  { url: "/reference", namespace: "reference_index" },
  { url: "/platforms", namespace: "platforms_index" },
  { url: "/tools", namespace: "tools_index" },
  { url: "/spec", namespace: "spec_index" },
];

// Attribute-reference pages carry no strings.json namespace — their copy
// ships in the runtime JSON that build:attrs writes (prebuild runs
// build:attrs before build:search). Indexed from those files so the 29
// component + 9 category pages are searchable, with per-attribute anchors
// as section headings (searching an attribute name lands on its row).
const ATTR_REF_DIR = resolve(__dirname, "..", "public", "data", "attribute-reference");

type AttrRefRow = { name?: string; anchorId?: string };
type AttrRefFile = {
  title?: string;
  description?: StringValue;
  attributes?: { sections?: Array<{ cells?: { data?: AttrRefRow[] } }> };
};

function attrRefEntries(): IndexEntry[] {
  const out: IndexEntry[] = [];
  for (const kind of ["components", "attributes"] as const) {
    const dir = join(ATTR_REF_DIR, kind);
    let files: string[] = [];
    try {
      files = readdirSync(dir).filter((f) => f.endsWith(".json"));
    } catch {
      console.warn(`build-search-index: ${dir} missing — run build:attrs first; attribute-reference pages will be absent from the index.`);
      return out;
    }
    for (const f of files) {
      const raw: AttrRefFile = JSON.parse(readFileSync(join(dir, f), "utf8"));
      const slug = f.replace(/\.json$/, "");
      const title = raw.title ?? slug;
      const lead = resolveText(raw.description);
      const rows: AttrRefRow[] = raw.attributes?.sections?.[0]?.cells?.data ?? [];
      out.push({
        url: `/reference/${kind}/${slug}`,
        namespace: `reference_${kind}_${slug.replace(/-/g, "_")}`,
        title: { en: title, ja: title },
        lead,
        sections: rows
          .filter((r) => r.name && r.anchorId)
          .map((r) => ({ anchor: r.anchorId as string, heading: { en: r.name as string, ja: r.name as string } })),
      });
    }
  }
  return out;
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
    // Attribute-reference pages intentionally have no strings namespace —
    // attrRefEntries() indexes them from the runtime JSON instead.
    if (!/^reference\/(components|attributes)\//.test(layoutFile)) {
      skipped.push({ spec: relative(PROJECT_ROOT, specPath), reason: `namespace '${ns}' not in strings.json` });
    }
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

for (const sec of SECTION_INDEXES) {
  const nsEntries = strings[sec.namespace];
  if (!nsEntries) {
    skipped.push({ spec: sec.url, reason: `namespace '${sec.namespace}' not in strings.json` });
    continue;
  }
  const title = resolveText(nsEntries.title) ?? resolveText(nsEntries.headline);
  if (!title) {
    skipped.push({ spec: sec.url, reason: `namespace '${sec.namespace}' missing title/headline` });
    continue;
  }
  const lead = resolveText(nsEntries.lead) ?? resolveText(nsEntries.subcopy);
  let anchors: string[] = [];
  try {
    anchors = extractSectionAnchors(resolve(layoutsRoot, `${sec.namespace}.json`));
  } catch {
    // Flat index layout missing: fine. Just no section anchors.
  }
  const sections: IndexEntry["sections"] = [];
  for (const anchor of anchors) {
    const heading = resolveText(nsEntries[`${anchor}_heading`]);
    if (heading) sections.push({ anchor, heading });
  }
  entries.push({ url: sec.url, namespace: sec.namespace, title, lead, sections });
}

entries.push(...attrRefEntries());

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
