// Build /reference/components/<name> and /reference/attributes/<category> from the
// merged (attribute_definitions + hand-authored overrides) data.
//
// Inputs:
//   rjui_tools/lib/core/attribute_definitions.json           (bundled authoritative schema)
//   ../docs/data/attribute-overrides/<component>.json        (hand-authored component overrides)
//   ../docs/data/attribute-overrides/_common_<category>.json (hand-authored category overrides)
//   ../docs/data/attribute-categories.json                   (131 common-attr → category map)
//   ../docs/data/attribute-order.json                        (display order, per-component overrides)
//
// Outputs (auto-generated, overwrite each run):
//   ../docs/screens/json/reference/components/<name>.spec.json
//   ../docs/screens/json/reference/attributes/<category>.spec.json
//   ../docs/screens/layouts/reference/components/<name>.json
//   ../docs/screens/layouts/reference/attributes/<category>.json
//   public/data/attribute-reference/components/<name>.json (runtime)
//   public/data/attribute-reference/attributes/<category>.json (runtime)
//   src/app/reference/components/<name>/page.tsx
//   src/app/reference/attributes/<category>/page.tsx
//
// Outputs (one-shot, only written if missing):
//   ../docs/screens/layouts/cells/reference_attribute_row.json
//   ../docs/screens/layouts/cells/reference_code_example.json
//   ../docs/screens/layouts/cells/reference_related_pill.json
//   ../docs/screens/layouts/cells/reference_category_chip.json
//
// Hand-written once (not managed by this script):
//   src/hooks/reference/useComponentReference.ts
//   src/hooks/reference/useCategoryReference.ts
//   src/repository/AttributeReferenceRepository.ts

import fs from "node:fs/promises";
import path from "node:path";

type Lang2<T = string> = { en: T; ja: T };

type Support = "yes" | "no" | "partial";
type Platforms = { ios: Support; android: Support; web: Support };

type AttrDef = {
  type?: string | (string | object)[];
  required?: boolean;
  description?: string;
  aliases?: string[];
  binding_direction?: string;
  enum?: string[];
  platform?: string;
};

type ExampleVariant = { language: string; label?: string; code: string };
type ExampleOverride = {
  title: Lang2;
  language?: string;
  code?: string;
  variants?: ExampleVariant[];
  description?: Lang2;
  filePath?: string;
  note?: Lang2;
};

type AttrOverrideExtras = {
  note?: Lang2;
  summary?: Lang2;
  platformDiff?: Record<string, string>;
  default?: string;
  enumValues?: string[];
  aliases?: string[];
  deprecated?: { replacement?: string; sinceVersion?: string };
  subgroup?: string;
};

type ComponentOverride = {
  component?: string;
  aliasOf?: string | null;
  canonical?: { language: string; code: string };
  platforms?: Partial<Platforms>;
  description?: Lang2;
  usage?: Lang2;
  examples?: ExampleOverride[];
  attributes?: Record<string, AttrOverrideExtras>;
  commonAttributes?: Record<string, AttrOverrideExtras>;
  relatedComponents?: string[];
};

type CategoryAttrOverride = {
  summary?: Lang2;
  values?: Array<{ value: string; description: Lang2 }>;
  examples?: Array<{ title?: Lang2; language: string; code: string }>;
  platformDiff?: Record<string, string>;
  relatedAttributes?: string[];
  default?: string;
  enumValues?: string[];
  aliases?: string[];
  deprecated?: { replacement?: string; sinceVersion?: string };
  subgroup?: string;
  note?: Lang2;
};

type CategoryOverride = {
  category?: string;
  description?: Lang2;
  attributes?: Record<string, CategoryAttrOverride>;
  breakpoints?: Record<string, unknown>;
};

const CWD = process.cwd();
const REPO_ROOT = path.resolve(CWD, "..");

const PATHS = {
  attrDefs: path.resolve(CWD, "rjui_tools/lib/core/attribute_definitions.json"),
  overridesDir: path.resolve(REPO_ROOT, "docs/data/attribute-overrides"),
  categoriesFile: path.resolve(REPO_ROOT, "docs/data/attribute-categories.json"),
  orderFile: path.resolve(REPO_ROOT, "docs/data/attribute-order.json"),
  descriptionsFile: path.resolve(REPO_ROOT, "docs/data/attribute-descriptions.json"),
  specComponentsDir: path.resolve(REPO_ROOT, "docs/screens/json/reference/components"),
  specAttributesDir: path.resolve(REPO_ROOT, "docs/screens/json/reference/attributes"),
  layoutComponentsDir: path.resolve(REPO_ROOT, "docs/screens/layouts/reference/components"),
  layoutAttributesDir: path.resolve(REPO_ROOT, "docs/screens/layouts/reference/attributes"),
  cellsDir: path.resolve(REPO_ROOT, "docs/screens/layouts/cells"),
  runtimeComponentsDir: path.resolve(CWD, "public/data/attribute-reference/components"),
  runtimeAttributesDir: path.resolve(CWD, "public/data/attribute-reference/attributes"),
  appComponentsDir: path.resolve(CWD, "src/app/reference/components"),
  appAttributesDir: path.resolve(CWD, "src/app/reference/attributes"),
};

// ---------------------------------------------------------------------------
// IO helpers
// ---------------------------------------------------------------------------

async function readJson<T = unknown>(p: string): Promise<T> {
  return JSON.parse(await fs.readFile(p, "utf8")) as T;
}

async function readJsonOptional<T = unknown>(p: string): Promise<T | null> {
  try { return await readJson<T>(p); } catch (e: any) {
    if (e && e.code === "ENOENT") return null;
    throw e;
  }
}

async function writeJson(p: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function writeText(p: string, text: string): Promise<void> {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, text, "utf8");
}

async function fileExists(p: string): Promise<boolean> {
  try { await fs.stat(p); return true; } catch { return false; }
}

// ---------------------------------------------------------------------------
// String helpers
// ---------------------------------------------------------------------------

