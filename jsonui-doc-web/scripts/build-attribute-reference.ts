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
//
// Hand-written once (not managed by this script):
//   src/hooks/reference/useComponentReference.ts
//   src/hooks/reference/useCategoryReference.ts
//   src/repository/AttributeReferenceRepository.ts

import fs from "node:fs/promises";
import path from "node:path";

type Lang2<T = string> = { en: T; ja: T };

type AttrDef = {
  type?: string | (string | object)[];
  required?: boolean;
  description?: string;
  aliases?: string[];
  binding_direction?: string;
  enum?: string[];
  platform?: string;
};

type ComponentOverride = {
  component?: string;
  aliasOf?: string;
  description?: Lang2;
  usage?: Lang2;
  examples?: Array<{ title: Lang2; language: string; code: string; note?: Lang2 }>;
  attributes?: Record<string, { note?: Lang2; platformDiff?: Record<string, string> }>;
  commonAttributes?: Record<string, { note?: Lang2; platformDiff?: Record<string, string> }>;
  relatedComponents?: string[];
};

type CategoryOverride = {
  category?: string;
  description?: Lang2;
  attributes?: Record<string, {
    summary?: Lang2;
    values?: Array<{ value: string; description: Lang2 }>;
    examples?: Array<{ title?: Lang2; language: string; code: string }>;
    platformDiff?: Record<string, string>;
    relatedAttributes?: string[];
  }>;
  breakpoints?: Record<string, unknown>;
};

const CWD = process.cwd();
const REPO_ROOT = path.resolve(CWD, "..");

const PATHS = {
  attrDefs: path.resolve(CWD, "rjui_tools/lib/core/attribute_definitions.json"),
  overridesDir: path.resolve(REPO_ROOT, "docs/data/attribute-overrides"),
  categoriesFile: path.resolve(REPO_ROOT, "docs/data/attribute-categories.json"),
  orderFile: path.resolve(REPO_ROOT, "docs/data/attribute-order.json"),
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
  description: string;
  note?: Lang2;
  platformDiff?: Record<string, string>;
  platform?: string;
  bindingDirection?: string;
  enumValues?: string[];
  aliases?: string[];
};

type MergedComponent = {
  name: string;
  kebab: string;
  aliasOf?: string;
  description: Lang2;
  usage?: Lang2;
  examples: NonNullable<ComponentOverride["examples"]>;
  attributes: MergedAttribute[];
  relatedComponents: string[];
};

function mergeComponent(args: {
  name: string;
  defAttrs: Record<string, AttrDef>;
  override: ComponentOverride | null;
  orderMap: Record<string, string[]>;
  defaultOrder: string[];
}): MergedComponent {
  const { name, defAttrs, override, orderMap, defaultOrder } = args;
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
      id: `attr_${kebab(attrName).replace(/-/g, "_")}`,
      name: attrName,
      type: describeType(def),
      required: !!def.required,
      description: def.description ?? "",
      note: ov?.note,
      platformDiff: ov?.platformDiff,
      platform: def.platform,
      bindingDirection: def.binding_direction,
      enumValues: def.enum,
      aliases: def.aliases,
    };
  });

  return {
    name,
    kebab: kebab(name),
    aliasOf: override?.aliasOf,
    description: override?.description ?? { en: `${name} component.`, ja: `${name} コンポーネント。` },
    usage: override?.usage,
    examples: override?.examples ?? [],
    attributes,
    relatedComponents: override?.relatedComponents ?? [],
  };
}

