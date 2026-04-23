---
title: "Plan 06 — Override schema + build script extensions"
status: open
depends_on: [00]
enables: [01, 02, 03, 04, 05]
owner: web (script author)
---

# Plan 06 — Data schema + build-script extensions

## Why

Plans 01–05 ask the Layouts to render fields the current runtime JSON doesn't carry: category-grouped attribute sources, default values, enum values, aliases, platform matrices, deprecation state, multi-platform code variants, canonical examples, overview rows, subgroup-grouped attribute sources, stat counts, and all the pre-computed visibility strings.

This plan is the **single source of truth** for:

1. The extensions to the override schema (what authors write in `docs/data/attribute-overrides/*.json`).
2. The extensions to the runtime JSON shape (what the generator emits to `jsonui-doc-web/public/data/attribute-reference/**`).
3. The changes to [scripts/build-attribute-reference.ts](../../jsonui-doc-web/scripts/build-attribute-reference.ts) that bridge the two.
4. The changes to the hand-written hooks ([useComponentReference.ts](../../jsonui-doc-web/src/hooks/reference/useComponentReference.ts), [useCategoryReference.ts](../../jsonui-doc-web/src/hooks/reference/useCategoryReference.ts)) that wrap the runtime JSON into the shape Layouts expect.

## In scope

- Override JSON schema additions (optional fields — backward-compatible with existing 37 overrides).
- Runtime JSON shape additions (additive — existing consumers keep working until Plans 02/03 swap the Layouts).
- Build-script functions: `buildCanonicalExample`, `splitAttributesByCategory`, `splitAttributesBySubgroup`, `buildOverviewRows`, `computeStatCounts`, `buildTypeChips`, `computeVisibilityFlags`, `buildPlatformMatrix`, `normalizeMultiVariantExample`.
- Hook additions: wrapping every new CollectionDataSource-shaped field, installing the per-example `activeLanguage` state for Plan 05.

## Out of scope

- Back-filling 131 attributes with `platformDiff`, `default`, `enumValues`. This is a content pass — the schema change in this plan unblocks it, but the actual content authoring is a follow-up.
- Adding subgroups to every category. Plan 03 recommends starting with the `Style` category only.
- Translations. All new fields accept Lang2 (en/ja) the same way existing description/note fields do; `flattenLang()` in the build script already handles them.

## Backward compatibility

Every new field is **optional**. An override file that doesn't declare any of the new fields continues to generate a working (if old-looking) page. This lets us:

1. Land Plan 06 first.
2. Land Plans 04/05 and regenerate — old cells keep working because they don't consume new fields; new cells consume them but gracefully handle empty / default values.
3. Land Plans 01/02/03 and regenerate — new layouts paste the new section structures; old fields keep flowing into the shared header.

## Override schema additions

File: `docs/data/attribute-overrides/<name>.json`. Additions to the existing structure documented in [14-attribute-reference-generation.md](../14-attribute-reference-generation.md).

### Top-level additions (per component override)

```jsonc
{
  "component": "Button",
  // ... existing fields ...

  // NEW — canonical example, hand-authored
  "canonical": {
    "language": "json",
    "code": "{\n  \"type\": \"Button\",\n  \"text\": \"Save\",\n  \"onClick\": \"@{onSave}\"\n}"
  },

  // NEW — platform support at the component level
  "platforms": {
    "ios": "yes",       // "yes" | "no" | "partial"
    "android": "yes",
    "web": "yes"
  },

  // NEW — alias target (replaces today's string-only aliasOf flag)
  "aliasOf": null       // e.g. "SelectBox" for a component alias
}
```

### Per-attribute additions

Inside each attribute entry (under `attributes` or `commonAttributes`):

```jsonc
{
  "text": {
    // existing: note, deprecated, hidden, etc.

    // NEW — default value rendered as a chip
    "default": "\"\"",           // rendered literally — quoted strings stay quoted

    // NEW — enum values rendered as chips
    "enumValues": ["primary", "secondary", "tertiary"],

    // NEW — aliases rendered as chips (read-only information — this attribute is aliased as X on some platforms)
    "aliases": ["label"],

    // NEW — platform-diff micro-matrix
    "platformDiff": {
      "ios": "✓",
      "android": "✓",
      "web": "✓ (converted to rem)"
    },

    // NEW — explicit deprecation
    "deprecated": {
      "replacement": "children",
      "sinceVersion": "0.4.0"
    },

    // NEW — subgroup key for attribute category page detail-list grouping
    "subgroup": "typography"    // only meaningful on category overrides (_common_*.json)
  }
}
```

