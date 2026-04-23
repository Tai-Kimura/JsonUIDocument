---
title: "Plan 03 — Attribute category layout"
status: open
depends_on: [01, 04, 06]
owner: jsonui-define + jsonui-implement
---

# Plan 03 — Attribute category layout (`reference/attributes/<category>.json`)

## Why

Attribute category pages (Layout, Spacing, Alignment, Binding, Event, Style, State, Responsive, Misc) currently render as "title → description → flat attribute list → next reads". For categories with 20+ attributes (e.g., Layout, Style) this is a wall of rows. A reader who wants to find the `paddings` attribute has to Cmd-F or skim.

Same problem as Plan 02 (component detail), slightly simpler because there are no code examples or related-pills sections here. The fix is an **overview table** above the detail list — one row per attribute, name + type + 1-line summary — that lets the reader jump to what they need.

## In scope

- The full left-column content structure below the shared header (Plan 01).
- Overview table authored inline as a View / Collection pattern.
- Sub-grouping of attributes within the category when an `override.subgroup` field is present (e.g., under "Style": `typography`, `fill`, `border`, `shadow`).
- The 2-column wrapper with right-rail TOC.

## Out of scope

- The shared header (Plan 01).
- The attribute row cell (Plan 04).
- The override schema / generator changes (Plan 06).
- Component detail pages (Plan 02).

## Target anatomy

```
╔══════════════════════════════════════════════════════════════╗
║  HEADER (Plan 01)                                            ║
╠══════════════════════════════════════════════════════════════╣
║  ── section divider ───────────────────────────────────────  ║
║                                                              ║
║  OVERVIEW  (new)                                             ║
║  ┌────────────┬──────────────┬───────────────────────────┐   ║
║  │ name       │ type         │ summary                   │   ║
║  ├────────────┼──────────────┼───────────────────────────┤   ║
║  │ paddings   │ number[]     │ Inner padding...          │   ║
║  │ margins    │ number[]     │ Outer margin...           │   ║
║  │ ...                                                   │   ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  ── section divider ───────────────────────────────────────  ║
║                                                              ║
║  DETAIL                                                      ║
║   Typography  (#subgroup-typography)  (subgroup, if present) ║
║   ╭─────────────────────────────────────────────────────╮    ║
║   │  <attribute row cell>                               │    ║
║   │  <attribute row cell>                               │    ║
║   ╰─────────────────────────────────────────────────────╯    ║
║                                                              ║
║   Fill                                                       ║
║   ...                                                        ║
║                                                              ║
║  NEXT READS                                                  ║
╚══════════════════════════════════════════════════════════════╝
```

When a category has no subgroups (most categories today), the "DETAIL" section is a single heading + one flat Collection.

## § 1 — Overview table

A compact reference table above the detailed list. Each row is a clickable link to the matching anchor in the DETAIL section.

Data block addition:

```json
{ "name": "overviewRows", "class": "CollectionDataSource" }
```

Each row data shape:

```ts
{
  id: string,          // e.g. "overview_paddings"
  name: string,        // e.g. "paddings"
  type: string,        // e.g. "number[]"
  summary: string,     // one-line summary, max ~80 chars
  anchorUrl: string    // "#attr-paddings" — browser handles the jump
}
```

Overview row cell: `cells/reference_overview_row`. New cell introduced by this plan.

```json
{
  "type": "View",
  "orientation": "horizontal",
  "width": "matchParent",
  "height": "wrapContent",
  "paddings": [10, 12, 10, 12],
  "borderBottomWidth": 1,
  "borderColor": "#E5E7EB",
  "tapBackground": "#F9FAFB",
  "child": [
    {
      "data": [
        { "name": "name", "class": "String" },
        { "name": "type", "class": "String" },
        { "name": "summary", "class": "String" },
        { "name": "onClick", "class": "() -> Void" }
      ]
    },
    {
      "type": "Label",
      "width": 180,
      "height": "wrapContent",
      "fontSize": 13,
      "fontFamily": "monospace",
      "fontWeight": "semibold",
      "fontColor": "#0B1220",
      "onClick": "@{onClick}",
      "text": "@{name}"
    },
    {
      "type": "Label",
      "width": 180,
      "height": "wrapContent",
      "leftMargin": 12,
      "fontSize": 12,
      "fontFamily": "monospace",
      "fontColor": "#6366F1",
      "text": "@{type}"
    },
    {
      "type": "Label",
      "height": "wrapContent",
      "weight": 1,
      "leftMargin": 12,
      "fontSize": 13,
      "fontColor": "#475467",
      "text": "@{summary}"
    }
  ]
}
```