function kebab(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function toPascal(s: string): string {
  return s.split(/[-_\s]+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
}

function capitalize(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

function today(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function describeType(def: AttrDef): string {
  const t = def.type;
  if (!t) return "any";
  if (typeof t === "string") return t;
  if (Array.isArray(t)) {
    return t.map((x) => {
      if (typeof x === "string") return x;
      if (x && typeof x === "object" && "enum" in (x as any)) return `enum(${((x as any).enum as string[]).join("|")})`;
      return JSON.stringify(x);
    }).join(" | ");
  }
  return JSON.stringify(t);
}

// ---------------------------------------------------------------------------
// Merging
// ---------------------------------------------------------------------------

type MergedAttribute = {
  id: string;
  name: string;
  type: string;
  required: boolean;
  description: string | Lang2;
  note?: Lang2;
  platformDiff?: Record<string, string>;
  platform?: string;
  bindingDirection?: string;
  enumValues?: string[];
  aliases?: string[];
  default?: string;
  deprecated?: { replacement?: string; sinceVersion?: string };
  subgroup?: string;
};

type MergedComponent = {
  name: string;
  kebab: string;
  aliasOf?: string | null;
  description: Lang2;
  usage?: Lang2;
  examples: NonNullable<ComponentOverride["examples"]>;
  attributes: MergedAttribute[];
  relatedComponents: string[];
  canonical?: { language: string; code: string };
  platforms: Platforms;
};

// Resolve the authoritative description for an attribute.
// Priority: override.summary (bilingual Lang2) → shared dictionary entry
// (bilingual Lang2) → attribute_definitions (English-only plain string).
// The resulting value is either `Lang2` (bilingual) or `string` (English
// fallback); the hook's `pickLangDeep` picks the right language at fetch time.
function resolveAttrDescription(
  attrName: string,
  def: AttrDef,
  overrideSummary: Lang2 | undefined,
  descriptionsDict: Record<string, Lang2>,
): string | Lang2 {
  if (overrideSummary && (overrideSummary.en || overrideSummary.ja)) return overrideSummary;
  const dictEntry = descriptionsDict[attrName];
  if (dictEntry && (dictEntry.en || dictEntry.ja)) return dictEntry;
  return def.description ?? "";
}

function mergeComponent(args: {
  name: string;
  defAttrs: Record<string, AttrDef>;
  override: ComponentOverride | null;
  orderMap: Record<string, string[]>;
  defaultOrder: string[];
  descriptionsDict: Record<string, Lang2>;
}): MergedComponent {
  const { name, defAttrs, override, orderMap, defaultOrder, descriptionsDict } = args;
  const attributeOverrides = override?.attributes ?? {};
  const componentOrder = orderMap[name] ?? null;

  const keys = Object.keys(defAttrs).filter((k) => !k.startsWith("_"));
  const orderedAttrNames = (() => {
    const base = componentOrder && componentOrder.length ? componentOrder : defaultOrder;
    const known = new Set(base);
    const listed = base.filter((k) => keys.includes(k));
    const rest = keys.filter((k) => !known.has(k)).sort();
    return [...listed, ...rest];
  })();

  const attributes: MergedAttribute[] = orderedAttrNames.map((attrName) => {
    const def = defAttrs[attrName];
    const ov = attributeOverrides[attrName];
    return {
      id: `attr_${attrName}`,
      name: attrName,
      type: describeType(def),
      required: !!def.required,
      description: resolveAttrDescription(attrName, def, ov?.summary, descriptionsDict),
      note: ov?.note,
      platformDiff: ov?.platformDiff,
      platform: def.platform,
      bindingDirection: def.binding_direction,
      enumValues: ov?.enumValues ?? def.enum,
      aliases: ov?.aliases ?? def.aliases,
      default: ov?.default,
      deprecated: ov?.deprecated,
      subgroup: ov?.subgroup,
    };
  });

  return {
    name,
    kebab: kebab(name),
    aliasOf: override?.aliasOf ?? null,
    description: override?.description ?? { en: `${name} component.`, ja: `${name} コンポーネント。` },
    usage: override?.usage,
    examples: override?.examples ?? [],
    attributes,
    relatedComponents: override?.relatedComponents ?? [],
    canonical: override?.canonical,
    platforms: {
      ios: override?.platforms?.ios ?? "yes",
      android: override?.platforms?.android ?? "yes",
      web: override?.platforms?.web ?? "yes",
    },
  };
}

type MergedCategoryAttribute = {
  id: string;
  name: string;
  type: string;
  required: boolean;
  description: string | Lang2;
  summary?: Lang2;
  values?: Array<{ value: string; description: Lang2 }>;
  examples?: Array<{ title?: Lang2; language: string; code: string }>;
  platformDiff?: Record<string, string>;
  relatedAttributes?: string[];
  platform?: string;
  bindingDirection?: string;
  enumValues?: string[];
  aliases?: string[];
  default?: string;
  deprecated?: { replacement?: string; sinceVersion?: string };
  subgroup?: string;
  note?: Lang2;
};

type MergedCategory = {
  category: string;
  description: Lang2;
  attributes: MergedCategoryAttribute[];
  breakpoints?: Record<string, unknown>;
};

function mergeCategory(args: {
  category: string;
  allCommonDefs: Record<string, AttrDef>;
  categoryMap: Record<string, string>;
  override: CategoryOverride | null;
  descriptionsDict: Record<string, Lang2>;
}): MergedCategory {
  const { category, allCommonDefs, categoryMap, override, descriptionsDict } = args;
  const attrOverrides = override?.attributes ?? {};
  const attrNames = Object.keys(allCommonDefs).filter((k) => !k.startsWith("_") && categoryMap[k] === category).sort();

  const attributes: MergedCategoryAttribute[] = attrNames.map((attrName) => {
    const def = allCommonDefs[attrName];
    const ov = attrOverrides[attrName];
    return {
      id: `attr_${attrName}`,
      name: attrName,
      type: describeType(def),
      required: !!def.required,
      description: resolveAttrDescription(attrName, def, ov?.summary, descriptionsDict),
      summary: ov?.summary,
      values: ov?.values,
      examples: ov?.examples,
      platformDiff: ov?.platformDiff,
      relatedAttributes: ov?.relatedAttributes,
      platform: def.platform,
      bindingDirection: def.binding_direction,
      enumValues: ov?.enumValues ?? def.enum,
      aliases: ov?.aliases ?? def.aliases,
      default: ov?.default,
      deprecated: ov?.deprecated,
      subgroup: ov?.subgroup,
      note: ov?.note,
    };
  });

  return {
    category,
    description: override?.description ?? { en: `${category} attributes.`, ja: `${category} 系の属性。` },
    attributes,
    breakpoints: override?.breakpoints,
  };
}

// ---------------------------------------------------------------------------
// Spec generation
// ---------------------------------------------------------------------------

function componentSpec(merged: MergedComponent): unknown {
  const layoutFile = `reference/components/${merged.kebab}`;
  return {
    type: "screen_spec",
    version: "1.0",
    generatedBy: "scripts/build-attribute-reference.ts",
    metadata: {
      name: `RefComponent${toPascal(merged.name)}`,
      displayName: `${merged.name} — Component reference`,
      description: merged.description.en || `Reference > Components > ${merged.name}.`,
      platforms: ["web"],
      layoutFile,
      createdAt: today(),
      updatedAt: today(),
    },
    structure: { components: [], layout: {}, collection: null, tabView: null },
    stateManagement: {
      states: [],
      uiVariables: [],
      eventHandlers: [],
      displayLogic: [],
    },
    dataFlow: {
      diagram: "flowchart TD\n    VIEW --> HOOK\n    HOOK --> REPO\n    REPO --> DATA",
      viewModel: {
        methods: [],
        vars: [],
      },
      repositories: [
        {
          name: "AttributeReferenceRepository",
          description: "Fetches merged attribute reference data.",
          methods: [
            {
              name: "fetchComponent",
              params: [{ name: "name", type: "String" }],
              returnType: "RefComponentData",
              isAsync: true,
              description: "GET /data/attribute-reference/components/<kebab(name)>.json",
            },
          ],
        },
      ],
      useCases: [],
      apiEndpoints: [],
      customTypes: [],
    },
    userActions: [
      { action: "Tap a related-component pill", processing: "router.push('/reference/components/<slug>')." },
      { action: "Tap a NextReadLink card", processing: "router.push(url)." },
    ],
    validation: { clientSide: [], serverSide: [] },
    transitions: [],
    relatedFiles: [
      { type: "Layout", path: `docs/screens/layouts/${layoutFile}.json`, description: "Layout." },
      { type: "Data", path: `jsonui-doc-web/public/data/attribute-reference/components/${merged.kebab}.json`, description: "Runtime data." },
      { type: "View", path: `jsonui-doc-web/src/app/reference/components/${merged.kebab}/page.tsx`, description: "Next.js page." },
      { type: "Override", path: `docs/data/attribute-overrides/${kebab(merged.name).replace(/-/g, "")}.json`, description: "Hand-authored override." },
    ],
    notes: [
      "Auto-generated by scripts/build-attribute-reference.ts.",
      "Do not hand-edit — update docs/data/attribute-overrides/<name>.json and re-run `npm run build:attrs`.",
      merged.aliasOf ? `Alias of ${merged.aliasOf}. Runtime data redirects to the aliased component.` : "",
    ].filter(Boolean),
  };
}

function categorySpec(merged: MergedCategory): unknown {
  const layoutFile = `reference/attributes/${merged.category}`;
  return {
    type: "screen_spec",
    version: "1.0",
    generatedBy: "scripts/build-attribute-reference.ts",
    metadata: {
      name: `RefAttribute${capitalize(merged.category)}`,
      displayName: `${capitalize(merged.category)} attributes — Reference`,
      description: merged.description.en || `Reference > Attributes > ${merged.category}.`,
      platforms: ["web"],
      layoutFile,
      createdAt: today(),
      updatedAt: today(),
    },
    structure: { components: [], layout: {}, collection: null, tabView: null },
    stateManagement: {
      states: [],
      uiVariables: [],
      eventHandlers: [],
      displayLogic: [],
    },
    dataFlow: {
      diagram: "flowchart TD\n    VIEW --> HOOK\n    HOOK --> REPO\n    REPO --> DATA",
      viewModel: { methods: [], vars: [] },
      repositories: [
        {
          name: "AttributeReferenceRepository",
          description: "Fetches merged attribute reference data.",
          methods: [
            {
              name: "fetchCategory",
              params: [{ name: "category", type: "String" }],
              returnType: "RefCategoryData",
              isAsync: true,
              description: "GET /data/attribute-reference/attributes/<category>.json",
            },
          ],
        },
      ],
      useCases: [],
      apiEndpoints: [],
      customTypes: [],
    },
    userActions: [],
    validation: { clientSide: [], serverSide: [] },
    transitions: [],
    relatedFiles: [
      { type: "Layout", path: `docs/screens/layouts/${layoutFile}.json`, description: "Layout." },
      { type: "Data", path: `jsonui-doc-web/public/data/attribute-reference/attributes/${merged.category}.json`, description: "Runtime data." },
      { type: "View", path: `jsonui-doc-web/src/app/reference/attributes/${merged.category}/page.tsx`, description: "Next.js page." },
      { type: "Override", path: `docs/data/attribute-overrides/_common_${merged.category}.json`, description: "Hand-authored override." },
    ],
    notes: [
      "Auto-generated by scripts/build-attribute-reference.ts.",
      "Do not hand-edit — update docs/data/attribute-overrides/_common_<category>.json and re-run `npm run build:attrs`.",
    ],
  };
}

// ---------------------------------------------------------------------------
// Layout generation (full, not scaffold)
// ---------------------------------------------------------------------------

function componentLayout(merged: MergedComponent): unknown {
  const idBase = `reference_components_${merged.kebab.replace(/-/g, "_")}`;

  // ---------------------------------------------------------------------
  // Shared page header (Plan 01 §"Header JSON"). Pasted inline so we stay
  // inside the DSL; see docs/plans/reference-detail-redesign/01-shared-page-header.md.
  // ---------------------------------------------------------------------
  const pageHeader = {
    type: "View",
    id: `${idBase}_page_header`,
    orientation: "vertical",
    width: "matchParent",
    height: "wrapContent",
    paddings: [24, 0, 24, 0],
    child: [
      {
        type: "View",
        id: `${idBase}_page_header_kicker_row`,
        orientation: "horizontal",
        width: "matchParent",
        height: "wrapContent",
        child: [
          {
            type: "Label",
            id: `${idBase}_page_header_kicker`,
            height: "wrapContent",
            weight: 1,
            fontSize: 11,
            fontWeight: "semibold",
            fontColor: "ink_subtle",
            text: "@{kicker}",
          },
          {
            type: "Collection",
            id: `${idBase}_page_header_badges`,
            width: "wrapContent",
            height: "wrapContent",
            orientation: "horizontal",
            items: "@{badges}",
            cellIdProperty: "id",
            lazy: false,
            scrollEnabled: false,
            sections: [{ cell: "cells/reference_platform_badge" }],
          },
        ],
      },
      {
        type: "View",
        id: `${idBase}_page_header_breadcrumb_row`,
        orientation: "horizontal",
        width: "matchParent",
        height: "wrapContent",
        topMargin: 16,
        child: [
          {
            type: "Label",
            id: `${idBase}_page_header_breadcrumb_parent`,
            width: "wrapContent",
            height: "wrapContent",
            fontSize: 13,
            fontWeight: "semibold",
            fontColor: "accent_link",
            tapBackground: "surface_sunken",
            onClick: "@{onNavigateBreadcrumb}",
            text: "@{kickerParentLabel}",
          },
          {
            type: "Label",
            width: "wrapContent",
            height: "wrapContent",
            leftMargin: 8,
            rightMargin: 8,
            fontSize: 13,
            fontColor: "ink_faint",
            text: "›",
          },
          {
            type: "Label",
            id: `${idBase}_page_header_breadcrumb_current`,
            width: "wrapContent",
            height: "wrapContent",
            fontSize: 13,
            fontColor: "ink",
            text: "@{title}",
          },
        ],
      },
      {
        type: "View",
        id: `${idBase}_page_header_title_row`,
        orientation: "horizontal",
        width: "matchParent",
        height: "wrapContent",
        topMargin: 12,
        child: [
          {
            type: "Label",
            id: `${idBase}_page_header_title`,
            height: "wrapContent",
            weight: 1,
            fontSize: 36,
            fontWeight: "bold",
            fontColor: "ink",
            text: "@{title}",
          },
          {
            type: "Button",
            id: `${idBase}_page_header_copy_type`,
            width: "wrapContent",
            height: "wrapContent",
            visibility: "@{copyTypeVisibility}",
            paddings: [6, 10, 6, 10],
            background: "surface_sunken",
            cornerRadius: 6,
            fontSize: 12,
            fontColor: "ink",
            text: "reference_detail_copy_type",
            onClick: "@{onCopyTypeName}",
          },
        ],
      },
      {
        type: "View",
        id: `${idBase}_page_header_alias_callout`,
        orientation: "horizontal",
        width: "wrapContent",
        height: "wrapContent",
        topMargin: 16,
        paddings: [8, 12, 8, 12],
        background: "accent_tint",
        cornerRadius: 8,
        visibility: "@{aliasCalloutVisibility}",
        child: [
          {
            type: "Label",
            width: "wrapContent",
            height: "wrapContent",
            fontSize: 13,
            fontColor: "accent_secondary_strong",
            text: "→",
          },
          {
            type: "Label",
            width: "wrapContent",
            height: "wrapContent",
            leftMargin: 8,
            fontSize: 13,
            fontWeight: "semibold",
            fontColor: "accent_secondary_strong",
            text: "@{aliasNotice}",
          },
        ],
      },
      {
        type: "Label",
        id: `${idBase}_page_header_description`,
        width: "matchParent",
        maxWidth: 920,
        height: "wrapContent",
        topMargin: 20,
        fontSize: 17,
        lineHeightMultiple: 1.55,
        fontColor: "ink_muted",
        text: "@{description}",
      },
    ],
  };

  // ---------------------------------------------------------------------
  // § 1 — At a glance (Plan 02 §1)
  // ---------------------------------------------------------------------
  const sectionGlance = {
    type: "View",
    id: "section-glance",
    orientation: "vertical",
    width: "matchParent",
    height: "wrapContent",
    topMargin: 28,
    paddings: [20, 20, 20, 20],
    background: "surface",
    cornerRadius: 10,
    borderColor: "border",
    borderWidth: 1,
    child: [
      {
        type: "Label",
        width: "matchParent",
        height: "wrapContent",
        fontSize: 11,
        fontWeight: "semibold",
        fontColor: "ink_subtle",
        text: "reference_detail_eyebrow_glance",
      },
      {
        type: "CodeBlock",
        id: `${idBase}_glance_code`,
        width: "matchParent",
        height: "wrapContent",
        topMargin: 12,
        code: "@{canonicalCode}",
        language: "@{canonicalLanguage}",
        showLineNumbers: false,
        copyable: true,
      },
      {
        type: "View",
        id: `${idBase}_glance_stats`,
        orientation: "horizontal",
        width: "matchParent",
        height: "wrapContent",
        topMargin: 14,
        child: [
          {
            type: "Label",
            width: "wrapContent",
            height: "wrapContent",
            paddings: [3, 8, 3, 8],
            background: "surface_sunken",
            cornerRadius: 4,
            fontSize: 11,
            fontFamily: "monospace",
            fontColor: "ink",
            text: "@{statRequiredText}",
          },
          {
            type: "Label",
            width: "wrapContent",
            height: "wrapContent",
            leftMargin: 8,
            paddings: [3, 8, 3, 8],
            background: "surface_sunken",
            cornerRadius: 4,
            fontSize: 11,
            fontFamily: "monospace",
            fontColor: "ink",
            text: "@{statOptionalText}",
          },
          {
            type: "Label",
            width: "wrapContent",
            height: "wrapContent",
            leftMargin: 8,
            paddings: [3, 8, 3, 8],
            background: "surface_sunken",
            cornerRadius: 4,
            fontSize: 11,
            fontFamily: "monospace",
            fontColor: "ink",
            text: "@{statEventsText}",
          },
        ],
      },
    ],
  };

  // ---------------------------------------------------------------------
  // § 2 — Usage (Plan 02 §2)
  // ---------------------------------------------------------------------
  const sectionUsage = {
    type: "View",
    id: "section-usage",
    orientation: "vertical",
    width: "matchParent",
    height: "wrapContent",
    topMargin: 32,
    visibility: "@{usageVisibility}",
    child: [
      {
        type: "Label",
        width: "matchParent",
        height: "wrapContent",
        fontSize: 11,
        fontWeight: "semibold",
        fontColor: "ink_subtle",
        text: "reference_detail_eyebrow_usage",
      },
      {
        type: "Label",
        width: "matchParent",
        maxWidth: 920,
        height: "wrapContent",
        topMargin: 8,
        fontSize: 15,
        lineHeightMultiple: 1.55,
        fontColor: "ink_muted",
        text: "@{usage}",
      },
    ],
  };

  // ---------------------------------------------------------------------
  // § 3 — Attributes (Plan 02 §3)
  // ---------------------------------------------------------------------
  const attrGroupBlock = (key: CategoryKey) => {
    const Cap = capitalize(key);
    return {
      type: "View",
      id: `section-${key}`,
      orientation: "vertical",
      width: "matchParent",
      height: "wrapContent",
      topMargin: 28,
      visibility: `@{group${Cap}Visibility}`,
      child: [
        {
          type: "Label",
          width: "matchParent",
          height: "wrapContent",
          fontSize: 18,
          fontWeight: "semibold",
          fontColor: "ink",
          text: `reference_detail_category_${key}`,
        },
        {
          type: "Collection",
          id: `${idBase}_group_${key}_list`,
          width: "matchParent",
          height: "wrapContent",
          topMargin: 12,
          items: `@{attributes${Cap}}`,
          cellIdProperty: "id",
          lazy: false,
          scrollEnabled: false,
          sections: [{ cell: "cells/reference_attribute_row" }],
        },
      ],
    };
  };

  const sectionAttributes = {
    type: "View",
    id: "section-attributes",
    orientation: "vertical",
    width: "matchParent",
    height: "wrapContent",
    topMargin: 32,
    child: [
      {
        type: "Label",
        width: "matchParent",
        height: "wrapContent",
        fontSize: 11,
        fontWeight: "semibold",
        fontColor: "ink_subtle",
        text: "reference_detail_eyebrow_attributes",
      },
      {
        type: "Collection",
        id: `${idBase}_category_chips`,
        width: "matchParent",
        height: "wrapContent",
        topMargin: 12,
        orientation: "horizontal",
        items: "@{attributeCategories}",
        cellIdProperty: "id",
        lazy: false,
        scrollEnabled: false,
        sections: [{ cell: "cells/reference_category_chip" }],
      },
      ...CATEGORY_KEYS.map(attrGroupBlock),
    ],
  };

  // ---------------------------------------------------------------------
  // § 5 — Examples (Plan 02 §5)
  // ---------------------------------------------------------------------
  const sectionExamples = {
    type: "View",
    id: "section-examples",
    orientation: "vertical",
    width: "matchParent",
    height: "wrapContent",
    topMargin: 32,
    child: [
      {
        type: "Label",
        width: "matchParent",
        height: "wrapContent",
        fontSize: 11,
        fontWeight: "semibold",
        fontColor: "ink_subtle",
        text: "reference_detail_eyebrow_examples",
      },
      {
        type: "Collection",
        id: `${idBase}_examples`,
        width: "matchParent",
        height: "wrapContent",
        topMargin: 12,
        items: "@{examples}",
        cellIdProperty: "id",
        lazy: false,
        scrollEnabled: false,
        sections: [{ cell: "cells/reference_code_example" }],
      },
    ],
  };

  // ---------------------------------------------------------------------
  // § 6 — Related components (Plan 02 §6)
  // ---------------------------------------------------------------------
  const sectionRelated = {
    type: "View",
    id: "section-related",
    orientation: "vertical",
    width: "matchParent",
    height: "wrapContent",
    topMargin: 32,
    child: [
      {
        type: "Label",
        width: "matchParent",
        height: "wrapContent",
        fontSize: 11,
        fontWeight: "semibold",
        fontColor: "ink_subtle",
        text: "reference_detail_eyebrow_related",
      },
      {
        type: "Collection",
        id: `${idBase}_related`,
        width: "matchParent",
        height: "wrapContent",
        topMargin: 12,
        items: "@{relatedComponents}",
        cellIdProperty: "id",
        lazy: false,
        scrollEnabled: false,
        sections: [{ cell: "cells/reference_related_pill" }],
      },
    ],
  };

  // ---------------------------------------------------------------------
  // § 7 — Next reads
  // ---------------------------------------------------------------------
  const sectionNext = {
    type: "View",
    id: "section-next",
    orientation: "vertical",
    width: "matchParent",
    height: "wrapContent",
    topMargin: 40,
    child: [
      {
        type: "Collection",
        id: `${idBase}_next`,
        width: "matchParent",
        height: "wrapContent",
        items: "@{nextReadLinks}",
        cellIdProperty: "id",
        lazy: false,
        scrollEnabled: false,
        sections: [{ cell: "cells/next_step_card" }],
      },
    ],
  };

  // ---------------------------------------------------------------------
  // § 8 — Right-rail TOC wrapper (Plan 01 §"Right-rail TOC wrapper")
  // Header stays OUTSIDE the 2-column wrapper so the rail starts below it.
  // ---------------------------------------------------------------------
  const contentWithRail = {
    type: "View",
    id: `${idBase}_content_with_rail`,
    orientation: "horizontal",
    width: "matchParent",
    height: "wrapContent",
    topMargin: 8,
    child: [
      {
        type: "View",
        id: `${idBase}_column_body`,
        orientation: "vertical",
        weight: 1,
        height: "wrapContent",
        child: [
          sectionGlance,
          sectionUsage,
          sectionAttributes,
          sectionExamples,
          sectionRelated,
          sectionNext,
        ],
      },
      {
        type: "View",
        id: `${idBase}_column_rail`,
        orientation: "vertical",
        width: 240,
        height: "wrapContent",
        leftMargin: 32,
        paddings: [28, 0, 0, 0],
        child: [
          {
            type: "TableOfContents",
            id: `${idBase}_toc`,
            width: "matchParent",
            height: "wrapContent",
            items: "@{tocEntries}",
            sticky: true,
            stickyOffset: 80,
            maxDepth: 1,
          },
        ],
      },
    ],
  };

  return {
    type: "View",
    id: `${idBase}_root`,
    orientation: "vertical",
    width: "matchParent",
    height: "matchParent",
    background: "surface_muted",
    child: [
      {
        data: [
          // --- Page header (Plan 01) ---------------------------------------
          { name: "title", class: "String" },
          { name: "description", class: "String" },
          { name: "kicker", class: "String", defaultValue: "Component · Reference" },
          { name: "kickerParentLabel", class: "String", defaultValue: "Components" },
          { name: "badges", class: "CollectionDataSource" },
          { name: "copyTypeVisibility", class: "String", defaultValue: "visible" },
          { name: "aliasCalloutVisibility", class: "String", defaultValue: "gone" },
          { name: "aliasNotice", class: "String", defaultValue: "" },
          { name: "onCopyTypeName", class: "() -> Void" },
          { name: "onNavigateBreadcrumb", class: "() -> Void" },

          // --- At a glance (Plan 02 §1) ------------------------------------
          { name: "canonicalCode", class: "String", defaultValue: "" },
          { name: "canonicalLanguage", class: "String", defaultValue: "json" },
          { name: "statRequiredText", class: "String", defaultValue: "0 required" },
          { name: "statOptionalText", class: "String", defaultValue: "0 optional" },
          { name: "statEventsText", class: "String", defaultValue: "0 events" },

          // --- Usage (Plan 02 §2) ------------------------------------------
          { name: "usage", class: "String", defaultValue: "" },
          { name: "usageVisibility", class: "String", defaultValue: "gone" },

          // --- Attributes (Plan 02 §3) -------------------------------------
          { name: "attributeCategories", class: "CollectionDataSource" },
          { name: "attributesCommon", class: "CollectionDataSource" },
          { name: "attributesStyle", class: "CollectionDataSource" },
          { name: "attributesLayout", class: "CollectionDataSource" },
          { name: "attributesSpacing", class: "CollectionDataSource" },
          { name: "attributesAlignment", class: "CollectionDataSource" },
          { name: "attributesState", class: "CollectionDataSource" },
          { name: "attributesBinding", class: "CollectionDataSource" },
          { name: "attributesEvent", class: "CollectionDataSource" },
          { name: "attributesResponsive", class: "CollectionDataSource" },
          { name: "attributesMisc", class: "CollectionDataSource" },
          { name: "groupCommonVisibility", class: "String", defaultValue: "gone" },
          { name: "groupStyleVisibility", class: "String", defaultValue: "gone" },
          { name: "groupLayoutVisibility", class: "String", defaultValue: "gone" },
          { name: "groupSpacingVisibility", class: "String", defaultValue: "gone" },
          { name: "groupAlignmentVisibility", class: "String", defaultValue: "gone" },
          { name: "groupStateVisibility", class: "String", defaultValue: "gone" },
          { name: "groupBindingVisibility", class: "String", defaultValue: "gone" },
          { name: "groupEventVisibility", class: "String", defaultValue: "gone" },
          { name: "groupResponsiveVisibility", class: "String", defaultValue: "gone" },
          { name: "groupMiscVisibility", class: "String", defaultValue: "gone" },

          // --- Examples / Related / Next -----------------------------------
          { name: "examples", class: "CollectionDataSource" },
          { name: "relatedComponents", class: "CollectionDataSource" },
          { name: "nextReadLinks", class: "CollectionDataSource" },

          // --- TOC rail (Plan 01) ------------------------------------------
          { name: "tocEntries", class: "Array" },
        ],
      },
      {
        type: "View",
        id: `${idBase}_scroll`,
        orientation: "vertical",
        width: "matchParent",
        weight: 1,
        paddings: [24, 32, 24, 32],
        child: [
          pageHeader,
          contentWithRail,
        ],
      },
    ],
    _comment: "Auto-generated by scripts/build-attribute-reference.ts. Structure follows docs/plans/reference-detail-redesign/01-shared-page-header.md and 02-component-detail-layout.md.",
  };
}

function categoryLayout(merged: MergedCategory): unknown {
  const idBase = `reference_attributes_${merged.category}`;

  // ---------------------------------------------------------------------
  // Shared page header (Plan 01 §"Header JSON"). Same pattern as
  // componentLayout() but with copy-type button + alias callout hidden
  // via visibility bindings (runtime data sends "gone" on category pages).
  // ---------------------------------------------------------------------
  const pageHeader = {
    type: "View",
    id: `${idBase}_page_header`,
    orientation: "vertical",
    width: "matchParent",
    height: "wrapContent",
    paddings: [24, 0, 24, 0],
    child: [
      {
        type: "View",
        id: `${idBase}_page_header_kicker_row`,
        orientation: "horizontal",
        width: "matchParent",
        height: "wrapContent",
        child: [
          {
            type: "Label",
            id: `${idBase}_page_header_kicker`,
            height: "wrapContent",
            weight: 1,
            fontSize: 11,
            fontWeight: "semibold",
            fontColor: "ink_subtle",
            text: "@{kicker}",
          },
          {
            type: "Collection",
            id: `${idBase}_page_header_badges`,
            width: "wrapContent",
            height: "wrapContent",
            orientation: "horizontal",
            items: "@{badges}",
            cellIdProperty: "id",
            lazy: false,
            scrollEnabled: false,
            sections: [{ cell: "cells/reference_platform_badge" }],
          },
        ],
      },
      {
        type: "View",
        id: `${idBase}_page_header_breadcrumb_row`,
        orientation: "horizontal",
        width: "matchParent",
        height: "wrapContent",
        topMargin: 16,
        child: [
          {
            type: "Label",
            id: `${idBase}_page_header_breadcrumb_parent`,
            width: "wrapContent",
            height: "wrapContent",
            fontSize: 13,
            fontWeight: "semibold",
            fontColor: "accent_link",
            tapBackground: "surface_sunken",
            onClick: "@{onNavigateBreadcrumb}",
            text: "@{kickerParentLabel}",
          },
          {
            type: "Label",
            width: "wrapContent",
            height: "wrapContent",
            leftMargin: 8,
            rightMargin: 8,
            fontSize: 13,
            fontColor: "ink_faint",
            text: "›",
          },
          {
            type: "Label",
            id: `${idBase}_page_header_breadcrumb_current`,
            width: "wrapContent",
            height: "wrapContent",
            fontSize: 13,
            fontColor: "ink",
            text: "@{title}",
          },
        ],
      },
      {
        type: "View",
        id: `${idBase}_page_header_title_row`,
        orientation: "horizontal",
        width: "matchParent",
        height: "wrapContent",
        topMargin: 12,
        child: [
          {
            type: "Label",
            id: `${idBase}_page_header_title`,
            height: "wrapContent",
            weight: 1,
            fontSize: 36,
            fontWeight: "bold",
            fontColor: "ink",
            text: "@{title}",
          },
          {
            type: "Button",
            id: `${idBase}_page_header_copy_type`,
            width: "wrapContent",
            height: "wrapContent",
            visibility: "@{copyTypeVisibility}",
            paddings: [6, 10, 6, 10],
            background: "surface_sunken",
            cornerRadius: 6,
            fontSize: 12,
            fontColor: "ink",
            text: "reference_detail_copy_type",
            onClick: "@{onCopyTypeName}",
          },
        ],
      },
      {
        type: "View",
        id: `${idBase}_page_header_alias_callout`,
        orientation: "horizontal",
        width: "wrapContent",
        height: "wrapContent",
        topMargin: 16,
        paddings: [8, 12, 8, 12],
        background: "accent_tint",
        cornerRadius: 8,
        visibility: "@{aliasCalloutVisibility}",
        child: [
          {
            type: "Label",
            width: "wrapContent",
            height: "wrapContent",
            fontSize: 13,
            fontColor: "accent_secondary_strong",
            text: "→",
          },
          {
            type: "Label",
            width: "wrapContent",
            height: "wrapContent",
            leftMargin: 8,
            fontSize: 13,
            fontWeight: "semibold",
            fontColor: "accent_secondary_strong",
            text: "@{aliasNotice}",
          },
        ],
      },
      {
        type: "Label",
        id: `${idBase}_page_header_description`,
        width: "matchParent",
        maxWidth: 920,
        height: "wrapContent",
        topMargin: 20,
        fontSize: 17,
        lineHeightMultiple: 1.55,
        fontColor: "ink_muted",
        text: "@{description}",
      },
    ],
  };

  // ---------------------------------------------------------------------
  // § 1 — Overview table (Plan 03 §1).
  // Header row (NAME / TYPE / SUMMARY) + Collection of overview rows.
  // ---------------------------------------------------------------------
  const sectionOverview = {
    type: "View",
    id: "section-overview",
    orientation: "vertical",
    width: "matchParent",
    height: "wrapContent",
    topMargin: 28,
    child: [
      {
        type: "Label",
        width: "matchParent",
        height: "wrapContent",
        fontSize: 11,
        fontWeight: "semibold",
        fontColor: "ink_subtle",
        text: "reference_detail_eyebrow_overview",
      },
      {
        type: "View",
        id: `${idBase}_overview_table`,
        orientation: "vertical",
        width: "matchParent",
        height: "wrapContent",
        topMargin: 12,
        background: "surface",
        cornerRadius: 10,
        borderColor: "border",
        borderWidth: 1,
        child: [
          {
            type: "View",
            orientation: "horizontal",
            width: "matchParent",
            height: "wrapContent",
            paddings: [10, 12, 10, 12],
            background: "surface_muted",
            child: [
              {
                type: "Label",
                width: 180,
                height: "wrapContent",
                fontSize: 11,
                fontWeight: "semibold",
                fontColor: "ink_subtle",
                text: "reference_detail_header_name",
              },
              {
                type: "Label",
                width: 180,
                height: "wrapContent",
                leftMargin: 12,
                fontSize: 11,
                fontWeight: "semibold",
                fontColor: "ink_subtle",
                text: "reference_detail_header_type",
              },
              {
                type: "Label",
                height: "wrapContent",
                weight: 1,
                leftMargin: 12,
                fontSize: 11,
                fontWeight: "semibold",
                fontColor: "ink_subtle",
                text: "reference_detail_header_summary",
              },
            ],
          },
          {
            type: "View",
            width: "matchParent",
            height: 1,
            background: "border",
          },
          {
            type: "Collection",
            id: `${idBase}_overview_rows`,
            width: "matchParent",
            height: "wrapContent",
            items: "@{overviewRows}",
            cellIdProperty: "id",
            lazy: false,
            scrollEnabled: false,
            sections: [{ cell: "cells/reference_overview_row" }],
          },
        ],
      },
    ],
  };

  // ---------------------------------------------------------------------
  // § 2 — Detail (Plan 03 §2). Flat-only for v1 — no category in the
  // current override set declares subgroups, so splitBySubgroup() returns
  // hasSubgroups=false for every category and subgroupsVisibility="gone".
  // Subgroup-aware layout would require dynamic subgroup<Key> bindings
  // that can't be emitted from a static template; deferred to a future
  // plan once override authoring demands it.
  // ---------------------------------------------------------------------
  const sectionDetail = {
    type: "View",
    id: "section-detail",
    orientation: "vertical",
    width: "matchParent",
    height: "wrapContent",
    topMargin: 32,
    child: [
      {
        type: "Label",
        width: "matchParent",
        height: "wrapContent",
        fontSize: 11,
        fontWeight: "semibold",
        fontColor: "ink_subtle",
        text: "reference_detail_eyebrow_detail",
      },
      {
        type: "Collection",
        id: `${idBase}_detail_rows`,
        width: "matchParent",
        height: "wrapContent",
        topMargin: 12,
        items: "@{attributes}",
        cellIdProperty: "id",
        lazy: false,
        scrollEnabled: false,
        sections: [{ cell: "cells/reference_attribute_row" }],
      },
    ],
  };

  // ---------------------------------------------------------------------
  // § 3 — Next reads.
  // ---------------------------------------------------------------------
  const sectionNext = {
    type: "View",
    id: "section-next",
    orientation: "vertical",
    width: "matchParent",
    height: "wrapContent",
    topMargin: 40,
    child: [
      {
        type: "Collection",
        id: `${idBase}_next`,
        width: "matchParent",
        height: "wrapContent",
        items: "@{nextReadLinks}",
        cellIdProperty: "id",
        lazy: false,
        scrollEnabled: false,
        sections: [{ cell: "cells/next_step_card" }],
      },
    ],
  };

  // ---------------------------------------------------------------------
  // § 4 — Right-rail TOC wrapper (Plan 01 §"Right-rail TOC wrapper").
  // Header sits OUTSIDE the 2-column wrapper so the rail aligns to the
  // first content section.
  // ---------------------------------------------------------------------
  const contentWithRail = {
    type: "View",
    id: `${idBase}_content_with_rail`,
    orientation: "horizontal",
    width: "matchParent",
    height: "wrapContent",
    topMargin: 8,
    child: [
      {
        type: "View",
        id: `${idBase}_column_body`,
        orientation: "vertical",
        weight: 1,
        height: "wrapContent",
        child: [
          sectionOverview,
          sectionDetail,
          sectionNext,
        ],
      },
      {
        type: "View",
        id: `${idBase}_column_rail`,
        orientation: "vertical",
        width: 240,
        height: "wrapContent",
        leftMargin: 32,
        paddings: [28, 0, 0, 0],
        child: [
          {
            type: "TableOfContents",
            id: `${idBase}_toc`,
            width: "matchParent",
            height: "wrapContent",
            items: "@{tocEntries}",
            sticky: true,
            stickyOffset: 80,
            maxDepth: 1,
          },
        ],
      },
    ],
  };

  return {
    type: "View",
    id: `${idBase}_root`,
    orientation: "vertical",
    width: "matchParent",
    height: "matchParent",
    background: "surface_muted",
    child: [
      {
        data: [
          // --- Page header (Plan 01) ---------------------------------------
          { name: "title", class: "String" },
          { name: "description", class: "String" },
          { name: "kicker", class: "String", defaultValue: "Attribute category · Reference" },
          { name: "kickerParentLabel", class: "String", defaultValue: "Attributes" },
          { name: "badges", class: "CollectionDataSource" },
          { name: "copyTypeVisibility", class: "String", defaultValue: "gone" },
          { name: "aliasCalloutVisibility", class: "String", defaultValue: "gone" },
          { name: "aliasNotice", class: "String", defaultValue: "" },
          { name: "onCopyTypeName", class: "() -> Void" },
          { name: "onNavigateBreadcrumb", class: "() -> Void" },

          // --- Overview (Plan 03 §1) ---------------------------------------
          { name: "overviewRows", class: "CollectionDataSource" },

          // --- Detail (Plan 03 §2) -----------------------------------------
          { name: "attributes", class: "CollectionDataSource" },

          // --- Next reads --------------------------------------------------
          { name: "nextReadLinks", class: "CollectionDataSource" },

          // --- TOC rail (Plan 01) ------------------------------------------
          { name: "tocEntries", class: "Array" },
        ],
      },
      {
        type: "View",
        id: `${idBase}_scroll`,
        orientation: "vertical",
        width: "matchParent",
        weight: 1,
        paddings: [24, 32, 24, 32],
        child: [
          pageHeader,
          contentWithRail,
        ],
      },
    ],
    _comment: "Auto-generated by scripts/build-attribute-reference.ts. Structure follows docs/plans/reference-detail-redesign/01-shared-page-header.md and 03-attribute-category-layout.md.",
  };
}

// ---------------------------------------------------------------------------
// Cell layouts (one-shot scaffolds, only written if missing)
// ---------------------------------------------------------------------------

function attributeRowCell(): unknown {
  return {
    type: "View",
    orientation: "vertical",
    width: "matchParent",
    height: "wrapContent",
    paddings: [16, 16, 16, 16],
    topMargin: 8,
    background: "surface",
    cornerRadius: 8,
    borderColor: "border",
    borderWidth: 1,
    child: [
      {
        data: [
          { name: "name", class: "String" },
          { name: "type", class: "String" },
          { name: "required", class: "String", defaultValue: "" },
          { name: "description", class: "String" },
          { name: "note", class: "String", defaultValue: "" },
        ],
      },
      {
        type: "View",
        orientation: "horizontal",
        width: "matchParent",
        height: "wrapContent",
        child: [
          {
            type: "Label",
            width: "wrapContent",
            height: "wrapContent",
            fontSize: 14,
            fontFamily: "monospace",
            fontWeight: "semibold",
            fontColor: "ink",
            text: "@{name}",
          },
          {
            type: "Label",
            width: "wrapContent",
            height: "wrapContent",
            leftMargin: 12,
            fontSize: 12,
            fontColor: "accent_secondary",
            fontFamily: "monospace",
            text: "@{type}",
          },
          {
            type: "Label",
            width: "wrapContent",
            height: "wrapContent",
            leftMargin: 12,
            fontSize: 11,
            fontWeight: "semibold",
            fontColor: "danger",
            text: "@{required}",
          },
        ],
      },
      {
        type: "Label",
        width: "matchParent",
        height: "wrapContent",
        topMargin: 8,
        fontSize: 14,
        fontColor: "ink_muted",
        text: "@{description}",
      },
      {
        type: "Label",
        width: "matchParent",
        height: "wrapContent",
        topMargin: 8,
        fontSize: 13,
        fontColor: "ink_subtle",
        text: "@{note}",
      },
    ],
    _comment: "Auto-scaffolded by scripts/build-attribute-reference.ts. Hand-edit or replace during design pass.",
  };
}

function codeExampleCell(): unknown {
  return {
    type: "View",
    orientation: "vertical",
    width: "matchParent",
    height: "wrapContent",
    paddings: [16, 16, 16, 16],
    topMargin: 8,
    background: "surface",
    cornerRadius: 8,
    borderColor: "border",
    borderWidth: 1,
    child: [
      {
        data: [
          { name: "title", class: "String" },
          { name: "language", class: "String", defaultValue: "text" },
          { name: "code", class: "String", defaultValue: "" },
          { name: "note", class: "String", defaultValue: "" },
        ],
      },
      {
        type: "View",
        orientation: "horizontal",
        width: "matchParent",
        height: "wrapContent",
        child: [
          {
            type: "Label",
            height: "wrapContent",
            weight: 1,
            fontSize: 14,
            fontWeight: "semibold",
            fontColor: "ink",
            text: "@{title}",
          },
          {
            type: "Label",
            width: "wrapContent",
            height: "wrapContent",
            paddings: [2, 8, 2, 8],
            background: "accent_tint",
            cornerRadius: 4,
            fontSize: 11,
            fontFamily: "monospace",
            fontColor: "accent_secondary_strong",
            text: "@{language}",
          },
        ],
      },
      {
        type: "CodeBlock",
        width: "matchParent",
        height: "wrapContent",
        topMargin: 8,
        code: "@{code}",
        language: "@{language}",
        showLineNumbers: false,
        copyable: true,
      },
      {
        type: "Label",
        width: "matchParent",
        height: "wrapContent",
        topMargin: 8,
        fontSize: 12,
        fontColor: "ink_subtle",
        text: "@{note}",
      },
    ],
    _comment: "Auto-scaffolded by scripts/build-attribute-reference.ts. Hand-edit or replace during design pass.",
  };
}

function relatedPillCell(): unknown {
  // Plan 02 §6 — rewritten as a horizontal card (icon + name + hint) while
  // keeping the original cell filename for backward-compat with existing
  // references in build output.
  return {
    type: "View",
    orientation: "horizontal",
    width: "matchParent",
    height: "wrapContent",
    topMargin: 8,
    paddings: [14, 14, 14, 14],
    background: "surface",
    cornerRadius: 10,
    borderColor: "border",
    borderWidth: 1,
    tapBackground: "surface_sunken",
    child: [
      {
        data: [
          { name: "name", class: "String" },
          { name: "hint", class: "String", defaultValue: "" },
          { name: "onClick", class: "() -> Void" },
        ],
      },
      {
        type: "View",
        width: "wrapContent",
        height: "wrapContent",
        paddings: [6, 6, 6, 6],
        background: "accent_tint",
        cornerRadius: 6,
        child: [
          {
            type: "Label",
            width: "wrapContent",
            height: "wrapContent",
            fontSize: 10,
            fontFamily: "monospace",
            fontWeight: "semibold",
            fontColor: "accent_secondary_strong",
            text: "{ }",
          },
        ],
      },
      {
        type: "View",
        orientation: "vertical",
        height: "wrapContent",
        weight: 1,
        leftMargin: 12,
        child: [
          {
            type: "Label",
            width: "matchParent",
            height: "wrapContent",
            fontSize: 14,
            fontWeight: "semibold",
            fontColor: "ink",
            onClick: "@{onClick}",
            text: "@{name}",
          },
          {
            type: "Label",
            width: "matchParent",
            height: "wrapContent",
            topMargin: 4,
            fontSize: 12,
            fontColor: "ink_subtle",
            text: "@{hint}",
          },
        ],
      },
    ],
    _comment: "Related-components card. Rewritten per docs/plans/reference-detail-redesign/02-component-detail-layout.md §6.",
  };
}

function categoryChipCell(): unknown {
  // Plan 02 §3 — horizontal chip row for the attribute category nav.
  // Non-interactive fallback (Plan 02 permits this): the right-rail TOC
  // handles anchor nav, so chips render as styled labels. Extra fields from
  // the row data (id / anchorUrl) are ignored by the cell — they stay in the
  // runtime JSON so a future iteration can wire onClick without touching
  // the emitter.
  return {
    type: "View",
    orientation: "horizontal",
    width: "wrapContent",
    height: "wrapContent",
    rightMargin: 6,
    paddings: [6, 12, 6, 12],
    background: "surface_sunken",
    cornerRadius: 6,
    child: [
      {
        data: [
          { name: "label", class: "String" },
        ],
      },
      {
        type: "Label",
        width: "wrapContent",
        height: "wrapContent",
        fontSize: 12,
        fontWeight: "semibold",
        fontFamily: "monospace",
        fontColor: "ink",
        text: "@{label}",
      },
    ],
    _comment: "Attribute-category chip. See docs/plans/reference-detail-redesign/02-component-detail-layout.md §3.",
  };
}

// ---------------------------------------------------------------------------
// Category / chip / platform-matrix helpers (Plan 06)
// ---------------------------------------------------------------------------

type CategoryKey =
  | "common"
  | "style"
  | "layout"
  | "spacing"
  | "alignment"
  | "state"
  | "binding"
  | "event"
  | "responsive"
  | "misc";

const CATEGORY_KEYS: CategoryKey[] = [
  "common",
  "style",
  "layout",
  "spacing",
  "alignment",
  "state",
  "binding",
  "event",
  "responsive",
  "misc",
];

const CATEGORY_LABELS: Record<CategoryKey, Lang2> = {
  common:     { en: "Common",     ja: "共通" },
  style:      { en: "Style",      ja: "スタイル" },
  layout:     { en: "Layout",     ja: "レイアウト" },
  spacing:    { en: "Spacing",    ja: "スペーシング" },
  alignment:  { en: "Alignment",  ja: "配置" },
  state:      { en: "State",      ja: "状態" },
  binding:    { en: "Binding",    ja: "バインディング" },
  event:      { en: "Event",      ja: "イベント" },
  responsive: { en: "Responsive", ja: "レスポンシブ" },
  misc:       { en: "Misc",       ja: "その他" },
};

function attrCategoryKey(name: string, categoryMap: Record<string, string>): CategoryKey {
  if (name.startsWith("on")) return "event";
  const mapped = categoryMap[name];
  if (mapped && (CATEGORY_KEYS as string[]).includes(mapped)) {
    return mapped as CategoryKey;
  }
  return "common";
}

function splitAttributesByCategory(
  attrs: MergedAttribute[],
  categoryMap: Record<string, string>,
): Record<CategoryKey, MergedAttribute[]> {
  const buckets: Record<CategoryKey, MergedAttribute[]> = {
    common: [],
    style: [],
    layout: [],
    spacing: [],
    alignment: [],
    state: [],
    binding: [],
    event: [],
    responsive: [],
    misc: [],
  };
  for (const a of attrs) {
    buckets[attrCategoryKey(a.name, categoryMap)].push(a);
  }
  return buckets;
}

type StatCounts = { required: number; optional: number; events: number };

function computeStatCounts(attrs: MergedAttribute[]): StatCounts {
  let required = 0;
  let optional = 0;
  let events = 0;
  for (const a of attrs) {
    if (a.name.startsWith("on")) events++;
    if (a.required) required++;
    else optional++;
  }
  return { required, optional, events };
}

// CSS custom-property reference. Runtime-bound colors must use var() (not raw
// hex) so the [data-color-mode="dark"] cascade in globals.css can re-theme the
// inline style at paint time. Static hex values inside Layout JSON are handled
// separately by the build-time color extractor.
function cssVar(token: string): string {
  return `var(--color-${token})`;
}

// Map a single type token to a chip background / foreground token pair.
// Returns CSS var() references so dark-mode cascade works.
function chipColorsFor(tok: string): { background: string; fontColor: string } {
  const t = tok.trim();
  if (t.startsWith("enum(")) return { background: cssVar("surface_sunken"), fontColor: cssVar("ink") };
  if (t === "string") return { background: cssVar("chip_string_bg"), fontColor: cssVar("chip_string_fg") };
  if (t === "number" || t === "number[]") return { background: cssVar("warning_chip_bg"), fontColor: cssVar("warning_chip_fg") };
  if (t === "boolean") return { background: cssVar("accent_secondary_tint"), fontColor: cssVar("accent_secondary_strong") };
  if (t === "binding" || t.startsWith("@{")) return { background: cssVar("accent_tint"), fontColor: cssVar("accent_secondary_strong") };
  if (t === "@string/key" || t.startsWith("@string")) return { background: cssVar("chip_string_key_bg"), fontColor: cssVar("chip_string_key_fg") };
  if (t === "() -> Void" || t === "event") return { background: cssVar("chip_event_bg"), fontColor: cssVar("chip_event_fg") };
  return { background: cssVar("surface_sunken"), fontColor: cssVar("ink") };
}

type TypeChip = { id: string; label: string; background: string; fontColor: string };

function buildTypeChips(type: string): TypeChip[] {
  // Split on ' | ' but keep enum(...) tokens intact.
  const tokens: string[] = [];
  let depth = 0;
  let buf = "";
  for (let i = 0; i < type.length; i++) {
    const ch = type[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (depth === 0 && type.slice(i, i + 3) === " | ") {
      tokens.push(buf.trim());
      buf = "";
      i += 2;
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) tokens.push(buf.trim());
  return tokens.map((label, idx) => {
    const colors = chipColorsFor(label);
    return { id: `tc_${idx}`, label, ...colors };
  });
}

type EnumChip = { id: string; label: string; background: string; fontColor: string };

function buildEnumChips(values: string[] | undefined): EnumChip[] {
  if (!values || values.length === 0) return [];
  return values.map((v, idx) => ({
    id: `ec_${idx}`,
    label: v,
    background: cssVar("surface_sunken"),
    fontColor: cssVar("ink"),
  }));
}

function buildAliasChips(aliases: string[] | undefined): EnumChip[] {
  if (!aliases || aliases.length === 0) return [];
  return aliases.map((v, idx) => ({
    id: `al_${idx}`,
    label: v,
    background: cssVar("surface_sunken"),
    fontColor: cssVar("ink"),
  }));
}

function buildPlatformMatrix(
  attrPlatformDiff: Record<string, string> | undefined,
  componentPlatforms: Platforms,
  attrPlatform: string | undefined,
): {
  visibility: string;
  ios: string;
  android: string;
  web: string;
} {
  const fallback = (p: Support, explicit?: string): string => {
    if (explicit) return explicit;
    if (p === "yes") return "✓";
    if (p === "partial") return "✓ (partial)";
    return "—";
  };
  const hasDiff = attrPlatformDiff && Object.keys(attrPlatformDiff).length > 0;
  const attrPlatformHint = attrPlatform
    ? (p: Support) => (attrPlatform === "ios" ? (p === "yes" ? undefined : "—") : undefined)
    : () => undefined;
  const result = {
    visibility: hasDiff ? "visible" : "gone",
    ios: fallback(componentPlatforms.ios, attrPlatformDiff?.ios ?? attrPlatformHint(componentPlatforms.ios)),
    android: fallback(componentPlatforms.android, attrPlatformDiff?.android),
    web: fallback(componentPlatforms.web, attrPlatformDiff?.web),
  };
  // Also show matrix when any component-level platform is not "yes".
  if (
    componentPlatforms.ios !== "yes" ||
    componentPlatforms.android !== "yes" ||
    componentPlatforms.web !== "yes"
  ) {
    result.visibility = "visible";
  }
  return result;
}

type BadgeRow = { id: string; label: string; fontColor: string };

function supportFontColor(s: Support): string {
  if (s === "yes") return cssVar("ink");
  if (s === "partial") return cssVar("ink_subtle");
  return cssVar("ink_faint");
}

function platformLabel(name: string, s: Support): string {
  if (s === "partial") return `${name}*`;
  if (s === "no") return `${name} ✗`;
  return name;
}

function buildPlatformBadges(platforms: Platforms): BadgeRow[] {
  return [
    { id: "platform_ios", label: platformLabel("iOS", platforms.ios), fontColor: supportFontColor(platforms.ios) },
    { id: "platform_android", label: platformLabel("Android", platforms.android), fontColor: supportFontColor(platforms.android) },
    { id: "platform_web", label: platformLabel("Web", platforms.web), fontColor: supportFontColor(platforms.web) },
  ];
}

function buildCanonical(
  canonical: { language: string; code: string } | undefined,
  examples: ExampleOverride[],
  componentName: string,
): { language: string; code: string } {
  if (canonical) return canonical;
  const first = examples[0];
  if (first) {
    if (first.variants && first.variants.length > 0) {
      const spec = first.variants.find((v) => v.language === "json") ?? first.variants[0];
      return { language: spec.language, code: spec.code };
    }
    if (first.code) return { language: first.language ?? "json", code: first.code };
  }
  return {
    language: "json",
    code: `{\n  "type": "${componentName}"\n}`,
  };
}

const TAB_LABEL_FALLBACK: Record<string, string> = {
  json: "Spec",
  swift: "Swift",
  kotlin: "Kotlin",
  typescript: "React",
  tsx: "React",
  jsx: "React",
  javascript: "JS",
};

type TabRow = {
  id: string;
  label: string;
  background: string;
  borderColor: string;
  fontColor: string;
  fontWeight: string;
};

function buildTabRows(variants: ExampleVariant[], activeLanguage: string): TabRow[] {
  return variants.map((v, idx) => {
    const isActive = v.language === activeLanguage;
    const label = v.label ?? TAB_LABEL_FALLBACK[v.language] ?? v.language;
    return {
      id: `tab_${idx}_${v.language}`,
      label,
      background: isActive ? cssVar("code_surface") : cssVar("surface"),
      borderColor: isActive ? cssVar("code_surface") : cssVar("border"),
      fontColor: isActive ? cssVar("chrome_ink") : cssVar("ink_muted"),
      fontWeight: isActive ? "semibold" : "normal",
    };
  });
}

type ExampleRow = {
  id: string;
  anchorId: string;
  title: Lang2;
  description: Lang2;
  descriptionVisibility: string;
  filePath: string;
  filePathVisibility: string;
  tabs: { sections: [{ cells: { data: TabRow[] } }] };
  tabsVisibility: string;
  languagePill: string;
  languagePillVisibility: string;
  activeLanguage: string;
  activeCode: string;
  note: Lang2;
  noteVisibility: string;
  // Hook-internal: full variant list. Never bound by Layouts.
  _variants: ExampleVariant[];
  // Legacy fields kept for backward compat with the current cell.
  language: string;
  code: string;
  required: string;
};

function normalizeExample(ex: ExampleOverride, idx: number): ExampleRow {
  const id = `example_${idx + 1}`;
  const anchorId = `example-${idx + 1}`;
  const variants: ExampleVariant[] =
    ex.variants && ex.variants.length > 0
      ? ex.variants
      : [{ language: ex.language ?? "json", code: ex.code ?? "" }];
  const active = variants[0];
  const multi = variants.length > 1;
  return {
    id,
    anchorId,
    title: ex.title,
    description: ex.description ?? { en: "", ja: "" },
    descriptionVisibility: ex.description && (ex.description.en || ex.description.ja) ? "visible" : "gone",
    filePath: ex.filePath ?? "",
    filePathVisibility: ex.filePath ? "visible" : "gone",
    tabs: { sections: [{ cells: { data: multi ? buildTabRows(variants, active.language) : [] } }] },
    tabsVisibility: multi ? "visible" : "gone",
    languagePill: active.language,
    languagePillVisibility: multi ? "gone" : "visible",
    activeLanguage: active.language,
    activeCode: active.code,
    note: ex.note ?? { en: "", ja: "" },
    noteVisibility: ex.note && (ex.note.en || ex.note.ja) ? "visible" : "gone",
    _variants: variants,
    language: active.language,
    code: active.code,
    required: "",
  };
}

type OverviewRow = {
  id: string;
  name: string;
  type: string;
  summary: string;
  anchorUrl: string;
};

function shortenSummaryPerLang(desc: string): string {
  const oneLine = desc.replace(/\s+/g, " ").trim();
  return oneLine.length > 100 ? oneLine.slice(0, 97) + "…" : oneLine;
}

// Accepts either a plain English string or a Lang2 object. When Lang2, returns
// a bilingual object with each side shortened independently so the hook's
// pickLangDeep can pick the right one.
function shortenSummary(desc: string | Lang2): string | Lang2 {
  if (typeof desc === "string") return shortenSummaryPerLang(desc);
  return {
    en: shortenSummaryPerLang(desc.en ?? ""),
    ja: shortenSummaryPerLang(desc.ja ?? ""),
  };
}

function buildOverviewRows(attrs: MergedCategoryAttribute[]): OverviewRow[] {
  return attrs.map((a) => ({
    id: `overview_${a.name}`,
    name: a.name,
    type: a.type,
    summary: shortenSummary(a.description) as unknown as string,
    anchorUrl: `#attr-${a.name}`,
  }));
}

type SubgroupEntry = { id: string; key: string; label: string; anchorUrl: string };

function capLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function splitBySubgroup(attrs: MergedCategoryAttribute[]): {
  subgroups: SubgroupEntry[];
  bySubgroup: Record<string, MergedCategoryAttribute[]>;
  hasSubgroups: boolean;
} {
  const bySubgroup: Record<string, MergedCategoryAttribute[]> = {};
  for (const a of attrs) {
    const key = a.subgroup ?? "__none__";
    (bySubgroup[key] ??= []).push(a);
  }
  const keys = Object.keys(bySubgroup).filter((k) => k !== "__none__");
  const hasSubgroups = keys.length > 0;
  const subgroups: SubgroupEntry[] = keys.sort().map((k) => ({
    id: `subgroup_${k}`,
    key: k,
    label: capLabel(k),
    anchorUrl: `#subgroup-${k}`,
  }));
  return { subgroups, bySubgroup, hasSubgroups };
}

type VisibilityFlags = {
  requiredChipText: string;
  requiredChipVisibility: string;
  deprecatedChipVisibility: string;
  accentBarColor: string;
  nameTextStyle: string;
  nameFontColor: string;
  defaultChipText: string;
  defaultChipVisibility: string;
  enumChipsVisibility: string;
  aliasChipsVisibility: string;
  noteVisibility: string;
};

function computeAttrVisibility(a: {
  required?: boolean;
  deprecated?: { replacement?: string; sinceVersion?: string };
  default?: string;
  enumValues?: string[];
  aliases?: string[];
  note?: Lang2;
}): VisibilityFlags {
  const isRequired = !!a.required;
  const isDeprecated = !!a.deprecated;
  const hasEnum = !!a.enumValues && a.enumValues.length > 0;
  const hasAliases = !!a.aliases && a.aliases.length > 0;
  const hasNote = !!a.note && !!(a.note.en || a.note.ja);
  const hasDefault = a.default !== undefined && a.default !== null && a.default !== "";
  return {
    requiredChipText: isRequired ? "required" : "",
    requiredChipVisibility: isRequired ? "visible" : "gone",
    deprecatedChipVisibility: isDeprecated ? "visible" : "gone",
    accentBarColor: isRequired ? cssVar("danger") : isDeprecated ? cssVar("traffic_yellow") : cssVar("border"),
    nameTextStyle: isDeprecated ? "strikethrough" : "normal",
    nameFontColor: isDeprecated ? cssVar("ink_faint") : cssVar("ink"),
    defaultChipText: hasDefault ? `default: ${a.default}` : "",
    defaultChipVisibility: hasDefault ? "visible" : "gone",
    enumChipsVisibility: hasEnum ? "visible" : "gone",
    aliasChipsVisibility: hasAliases ? "visible" : "gone",
    noteVisibility: hasNote ? "visible" : "gone",
  };
}

function buildAttributeRow(
  a: MergedAttribute,
  componentPlatforms: Platforms,
): Record<string, unknown> {
  const flags = computeAttrVisibility(a);
  const matrix = buildPlatformMatrix(a.platformDiff, componentPlatforms, a.platform);
  return {
    id: a.id,
    name: a.name,
    anchorId: `attr-${a.name}`,
    ...flags,
    typeChips: asCollection(buildTypeChips(a.type)),
    enumChips: asCollection(buildEnumChips(a.enumValues)),
    aliasChips: asCollection(buildAliasChips(a.aliases)),
    description: a.description,
    platformMatrixVisibility: matrix.visibility,
    platformIosLabel: matrix.ios,
    platformAndroidLabel: matrix.android,
    platformWebLabel: matrix.web,
    note: a.note ?? { en: "", ja: "" },
    // Legacy fields kept for backward compat with the current cell.
    type: a.type,
    required: a.required ? "required" : "",
  };
}

function buildCategoryAttributeRow(
  a: MergedCategoryAttribute,
  categoryDefaultPlatforms: Platforms,
): Record<string, unknown> {
  const flags = computeAttrVisibility(a);
  const matrix = buildPlatformMatrix(a.platformDiff, categoryDefaultPlatforms, a.platform);
  return {
    id: a.id,
    name: a.name,
    anchorId: `attr-${a.name}`,
    ...flags,
    typeChips: asCollection(buildTypeChips(a.type)),
    enumChips: asCollection(buildEnumChips(a.enumValues)),
    aliasChips: asCollection(buildAliasChips(a.aliases)),
    description: a.description,
    platformMatrixVisibility: matrix.visibility,
    platformIosLabel: matrix.ios,
    platformAndroidLabel: matrix.android,
    platformWebLabel: matrix.web,
    note: a.note ?? { en: "", ja: "" },
    type: a.type,
    required: a.required ? "required" : "",
  };
}

// ---------------------------------------------------------------------------
// Runtime data (shape consumed by the React hook)
// ---------------------------------------------------------------------------

type NextReadLink = {
  id: string;
  titleKey: string | Lang2;
  descriptionKey: string | Lang2;
  url: string;
};

// Bilingual next-read cards shown at the bottom of each component detail page.
// Hook's pickLangDeep flattens the Lang2 values to strings at fetch time.
function defaultNextReads(): NextReadLink[] {
  return [
    {
      id: "next_attributes",
      titleKey: { en: "Attribute reference", ja: "属性リファレンス" },
      descriptionKey: { en: "Every common attribute in one place — width / padding / binding / events grouped by category.", ja: "共通属性を 1 箇所にまとめたリファレンス。width / padding / binding / event などカテゴリ別に整理。" },
      url: "/reference/attributes",
    },
    {
      id: "next_custom_components",
      titleKey: { en: "Building a custom component", ja: "カスタムコンポーネントを作る" },
      descriptionKey: { en: "Extend JsonUI with your own components (spec → converter → React/Swift/Kotlin).", ja: "spec → converter → React/Swift/Kotlin で JsonUI を独自拡張する手順。" },
      url: "/guides/custom-components",
    },
  ];
}

// Bilingual next-reads shown on attribute category pages.
function defaultCategoryNextReads(): NextReadLink[] {
  return [
    {
      id: "next_components",
      titleKey: { en: "Component reference", ja: "コンポーネントリファレンス" },
      descriptionKey: { en: "The full 28-component catalog with type signatures, examples, and platform support.", ja: "28 コンポーネントの全カタログ。型・例・プラットフォーム対応を収録。" },
      url: "/reference/components",
    },
    {
      id: "next_attributes_root",
      titleKey: { en: "All attribute categories", ja: "属性カテゴリ一覧" },
      descriptionKey: { en: "Back to the full list of attribute categories (Layout, Style, Binding, Event, ...).", ja: "属性カテゴリ全一覧に戻る（Layout / Style / Binding / Event など）。" },
      url: "/reference/attributes",
    },
  ];
}

function asCollection<T>(data: T[]) {
  return { sections: [{ cells: { data } }] };
}

// Previously flattened `{en, ja}` Lang2 objects to English strings at build
// time. Now the runtime JSON ships both languages and the hook
// (`useComponentReference` / `useCategoryReference`) flattens against the
// active StringManager.language. Kept as a no-op for call-site symmetry.
function flattenLang(value: unknown): unknown {
  return value;
}

function componentRuntimeData(
  merged: MergedComponent,
  categoryMap: Record<string, string>,
): unknown {
  const buckets = splitAttributesByCategory(merged.attributes, categoryMap);
  const stats = computeStatCounts(merged.attributes);
  const canonical = buildCanonical(merged.canonical, merged.examples, merged.name);
  const badges = buildPlatformBadges(merged.platforms);
  const aliasCalloutVisible = !!merged.aliasOf;

  // Per-category attribute rows + visibility flags + chip-list entries.
  const perCategoryFields: Record<string, unknown> = {};
  const categoryChipRows: Array<{ id: string; label: Lang2; anchorUrl: string }> = [];
  for (const key of CATEGORY_KEYS) {
    const list = buckets[key];
    const rows = list.map((a) => buildAttributeRow(a, merged.platforms));
    const fieldKey = `attributes${capitalize(key)}`;
    const visKey = `group${capitalize(key)}Visibility`;
    perCategoryFields[fieldKey] = asCollection(rows);
    perCategoryFields[visKey] = list.length > 0 ? "visible" : "gone";
    if (list.length > 0) {
      categoryChipRows.push({
        id: `cat_${key}`,
        label: CATEGORY_LABELS[key],
        anchorUrl: `#section-${key}`,
      });
    }
  }

  // TocItem[] — shape consumed by the TableOfContents custom component.
  // Plain array (not a CollectionDataSource); field names match the component's
  // contract: { id, label, anchor (no leading #), level? }. `label` ships as
  // Lang2 so the hook's pickLangDeep localizes it before handing to the component.
  const tocEntries: Array<{ id: string; label: string | Lang2; anchor: string; level: number }> = [
    { id: "toc_glance", label: { en: "At a glance", ja: "概要" }, anchor: "section-glance", level: 1 },
    ...categoryChipRows.map((c) => ({
      id: `toc_${c.id.slice(4)}`,
      label: c.label,
      anchor: c.anchorUrl.replace(/^#/, ""),
      level: 1,
    })),
    { id: "toc_examples", label: { en: "Examples", ja: "例" }, anchor: "section-examples", level: 1 },
    { id: "toc_related", label: { en: "Related", ja: "関連" }, anchor: "section-related", level: 1 },
  ];

  const raw = {
    // Legacy / already-consumed fields (keep shape stable).
    component: merged.name,
    kebab: merged.kebab,
    aliasOf: merged.aliasOf ?? null,
    title: `${merged.name}`,
    description: merged.description,
    usage: merged.usage ?? null,
    aliasNotice: merged.aliasOf
      ? { en: `Alias of ${merged.aliasOf}. Identical runtime behavior.`, ja: `${merged.aliasOf} のエイリアス。実行時動作は同一。` }
      : null,

    // NEW (Plan 06) — shared page header inputs.
    kicker: "Component · Reference",
    kickerParentLabel: "Components",
    badges: asCollection(badges),
    copyTypeVisibility: "visible",
    aliasCalloutVisibility: aliasCalloutVisible ? "visible" : "gone",
    aliasLinkUrl: merged.aliasOf ? `/reference/components/${kebab(merged.aliasOf)}` : "",

    // NEW — at-a-glance section.
    canonicalCode: canonical.code,
    canonicalLanguage: canonical.language,
    statRequired: String(stats.required),
    statOptional: String(stats.optional),
    statEvents: String(stats.events),
    statRequiredText: { en: `${stats.required} required`, ja: `必須 ${stats.required}` },
    statOptionalText: { en: `${stats.optional} optional`, ja: `任意 ${stats.optional}` },
    statEventsText: { en: `${stats.events} events`, ja: `イベント ${stats.events}` },

    // NEW — usage visibility.
    usageVisibility:
      merged.usage && (merged.usage.en || merged.usage.ja) ? "visible" : "gone",

    // NEW — per-category attribute rows + chip list.
    attributeCategories: asCollection(categoryChipRows),
    ...perCategoryFields,

    // NEW — TOC rail entries. Plain array (TableOfContents.items contract).
    tocEntries,

    // Existing shape for examples/attributes/relatedComponents — now enriched.
    examples: asCollection((merged.examples ?? []).map((ex, i) => normalizeExample(ex, i))),
    attributes: asCollection(
      merged.attributes.map((a) => buildAttributeRow(a, merged.platforms)),
    ),
    relatedComponents: asCollection(
      merged.relatedComponents.map((r) => ({
        id: `related_${kebab(r).replace(/-/g, "_")}`,
        name: r,
        hint: "",
        url: `/reference/components/${kebab(r)}`,
      })),
    ),
    nextReadLinks: asCollection(defaultNextReads()),
  };
  return flattenLang(raw);
}

function categoryRuntimeData(merged: MergedCategory): unknown {
  const defaultPlatforms: Platforms = { ios: "yes", android: "yes", web: "yes" };
  const { subgroups, bySubgroup, hasSubgroups } = splitBySubgroup(merged.attributes);

  const perSubgroupFields: Record<string, unknown> = {};
  for (const entry of subgroups) {
    const list = bySubgroup[entry.key] ?? [];
    perSubgroupFields[`subgroup${capitalize(entry.key)}`] = asCollection(
      list.map((a) => buildCategoryAttributeRow(a, defaultPlatforms)),
    );
  }

  const tocEntries: Array<{ id: string; label: string | Lang2; anchor: string; level: number }> = [
    { id: "toc_overview", label: { en: "Overview", ja: "概要" }, anchor: "section-overview", level: 1 },
    ...(hasSubgroups
      ? subgroups.map((s) => ({
          id: `toc_${s.key}`,
          label: s.label,
          anchor: s.anchorUrl.replace(/^#/, ""),
          level: 1,
        }))
      : [{ id: "toc_detail", label: { en: "Attributes", ja: "属性" }, anchor: "section-detail", level: 1 }]),
    { id: "toc_next", label: { en: "Next reads", ja: "次に読む" }, anchor: "section-next", level: 1 },
  ];

  const raw = {
    category: merged.category,
    title: `${capitalize(merged.category)} attributes`,
    description: merged.description,

    // NEW — shared page header inputs.
    kicker: "Attribute category · Reference",
    kickerParentLabel: "Attributes",
    badges: asCollection([] as BadgeRow[]),
    copyTypeVisibility: "gone",
    aliasCalloutVisibility: "gone",
    aliasOf: null,
    aliasLinkUrl: "",
    aliasNotice: null,

    // NEW — overview table.
    overviewRows: asCollection(buildOverviewRows(merged.attributes)),

    // NEW — subgroup split (optional).
    subgroups: asCollection(subgroups),
    subgroupsVisibility: hasSubgroups ? "visible" : "gone",
    ...perSubgroupFields,

    // NEW — TOC. Plain array (TableOfContents.items contract).
    tocEntries,

    // Existing attributes flat list — now enriched.
    attributes: asCollection(
      merged.attributes.map((a) => buildCategoryAttributeRow(a, defaultPlatforms)),
    ),
    breakpoints: merged.breakpoints ?? null,
    nextReadLinks: asCollection([
      ...defaultCategoryNextReads(),
    ]),
  };
  return flattenLang(raw);
}

// ---------------------------------------------------------------------------
// Next.js page.tsx generation
// ---------------------------------------------------------------------------

function componentPage(merged: MergedComponent): string {
  const pascal = toPascal(merged.name);
  return `"use client";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  @generated AUTO-GENERATED FILE — DO NOT EDIT
// ║  Source:    scripts/build-attribute-reference.ts
// ║  Update docs/data/attribute-overrides/ and re-run \`npm run build:attrs\`.
// ╚══════════════════════════════════════════════════════════════════╝
import { useRouter } from "next/navigation";
import { useComponentReference } from "@/hooks/reference/useComponentReference";
import ${pascal} from "@/generated/components/reference/components/${pascal}";

export default function Page() {
  const router = useRouter();
  const { data } = useComponentReference(router, ${JSON.stringify(merged.name)});
  return <${pascal} data={data} />;
}
`;
}

function categoryPage(merged: MergedCategory): string {
  const pascal = capitalize(merged.category);
  return `"use client";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  @generated AUTO-GENERATED FILE — DO NOT EDIT
// ║  Source:    scripts/build-attribute-reference.ts
// ║  Update docs/data/attribute-overrides/ and re-run \`npm run build:attrs\`.
// ╚══════════════════════════════════════════════════════════════════╝
import { useRouter } from "next/navigation";
import { useCategoryReference } from "@/hooks/reference/useCategoryReference";
import ${pascal} from "@/generated/components/reference/attributes/${pascal}";

export default function Page() {
  const router = useRouter();
  const { data } = useCategoryReference(router, ${JSON.stringify(merged.category)});
  return <${pascal} data={data} />;
}
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const attrDefsFile = await readJson<Record<string, Record<string, AttrDef>>>(PATHS.attrDefs);
  const categoryMapRaw = await readJson<Record<string, unknown>>(PATHS.categoriesFile);
  const orderFile = await readJson<{ defaultOrder: string[]; overrides: Record<string, string[]> }>(PATHS.orderFile);
  const descriptionsRaw = await readJsonOptional<Record<string, unknown>>(PATHS.descriptionsFile) ?? {};

  // Shared bilingual attribute-description dictionary. Non-Lang2 entries
  // (like the `_description` frontmatter field) are filtered out.
  const descriptionsDict: Record<string, Lang2> = {};
  for (const [k, v] of Object.entries(descriptionsRaw)) {
    if (k.startsWith("_")) continue;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const obj = v as Record<string, unknown>;
      if (typeof obj.en === "string" && typeof obj.ja === "string") {
        descriptionsDict[k] = { en: obj.en, ja: obj.ja };
      }
    }
  }

  const categoryMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(categoryMapRaw)) {
    if (k.startsWith("_")) continue;
    if (typeof v === "string") categoryMap[k] = v;
  }

  const componentNames = Object.keys(attrDefsFile)
    .filter((k) => k !== "common" && !k.startsWith("_"))
    .sort();
  const commonDefs = attrDefsFile.common ?? {};

  console.log(`→ ${componentNames.length} components, ${Object.keys(commonDefs).length} common attributes, ${Object.keys(descriptionsDict).length} translated attribute descriptions`);

  // 1. Components
  let componentCount = 0;
  for (const name of componentNames) {
    const overridePath = path.join(PATHS.overridesDir, `${kebab(name).replace(/-/g, "")}.json`);
    const override = await readJsonOptional<ComponentOverride>(overridePath);

    const merged = mergeComponent({
      name,
      defAttrs: attrDefsFile[name],
      override,
      orderMap: orderFile.overrides ?? {},
      defaultOrder: orderFile.defaultOrder ?? [],
      descriptionsDict,
    });

    await writeJson(path.join(PATHS.specComponentsDir, `${merged.kebab}.spec.json`), componentSpec(merged));
    await writeJson(path.join(PATHS.layoutComponentsDir, `${merged.kebab}.json`), componentLayout(merged));
    await writeJson(path.join(PATHS.runtimeComponentsDir, `${merged.kebab}.json`), componentRuntimeData(merged, categoryMap));
    await writeText(path.join(PATHS.appComponentsDir, merged.kebab, "page.tsx"), componentPage(merged));

    componentCount++;
  }
  console.log(`  ✓ ${componentCount} component specs, layouts, runtime data, pages.`);

  // 2. Categories
  const categoryNames = Array.from(new Set(Object.values(categoryMap))).sort();
  let categoryCount = 0;
  for (const cat of categoryNames) {
    const overridePath = path.join(PATHS.overridesDir, `_common_${cat}.json`);
    const override = await readJsonOptional<CategoryOverride>(overridePath);

    const merged = mergeCategory({
      category: cat,
      allCommonDefs: commonDefs,
      categoryMap,
      override,
      descriptionsDict,
    });

    if (merged.attributes.length === 0) {
      console.warn(`  ! Category '${cat}' has 0 attributes — skipping.`);
      continue;
    }

    await writeJson(path.join(PATHS.specAttributesDir, `${cat}.spec.json`), categorySpec(merged));
    await writeJson(path.join(PATHS.layoutAttributesDir, `${cat}.json`), categoryLayout(merged));
    await writeJson(path.join(PATHS.runtimeAttributesDir, `${cat}.json`), categoryRuntimeData(merged));
    await writeText(path.join(PATHS.appAttributesDir, cat, "page.tsx"), categoryPage(merged));

    categoryCount++;
  }
  console.log(`  ✓ ${categoryCount} category specs, layouts, runtime data, pages.`);

  // 3. Cells (one-shot scaffolds)
  const cells: Array<{ name: string; layout: () => unknown }> = [
    { name: "reference_attribute_row", layout: attributeRowCell },
    { name: "reference_code_example", layout: codeExampleCell },
    { name: "reference_related_pill", layout: relatedPillCell },
    { name: "reference_category_chip", layout: categoryChipCell },
  ];
  let cellCount = 0;
  for (const cell of cells) {
    const p = path.join(PATHS.cellsDir, `${cell.name}.json`);
    if (!(await fileExists(p))) {
      await writeJson(p, cell.layout());
      cellCount++;
    }
  }
  console.log(`  ✓ ${cellCount} new cell scaffold(s) (existing cells preserved).`);

  console.log("build-attribute-reference: done");
}

main().catch((err) => {
  console.error("build-attribute-reference: failed");
  console.error(err);
  process.exit(1);
});