### Per-example additions

Inside each `examples[i]`:

```jsonc
{
  "title": { "en": "Icon + Label", "ja": "アイコン + ラベル" },

  // NEW — optional one-sentence description
  "description": { "en": "Use IconLabel to place a leading icon.", "ja": "先頭アイコン用に IconLabel を使う。" },

  // NEW — optional file-path header
  "filePath": "Layouts/button.json",

  // NEW — multi-variant code — either `variants` OR the existing `language`+`code` (not both)
  "variants": [
    { "language": "json",       "label": "Spec",   "code": "..." },
    { "language": "swift",      "label": "Swift",  "code": "..." },
    { "language": "kotlin",     "label": "Kotlin", "code": "..." },
    { "language": "typescript", "label": "React",  "code": "..." }
  ],

  // OR (single-variant legacy path — still works):
  "language": "json",
  "code": "..."
}
```

## Runtime JSON shape additions

File: `jsonui-doc-web/public/data/attribute-reference/components/<kebab>.json`.

Existing keys (from [useComponentReference.ts:47–59](../../jsonui-doc-web/src/hooks/reference/useComponentReference.ts#L47-L59)):

```
component, kebab, aliasOf, title, description, usage, aliasNotice,
attributes, examples, relatedComponents, nextReadLinks
```

### Additions — component runtime JSON

```jsonc
{
  // ... existing ...

  // For the shared header (Plan 01)
  "kicker": "Component · Reference",
  "kickerParentLabel": "Components",
  "badges": { "sections": [{ "cells": { "data": [
    { "id": "platform_ios", "label": "iOS", "supported": "yes" },
    { "id": "platform_android", "label": "Android", "supported": "yes" },
    { "id": "platform_web", "label": "Web", "supported": "yes" }
  ]}}]},
  "copyTypeVisibility": "visible",
  "aliasCalloutVisibility": "gone",         // "visible" if aliasOf !== null
  "aliasLinkUrl": "",                        // "/reference/components/<kebab>" if aliasOf

  // For the at-a-glance section (Plan 02 §1)
  "canonicalCode": "{\n  ...\n}",
  "canonicalLanguage": "json",
  "statRequired": "6",
  "statOptional": "38",
  "statEvents": "4",

  // For the attributes section (Plan 02 §3) — split by category
  "attributeCategories": { "sections": [{ "cells": { "data": [
    { "id": "cat_common",     "label": "Common",     "anchorUrl": "#section-common" },
    { "id": "cat_style",      "label": "Style",      "anchorUrl": "#section-style" },
    { "id": "cat_layout",     "label": "Layout",     "anchorUrl": "#section-layout" }
    // ... others that this component has ...
  ]}}]},
  "attributesCommon":    { "sections": [{ "cells": { "data": [ /* attribute rows */ ]}}]},
  "attributesStyle":     { "sections": [{ "cells": { "data": [] }}]},
  "attributesLayout":    { "sections": [{ "cells": { "data": [] }}]},
  "attributesSpacing":   { "sections": [{ "cells": { "data": [] }}]},
  "attributesAlignment": { "sections": [{ "cells": { "data": [] }}]},
  "attributesBinding":   { "sections": [{ "cells": { "data": [] }}]},
  "attributesEvent":     { "sections": [{ "cells": { "data": [] }}]},
  "attributesState":     { "sections": [{ "cells": { "data": [] }}]},
  "attributesMisc":      { "sections": [{ "cells": { "data": [] }}]},
  // Visibility per category — "gone" if the corresponding attributes<Cat> is empty
  "groupCommonVisibility":    "visible",
  "groupStyleVisibility":     "gone",
  "groupLayoutVisibility":    "gone",
  // ... one per category ...

  // For the usage section (Plan 02 §2)
  "usageVisibility": "visible",

  // For the TOC rail
  "tocEntries": { "sections": [{ "cells": { "data": [
    { "id": "toc_glance",   "label": "At a glance",  "anchorUrl": "#section-glance" },
    { "id": "toc_common",   "label": "Common",       "anchorUrl": "#section-common" },
    { "id": "toc_examples", "label": "Examples",     "anchorUrl": "#section-examples" },
    { "id": "toc_related",  "label": "Related",      "anchorUrl": "#section-related" }
  ]}}]}
}
```

### Additions — attribute category runtime JSON

File: `jsonui-doc-web/public/data/attribute-reference/categories/<key>.json`.

```jsonc
{
  // existing: category, title, description, attributes, breakpoints, nextReadLinks

  // For the shared header
  "kicker": "Attribute category · Reference",
  "kickerParentLabel": "Attributes",
  "badges": { "sections": [{ "cells": { "data": [] }}]},
  "copyTypeVisibility": "gone",
  "aliasCalloutVisibility": "gone",
  "aliasOf": null,
  "aliasLinkUrl": "",

  // For the overview table (Plan 03 §1)
  "overviewRows": { "sections": [{ "cells": { "data": [
    { "id": "overview_paddings", "name": "paddings", "type": "number[]",   "summary": "Inner padding [top, left, bottom, right]." },
    { "id": "overview_margins",  "name": "margins",  "type": "number[]",   "summary": "Outer margin [top, left, bottom, right]." }
  ]}}]},

  // Optional: subgroup-split detail lists (only when overrides declare subgroups)
  "subgroups":           { "sections": [{ "cells": { "data": [ /* chips */ ]}}]},
  "subgroupTypography":  { "sections": [{ "cells": { "data": [] }}]},
  "subgroupFill":        { "sections": [{ "cells": { "data": [] }}]},
  "subgroupBorder":      { "sections": [{ "cells": { "data": [] }}]},
  "subgroupShadow":      { "sections": [{ "cells": { "data": [] }}]},
  "subgroupsVisibility": "gone",                 // "visible" when at least one subgroup has rows

  // TOC
  "tocEntries": { "sections": [{ "cells": { "data": [
    { "id": "toc_overview", "label": "Overview",   "anchorUrl": "#section-overview" },
    { "id": "toc_detail",   "label": "Attributes", "anchorUrl": "#section-detail" }
  ]}}]}
}
```

### Per-attribute-row runtime JSON (used by Plan 04)

Each row in `attributes<Cat>.sections[0].cells.data` now looks like:

```jsonc
{
  "id": "attr_text",
  "name": "text",
  "anchorId": "attr-text",

  // Visibility + accent (pre-computed by the build script)
  "requiredChipText": "required",
  "requiredChipVisibility": "gone",
  "deprecatedChipVisibility": "gone",
  "accentBarColor": "#E5E7EB",
  "nameTextStyle": "normal",
  "nameFontColor": "#0B1220",

  // Type chips — split from the existing single `type` string
  "typeChips": { "sections": [{ "cells": { "data": [
    { "id": "tc_0", "label": "string",     "background": "#DCFCE7", "fontColor": "#15803D" },
    { "id": "tc_1", "label": "@{binding}", "background": "#EEF2FF", "fontColor": "#4F46E5" }
  ]}}]},

  // Description
  "description": "Button text (can be data binding, supports interpolation).",

  // Meta chips
  "defaultChipText": "default: \"\"",
  "defaultChipVisibility": "visible",

  "enumChips": { "sections": [{ "cells": { "data": [] }}]},
  "enumChipsVisibility": "gone",

  "aliasChips": { "sections": [{ "cells": { "data": [] }}]},
  "aliasChipsVisibility": "gone",

  // Platform matrix
  "platformMatrixVisibility": "visible",
  "platformIosLabel": "✓",
  "platformAndroidLabel": "✓",
  "platformWebLabel": "✓ (converted to rem)",

  // Note
  "note": "Supports `@{binding}` and `@string/key`. ...",
  "noteVisibility": "visible",

  // Legacy fields kept for backward compat during migration
  "type": "string | binding | @string/key",
  "required": ""
}
```

### Per-example runtime JSON (used by Plan 05)

Each row in `examples.sections[0].cells.data`:

```jsonc
{
  "id": "example_1",
  "anchorId": "example-1",
  "title": "Icon + Label composite",

  // Optional description
  "description": "Use IconLabel to place a leading icon.",
  "descriptionVisibility": "visible",

  // Optional file path
  "filePath": "Layouts/button.json",
  "filePathVisibility": "visible",

  // Tabs (present only when variants.length > 1)
  "tabs": { "sections": [{ "cells": { "data": [
    { "id": "tab_spec",   "label": "Spec",   "background": "#0F172A", "borderColor": "#0F172A", "fontColor": "#F9FAFB", "fontWeight": "semibold" },
    { "id": "tab_swift",  "label": "Swift",  "background": "#FFFFFF", "borderColor": "#E5E7EB", "fontColor": "#475467", "fontWeight": "normal" },
    { "id": "tab_kotlin", "label": "Kotlin", "background": "#FFFFFF", "borderColor": "#E5E7EB", "fontColor": "#475467", "fontWeight": "normal" },
    { "id": "tab_react",  "label": "React",  "background": "#FFFFFF", "borderColor": "#E5E7EB", "fontColor": "#475467", "fontWeight": "normal" }
  ]}}]},
  "tabsVisibility": "visible",

  // Single-variant pill (hidden when tabs are visible)
  "languagePill": "json",
  "languagePillVisibility": "gone",

  // Active variant — updated by hook on tab click
  "activeLanguage": "json",
  "activeCode": "...",

  // Note
  "note": "",
  "noteVisibility": "gone",

  // All variants packed (hook keeps this and swaps activeCode/activeLanguage)
  "_variants": [
    { "language": "json",       "label": "Spec",   "code": "..." },
    { "language": "swift",      "label": "Swift",  "code": "..." },
    { "language": "kotlin",     "label": "Kotlin", "code": "..." },
    { "language": "typescript", "label": "React",  "code": "..." }
  ]
}
```

The `_variants` key is a hook-internal concern — the Layout never binds to it.

## Build-script (`scripts/build-attribute-reference.ts`) changes

### New helpers

```typescript
// Maps a type string like "string | binding | @string/key" to a chip array.
function buildTypeChips(type: string): TypeChip[] { ... }

// Splits attributes into 9 category buckets by consulting attribute-categories.json.
function splitAttributesByCategory(
  attrs: ReferenceAttributeRow[]
): Record<CategoryKey, ReferenceAttributeRow[]> { ... }

// Splits a category's attributes into subgroups when overrides declare them.
function splitAttributesBySubgroup(
  attrs: ReferenceAttributeRow[]
): Record<SubgroupKey, ReferenceAttributeRow[]> { ... }

// Builds the overview-table row list from the flat attribute list.
function buildOverviewRows(attrs: ReferenceAttributeRow[]): OverviewRow[] { ... }

// Counts required, optional, and "event" attributes (naming: onX).
function computeStatCounts(attrs: ReferenceAttributeRow[]): StatCounts { ... }

// Produces the Plan 04 visibility strings and the accent-bar color from raw attribute data.
function computeVisibilityFlags(attr: ReferenceAttributeRow): VisibilityFlags { ... }

// Normalizes an example override to either the single-variant or multi-variant runtime shape.
function normalizeMultiVariantExample(raw: RawExample, idx: number): ExampleRow { ... }

// Emits platform-chip rows for the header badges Collection.
function buildPlatformBadges(platforms: Record<Platform, Support>): BadgeRow[] { ... }

// Picks the canonical example — explicit `canonical` first, else examples[0].
function buildCanonicalExample(override: ComponentOverride): CanonicalExample { ... }
```

### Emitter integration

Roughly in the order `generateComponentReference`:

1. Read the override.
2. Merge with attribute definitions (existing flow).
3. Compute `canonical` using `buildCanonicalExample`.
4. `splitAttributesByCategory` → 9 bucket lists.
5. For each bucket: map each attr via `computeVisibilityFlags` + `buildTypeChips` + (optional) `buildPlatformMatrix`. Emit as rows under `attributes<Cat>.sections[0].cells.data`.
6. `computeStatCounts` → `statRequired` / `statOptional` / `statEvents`.
7. Build `attributeCategories` chip list (one entry per category with at least one row).
8. Build `tocEntries`.
9. Build `badges` from `platforms`.
10. Derive `usageVisibility`, `aliasCalloutVisibility`, `copyTypeVisibility` ("visible" always on component pages).
11. For each example: `normalizeMultiVariantExample` → per-example runtime row with tabs or pill.
12. Write runtime JSON.
13. Emit Layout JSON using Plans 01/02 structures.
14. Emit screen spec with matching data block.
15. Emit page.tsx (unchanged path).

Attribute-category page generator mirrors this but calls `buildOverviewRows` and the `splitAttributesBySubgroup` variant.

### Idempotence

The build script must be idempotent: running `npm run build:attrs` twice produces no diff. Key places to watch:

- Object-key order in emitted JSON — use a deterministic key order (sort alphabetically, or author an explicit order).
- Chip IDs — use `tc_<index>` rather than hash-based IDs so a single source edit doesn't shuffle all downstream IDs.
- Timestamps — the existing `generatedAt` in spec metadata is frozen per run; don't inject `new Date()`. If a timestamp is present today, leave as-is; don't add new ones.

## Hook changes

### `useComponentReference.ts`

1. Update the `ComponentReferenceFetched` type to include every field above.
2. Change the setter logic to wrap each `attributes<Cat>` into a CollectionDataSource via the existing `toDataSource` helper.
3. Wrap `attributeCategories`, `badges`, `tocEntries`, and the relatedComponents (already wrapped) the same way.
4. Install per-example `activeLanguage` state when the example has variants:
   - For each example with `_variants`, maintain a React state slot keyed by example id.
   - When `onSelectTab(newLang)` fires for example id E, update state, then rebuild the example row with the new `activeLanguage` + `activeCode` + tab styling, and reissue the `examples` CollectionDataSource.
5. Wire `onCopyTypeName` to `navigator.clipboard.writeText('"type": "' + title + '"')`.
6. Wire `onCopy` (per example) to `navigator.clipboard.writeText(activeCode)`.
7. Rename `onNavigateBack` → `onNavigateBreadcrumb` (keep `onNavigateBack` as an alias for a release so consumers don't break).

### `useCategoryReference.ts`

Same pattern for the attribute-category page:

1. Wrap `overviewRows`, `subgroups`, `subgroup<Key>`, `tocEntries`.
2. Wire each overview row's `onClick` to `router.replace('#' + row.anchorUrl.slice(1))` (hash navigation).
3. Ensure header fields (`kicker`, `aliasCalloutVisibility` = "gone", `copyTypeVisibility` = "gone", etc.) are seeded.

## CSS one-liner — anchor jump offset

Add to `globals.css`:

```css
/* Reserve space for the 56px top bar when anchor-scrolling to a reference row. */
[id^="attr-"],
[id^="example-"],
[id^="section-"],
[id^="subgroup-"] {
  scroll-margin-top: 72px;
}
```

This lets `href="#attr-text"` scroll to `#attr-text` with 72px of padding above — the 56px top bar + 16px breathing room.

## Validation

1. `tsc` clean (script and hooks).
2. `npm run build:attrs` runs successfully on a clean tree; re-running produces no diff.
3. `next build` succeeds.
4. `jui verify --fail-on-diff` clean — confirms Layout JSON still matches generated TSX.
5. `jui build` zero warnings — confirms every data-block field is consumed by the new Layouts.
6. Spot-check `jsonui-doc-web/public/data/attribute-reference/components/button.json` for the presence of all new fields with non-default values (Button has platforms, multiple categories, at least one example, etc.).
7. Spot-check a minimal override (e.g. `blur.json`) for the gracefully-empty case — empty chip lists, gone visibilities, etc.

## Rollout

Land Plan 06 first. The new runtime JSON is additive — old layouts ignore the new fields. Nothing visibly changes until Plans 01–05 land. This makes the rollout trivially rollbackable: if Plan 06's script changes break generation, revert the one script commit.

## Open questions

- **Where does attribute-level `default` data come from if not the override?** The build script already merges from `attribute_definitions` (via `rjui_tools` — see `14-attribute-reference-generation.md` §Pipeline). If `attribute_definitions` has a default field, prefer it. If not, the override is authoritative. Check `attribute_definitions` contents at implementation.
- **`platformDiff` defaults.** If an attribute has no `platformDiff` override, the matrix should fall back to the component's top-level `platforms`. E.g., an iOS-only component's `fontSize` attribute inherits `platformIosLabel: "✓" · platformAndroidLabel: "—" · platformWebLabel: "—"` with `platformMatrixVisibility: "visible"`. Build-script helper handles the fall-through.
- **Canonical example length.** If `override.canonical` is missing, we use `examples[0]`. That example might be long. Emit a build-log warning when the canonical is > 20 lines, recommending the author add a shorter explicit `canonical`.
- **Variant `label` vs `language`.** In a multi-variant example, the tab label ("Swift") differs from the Shiki language id (`swift`). The override ships both. If `label` is omitted, fall back to a hard-coded map: `swift → "Swift"`, `kotlin → "Kotlin"`, `typescript → "React"`, `json → "Spec"`. Document this in the build script.