Container:

```json
{
  "type": "View",
  "id": "section_overview",
  "orientation": "vertical",
  "width": "matchParent",
  "height": "wrapContent",
  "topMargin": 28,
  "child": [
    {
      "type": "Label",
      "fontSize": 11,
      "fontWeight": "semibold",
      "fontColor": "#64748B",
      "text": "OVERVIEW"
    },
    {
      "type": "View",
      "id": "section_overview_table",
      "orientation": "vertical",
      "width": "matchParent",
      "height": "wrapContent",
      "topMargin": 12,
      "background": "#FFFFFF",
      "cornerRadius": 10,
      "borderColor": "#E5E7EB",
      "borderWidth": 1,
      "paddings": [0, 0, 0, 0],
      "child": [
        {
          "type": "View",
          "orientation": "horizontal",
          "width": "matchParent",
          "height": "wrapContent",
          "paddings": [10, 12, 10, 12],
          "background": "#F9FAFB",
          "borderBottomWidth": 1,
          "borderColor": "#E5E7EB",
          "child": [
            {
              "type": "Label",
              "width": 180,
              "height": "wrapContent",
              "fontSize": 11,
              "fontWeight": "semibold",
              "fontColor": "#64748B",
              "text": "NAME"
            },
            {
              "type": "Label",
              "width": 180,
              "height": "wrapContent",
              "leftMargin": 12,
              "fontSize": 11,
              "fontWeight": "semibold",
              "fontColor": "#64748B",
              "text": "TYPE"
            },
            {
              "type": "Label",
              "height": "wrapContent",
              "weight": 1,
              "leftMargin": 12,
              "fontSize": 11,
              "fontWeight": "semibold",
              "fontColor": "#64748B",
              "text": "SUMMARY"
            }
          ]
        },
        {
          "type": "Collection",
          "id": "section_overview_rows",
          "width": "matchParent",
          "height": "wrapContent",
          "items": "@{overviewRows}",
          "cellIdProperty": "id",
          "lazy": false,
          "scrollEnabled": false,
          "sections": [
            { "cell": "cells/reference_overview_row" }
          ]
        }
      ]
    }
  ]
}
```

The fixed widths of 180px for `name` and `type` columns rely on the content max being ~920px (description column gets ~520px). At 1024px+ this is comfortable. Below 1024px the attribute category pages are the secondary target — a slight horizontal squish on the type column is acceptable; we accept this and do **not** emit a breakpoint variant for v1.

## § 2 — Detail

Below the overview table, the existing "all attribute rows in a single Collection" is replaced with **subgroup blocks**.

If the category has no declared subgroups, the detail section is:

```json
{
  "type": "View",
  "id": "section_detail",
  "orientation": "vertical",
  "width": "matchParent",
  "height": "wrapContent",
  "topMargin": 32,
  "child": [
    {
      "type": "Label",
      "fontSize": 11,
      "fontWeight": "semibold",
      "fontColor": "#64748B",
      "text": "DETAIL"
    },
    {
      "type": "Collection",
      "id": "section_detail_rows",
      "width": "matchParent",
      "height": "wrapContent",
      "topMargin": 12,
      "items": "@{attributes}",
      "cellIdProperty": "id",
      "lazy": false,
      "scrollEnabled": false,
      "sections": [
        { "cell": "cells/reference_attribute_row" }
      ]
    }
  ]
}
```

If subgroups **are** present (Plan 06 adds the field), the detail section emits N group containers, each with its own heading (18px, semibold) and anchor id (`#subgroup-<key>`), followed by a Collection over that subgroup's rows. The build script (Plan 06) determines subgroups from the override schema and emits one CollectionDataSource per subgroup in the runtime JSON:

```json
{ "name": "subgroups", "class": "CollectionDataSource" }      // chip list for jump nav
{ "name": "subgroupTypography", "class": "CollectionDataSource" }
{ "name": "subgroupFill", "class": "CollectionDataSource" }
{ "name": "subgroupBorder", "class": "CollectionDataSource" }
{ "name": "subgroupShadow", "class": "CollectionDataSource" }
```