type MergedCategoryAttribute = {
  id: string;
  name: string;
  type: string;
  required: boolean;
  description: string;
  summary?: Lang2;
  values?: Array<{ value: string; description: Lang2 }>;
  examples?: Array<{ title?: Lang2; language: string; code: string }>;
  platformDiff?: Record<string, string>;
  relatedAttributes?: string[];
  platform?: string;
  bindingDirection?: string;
  enumValues?: string[];
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
}): MergedCategory {
  const { category, allCommonDefs, categoryMap, override } = args;
  const attrOverrides = override?.attributes ?? {};
  const attrNames = Object.keys(allCommonDefs).filter((k) => !k.startsWith("_") && categoryMap[k] === category).sort();

  const attributes: MergedCategoryAttribute[] = attrNames.map((attrName) => {
    const def = allCommonDefs[attrName];
    const ov = attrOverrides[attrName];
    return {
      id: `attr_${kebab(attrName).replace(/-/g, "_")}`,
      name: attrName,
      type: describeType(def),
      required: !!def.required,
      description: def.description ?? "",
      summary: ov?.summary,
      values: ov?.values,
      examples: ov?.examples,
      platformDiff: ov?.platformDiff,
      relatedAttributes: ov?.relatedAttributes,
      platform: def.platform,
      bindingDirection: def.binding_direction,
      enumValues: def.enum,
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
  return {
    type: "View",
    id: `${idBase}_root`,
    orientation: "vertical",
    width: "matchParent",
    height: "matchParent",
    background: "#F9FAFB",
    child: [
      {
        data: [
          { name: "title", class: "String" },
          { name: "description", class: "String" },
          { name: "usage", class: "String" },
          { name: "aliasNotice", class: "String", defaultValue: "" },
          { name: "attributes", class: "CollectionDataSource" },
          { name: "examples", class: "CollectionDataSource" },
          { name: "relatedComponents", class: "CollectionDataSource" },
          { name: "nextReadLinks", class: "CollectionDataSource" },
          { name: "onNavigateBack", class: "() -> Void" },
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
          {
            type: "Label",
            id: `${idBase}_breadcrumb`,
            width: "wrapContent",
            height: "wrapContent",
            fontSize: 13,
            fontWeight: "semibold",
            fontColor: "#64748B",
            tapBackground: "#F3F4F6",
            text: "Components",
            onClick: "@{onNavigateBack}",
          },
          {
            type: "Label",
            id: `${idBase}_title`,
            width: "matchParent",
            height: "wrapContent",
            topMargin: 16,
            fontSize: 40,
            fontWeight: "bold",
            fontColor: "#0B1220",
            text: "@{title}",
          },
          {
            type: "Label",
            id: `${idBase}_alias_notice`,
            width: "matchParent",
            height: "wrapContent",
            topMargin: 8,
            fontSize: 13,
            fontColor: "#6366F1",
            text: "@{aliasNotice}",
          },
          {
            type: "Label",
            id: `${idBase}_description`,
            width: "matchParent",
            height: "wrapContent",
            topMargin: 16,
            fontSize: 17,
            fontColor: "#475467",
            text: "@{description}",
          },
          {
            type: "Label",
            id: `${idBase}_usage`,
            width: "matchParent",
            height: "wrapContent",
            topMargin: 16,
            fontSize: 15,
            fontColor: "#475467",
            text: "@{usage}",
          },
          {
            type: "Label",
            id: `${idBase}_attrs_heading`,
            width: "matchParent",
            height: "wrapContent",
            topMargin: 32,
            fontSize: 22,
            fontWeight: "bold",
            fontColor: "#0B1220",
            text: "Attributes",
          },
          {
            type: "Collection",
            id: `${idBase}_attributes`,
            width: "matchParent",
            height: "wrapContent",
            topMargin: 12,
            items: "@{attributes}",
            cellIdProperty: "id",
            lazy: false,
            scrollEnabled: false,
            sections: [{ cell: "cells/reference_attribute_row" }],
          },
          {
            type: "Label",
            id: `${idBase}_examples_heading`,
            width: "matchParent",
            height: "wrapContent",
            topMargin: 32,
            fontSize: 22,
            fontWeight: "bold",
            fontColor: "#0B1220",
            text: "Examples",
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
          {
            type: "Label",
            id: `${idBase}_related_heading`,
            width: "matchParent",
            height: "wrapContent",
            topMargin: 32,
            fontSize: 22,
            fontWeight: "bold",
            fontColor: "#0B1220",
            text: "Related components",
          },
          {
            type: "Collection",
            id: `${idBase}_related`,
            width: "matchParent",
            height: "wrapContent",
            topMargin: 12,
            orientation: "horizontal",
            items: "@{relatedComponents}",
            cellIdProperty: "id",
            lazy: false,
            scrollEnabled: false,
            sections: [{ cell: "cells/reference_related_pill" }],
          },
          {
            type: "Collection",
            id: `${idBase}_next`,
            width: "matchParent",
            height: "wrapContent",
            topMargin: 40,
            items: "@{nextReadLinks}",
            cellIdProperty: "id",
            lazy: false,
            scrollEnabled: false,
            sections: [{ cell: "cells/next_step_card" }],
          },
        ],
      },
    ],
    _comment: "Auto-generated by scripts/build-attribute-reference.ts. Structure follows docs/plans/14-attribute-reference-generation.md.",
  };
}

function categoryLayout(merged: MergedCategory): unknown {
  const idBase = `reference_attributes_${merged.category}`;
  return {
    type: "View",
    id: `${idBase}_root`,
    orientation: "vertical",
    width: "matchParent",
    height: "matchParent",
    background: "#F9FAFB",
    child: [
      {
        data: [
          { name: "title", class: "String" },
          { name: "description", class: "String" },
          { name: "attributes", class: "CollectionDataSource" },
          { name: "nextReadLinks", class: "CollectionDataSource" },
          { name: "onNavigateBack", class: "() -> Void" },
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
          {
            type: "Label",
            id: `${idBase}_breadcrumb`,
            width: "wrapContent",
            height: "wrapContent",
            fontSize: 13,
            fontWeight: "semibold",
            fontColor: "#64748B",
            tapBackground: "#F3F4F6",
            text: "Attributes",
            onClick: "@{onNavigateBack}",
          },
          {
            type: "Label",
            id: `${idBase}_title`,
            width: "matchParent",
            height: "wrapContent",
            topMargin: 16,
            fontSize: 40,
            fontWeight: "bold",
            fontColor: "#0B1220",
            text: "@{title}",
          },
          {
            type: "Label",
            id: `${idBase}_description`,
            width: "matchParent",
            height: "wrapContent",
            topMargin: 16,
            fontSize: 17,
            fontColor: "#475467",
            text: "@{description}",
          },
          {
            type: "Collection",
            id: `${idBase}_attributes`,
            width: "matchParent",
            height: "wrapContent",
            topMargin: 24,
            items: "@{attributes}",
            cellIdProperty: "id",
            lazy: false,
            scrollEnabled: false,
            sections: [{ cell: "cells/reference_attribute_row" }],
          },
          {
            type: "Collection",
            id: `${idBase}_next`,
            width: "matchParent",
            height: "wrapContent",
            topMargin: 40,
            items: "@{nextReadLinks}",
            cellIdProperty: "id",
            lazy: false,
            scrollEnabled: false,
            sections: [{ cell: "cells/next_step_card" }],
          },
        ],
      },
    ],
    _comment: "Auto-generated by scripts/build-attribute-reference.ts. Structure follows docs/plans/14-attribute-reference-generation.md.",
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
    background: "#FFFFFF",
    cornerRadius: 8,
    borderColor: "#E5E7EB",
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
            fontColor: "#0B1220",
            text: "@{name}",
          },
          {
            type: "Label",
            width: "wrapContent",
            height: "wrapContent",
            leftMargin: 12,
            fontSize: 12,
            fontColor: "#6366F1",
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
            fontColor: "#DC2626",
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
        fontColor: "#475467",
        text: "@{description}",
      },
      {
        type: "Label",
        width: "matchParent",
        height: "wrapContent",
        topMargin: 8,
        fontSize: 13,
        fontColor: "#64748B",
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
    background: "#FFFFFF",
    cornerRadius: 8,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    child: [
      {
        data: [
          { name: "title", class: "String" },
          { name: "language", class: "String" },
          { name: "code", class: "String" },
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
            fontColor: "#0B1220",
            text: "@{title}",
          },
          {
            type: "Label",
            width: "wrapContent",
            height: "wrapContent",
            paddings: [2, 8, 2, 8],
            background: "#EEF2FF",
            cornerRadius: 4,
            fontSize: 11,
            fontFamily: "monospace",
            fontColor: "#4F46E5",
            text: "@{language}",
          },
        ],
      },
      {
        type: "Label",
        width: "matchParent",
        height: "wrapContent",
        topMargin: 8,
        paddings: [12, 12, 12, 12],
        background: "#0F172A",
        fontFamily: "monospace",
        fontSize: 13,
        fontColor: "#F9FAFB",
        cornerRadius: 6,
        text: "@{code}",
      },
      {
        type: "Label",
        width: "matchParent",
        height: "wrapContent",
        topMargin: 8,
        fontSize: 12,
        fontColor: "#64748B",
        text: "@{note}",
      },
    ],
    _comment: "Auto-scaffolded by scripts/build-attribute-reference.ts. Hand-edit or replace during design pass.",
  };
}

function relatedPillCell(): unknown {
  return {
    type: "View",
    orientation: "horizontal",
    width: "wrapContent",
    height: "wrapContent",
    paddings: [6, 12, 6, 12],
    rightMargin: 8,
    background: "#EEF2FF",
    cornerRadius: 999,
    tapBackground: "#E0E7FF",
    child: [
      {
        data: [
          { name: "name", class: "String" },
          { name: "onClick", class: "() -> Void" },
        ],
      },
      {
        type: "Label",
        width: "wrapContent",
        height: "wrapContent",
        fontSize: 13,
        fontWeight: "semibold",
        fontColor: "#4F46E5",
        onClick: "@{onClick}",
        text: "@{name}",
      },
    ],
    _comment: "Auto-scaffolded by scripts/build-attribute-reference.ts. Hand-edit or replace during design pass.",
  };
}

// ---------------------------------------------------------------------------
// Runtime data (shape consumed by the React hook)
// ---------------------------------------------------------------------------

type NextReadLink = { id: string; titleKey: string; descriptionKey: string; url: string };

function defaultNextReads(): NextReadLink[] {
  return [
    { id: "next_attributes", titleKey: "next_attributes_title", descriptionKey: "next_attributes_body", url: "/reference/attributes" },
    { id: "next_custom_components", titleKey: "next_custom_components_title", descriptionKey: "next_custom_components_body", url: "/guides/custom-components" },
  ];
}

function asCollection<T>(data: T[]) {
  return { sections: [{ cells: { data } }] };
}

// Flattens any { en, ja } Lang2 values inside an object / array tree to plain
// strings (picks `en`). React cells cannot render objects as children; the
// runtime JSON must ship strings.
function flattenLang(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(flattenLang);
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);
  const isLang2 = keys.length > 0 && keys.every((k) => k === "en" || k === "ja");
  if (isLang2) {
    return (obj.en ?? obj.ja ?? "") as string;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = flattenLang(v);
  return out;
}

function componentRuntimeData(merged: MergedComponent): unknown {
  const raw = {
    component: merged.name,
    kebab: merged.kebab,
    aliasOf: merged.aliasOf ?? null,
    title: `${merged.name}`,
    description: merged.description,
    usage: merged.usage ?? null,
    aliasNotice: merged.aliasOf
      ? { en: `Alias of ${merged.aliasOf}. Identical runtime behavior.`, ja: `${merged.aliasOf} のエイリアス。実行時動作は同一。` }
      : null,
    examples: asCollection(
      (merged.examples ?? []).map((ex, i) => ({
        id: `example_${i + 1}`,
        ...ex,
        required: "",
      }))
    ),
    attributes: asCollection(
      merged.attributes.map((a) => ({
        ...a,
        required: a.required ? "required" : "",
      }))
    ),
    relatedComponents: asCollection(
      merged.relatedComponents.map((r) => ({
        id: `related_${kebab(r).replace(/-/g, "_")}`,
        name: r,
        url: `/reference/components/${kebab(r)}`,
      }))
    ),
    nextReadLinks: asCollection(defaultNextReads()),
  };
  return flattenLang(raw);
}

function categoryRuntimeData(merged: MergedCategory): unknown {
  const raw = {
    category: merged.category,
    title: `${capitalize(merged.category)} attributes`,
    description: merged.description,
    attributes: asCollection(
      merged.attributes.map((a) => ({
        ...a,
        required: a.required ? "required" : "",
      }))
    ),
    breakpoints: merged.breakpoints ?? null,
    nextReadLinks: asCollection([
      { id: "next_components", titleKey: "next_components_title", descriptionKey: "next_components_body", url: "/reference/components" },
      { id: "next_attributes_root", titleKey: "next_attributes_root_title", descriptionKey: "next_attributes_root_body", url: "/reference/attributes" },
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

  const categoryMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(categoryMapRaw)) {
    if (k.startsWith("_")) continue;
    if (typeof v === "string") categoryMap[k] = v;
  }

  const componentNames = Object.keys(attrDefsFile)
    .filter((k) => k !== "common" && !k.startsWith("_"))
    .sort();
  const commonDefs = attrDefsFile.common ?? {};

  console.log(`→ ${componentNames.length} components, ${Object.keys(commonDefs).length} common attributes`);

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
    });

    await writeJson(path.join(PATHS.specComponentsDir, `${merged.kebab}.spec.json`), componentSpec(merged));
    await writeJson(path.join(PATHS.layoutComponentsDir, `${merged.kebab}.json`), componentLayout(merged));
    await writeJson(path.join(PATHS.runtimeComponentsDir, `${merged.kebab}.json`), componentRuntimeData(merged));
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