(Pattern mirrors Plan 02's per-category sources.) The build script only emits the subgroups the category actually uses — the Layout category might not have subgroups at all in v1, so the single-flat-list structure is the fallback.

## § 3 — Next reads

Keep the existing `cells/next_step_card`. Render in a 2-column grid at ≥1024px. Data shape unchanged from today.

## Right-rail TOC

One entry per subgroup (or a single "Attributes" entry if no subgroups), plus "Overview". Seeded from the ViewModel.

## Which fields survive / get dropped

From today's attribute category layout:

- `breadcrumb` Label → **dropped** (moved into shared header).
- `title` Label at 40px → **dropped** (shared header, now 36px).
- `description` Label → **dropped** (shared header).
- `attributes` Collection → **kept but split** (flat or by subgroup).
- `next` Collection → **kept unchanged**.

New data fields to be seeded by the build script (coordinates with Plan 06):

| Field | Class | Purpose |
|---|---|---|
| `kicker` | String | Header — "Attribute category · Reference" |
| `kickerParentLabel` | String | "Attributes" |
| `badges` | CollectionDataSource | Empty on attribute pages |
| `copyTypeVisibility` | String | `"gone"` always |
| `aliasCalloutVisibility` | String | `"gone"` always |
| `aliasOf`, `aliasLinkUrl`, `aliasNotice` | String | Empty |
| `onCopyTypeName` | () -> Void | no-op |
| `onNavigateBreadcrumb` | () -> Void | `router.push('/reference/attributes')` |
| `overviewRows` | CollectionDataSource | Overview-table rows |
| `subgroups` | CollectionDataSource | Optional |
| `subgroup<Key>` | CollectionDataSource | One per present subgroup |

## Example category page — layout, all sections

Sketch of the final structure for `reference/attributes/layout.json` (abridged — full version is generated):

```
[reference_attributes_layout_root]
  [reference_attributes_layout_scroll]
    [content_with_rail]                       ← 2 col, 1200 max
      [column_body]                           ← weight 1
        (page_header from Plan 01)            ← kicker, breadcrumb, title, desc
        (section_overview)                    ← table, this plan § 1
        (section_detail)                      ← attribute rows, this plan § 2
        (section_next)                        ← next reads grid
      [column_rail]                           ← width 240
        (TableOfContents, sticky, entries:)
          · Overview
          · Attributes   (or one per subgroup)
          · Next reads
```

## ViewModel work

Existing hook [useCategoryReference.ts](../../jsonui-doc-web/src/hooks/reference/useCategoryReference.ts) needs:

1. Read `overviewRows` from runtime JSON and wrap in CollectionDataSource.
2. Read subgroup sources if present; otherwise leave undefined.
3. Seed header fields (kicker, aliasCalloutVisibility = "gone", copyTypeVisibility = "gone", etc.).
4. Rename `onNavigateBack` → `onNavigateBreadcrumb` to match Plan 01's contract.
5. Seed `tocEntries`.

## Validation

1. `jui build` zero warnings.
2. `jui verify --fail-on-diff` clean.
3. `tsc` clean.
4. Rendered Layout category page at 1440px: overview table shows 20+ attrs with mono name column, colored type column, summary column that doesn't wrap over ~2 lines. Clicking a name jumps to the matching row in the detail section.
5. The detail section renders each attribute row using the Plan 04 cell (union type chips, platform matrix, etc.).
6. Right-rail TOC stays sticky and lists Overview · Attributes · Next reads.
7. At 1024px: rail collapses, table stays readable.
8. Categories without subgroups render the flat list (no empty "Typography" heading on a category that doesn't use subgroups).

## Open questions

- **Subgroup coverage.** Do we back-fill subgroups for all 9 categories in v1, or only Style / Layout? Recommend starting with Style (`typography`, `fill`, `border`, `shadow`) since it's the densest. Others stay flat in v1. Plan 06 tracks the actual override authoring.
- **Overview table column widths.** 180 / 180 / weight 1 is a guess. Verify at implementation and adjust if `type` column truncates typical union types like `number | 'matchParent' | 'wrapContent'`.
- **Deprecated attribute handling.** Should deprecated attrs appear at the bottom in a collapsed "Deprecated" section, or inline with a strikethrough? Recommend inline with Plan 04's deprecated styling — readers searching for an old attribute should find it in place, see the strikethrough, and click through for the replacement. Plan 06 emits the `deprecated` field.
