---
title: "Plan 04 — Attribute row cell redesign"
status: open
depends_on: [00, 06]
owner: jsonui-define + jsonui-implement
---

# Plan 04 — Attribute row cell (`cells/reference_attribute_row.json`)

## Why

The current attribute row is the weakest visual unit in the reference. It drops half of the data it's given — default values, enum values, aliases, platform diffs, deprecation state — because the cell's data block only binds `name`, `type`, `required`, `description`, `note`. See [cells/reference_attribute_row.json:1–101](../../docs/screens/layouts/cells/reference_attribute_row.json#L1-L101).

Redesigning this cell has more impact than any other single change in this plan series — it's instanced 40+ times on a single page, and hundreds of times across the reference. Every improvement compounds.

## In scope

- The full attribute row cell Layout.
- Anchor-id handling so each row becomes a jump target (`#attr-<name>`).
- Required / optional / deprecated visual states.
- Union-type chip rendering.
- Default-value chip.
- Enum-values chip list.
- Aliases chip list.
- Platform-diff micro-matrix (3 columns: iOS / Android / Web).
- Note callout treatment.

## Out of scope

- The platform-diff data authoring (Plan 06 back-fills overrides).
- The container Layouts that instance this cell (Plans 02, 03).

## Target anatomy

```
┌ ─ required accent bar (3px wide, red, full height, inset 0) ─ ┐
│  paddings                     number[]    @{binding}          │  ← header row
│  #attr-paddings               ↑ type chips       required     │
│                                                               │
│  Inner padding of the View in [top, left, bottom, right]      │  ← description
│  order. Accepts a number array or a binding to an array of    │
│  numbers.                                                     │
│                                                               │
│  default: [0, 0, 0, 0]   platform: all                        │  ← meta chips
│                                                               │
│  ┌─ platform matrix ───────────────────────────────────────┐  │
│  │ iOS        Android      Web                             │  │
│  │ ✓          ✓            ✓ (via padding in Tailwind)     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─ note callout ──────────────────────────────────────────┐  │
│  │ ⓘ  On React, padding values are converted to rem.       │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

For non-required attributes, the left accent bar is absent (or invisible `transparent` with 3px width to keep horizontal alignment constant across required and optional rows).

For deprecated attributes: the name gets a strikethrough via `textStyle: "strikethrough"` (or equivalent — confirm in JsonUI attribute docs), and a yellow "deprecated" chip appears in the meta-chips row. Description ends with "Use `<replacement>` instead." (authored in the override).

## Data contract

The cell's `data` block expands from 5 fields to the following. All with defaults so a partial runtime JSON row doesn't break the Layout:

```json
{
  "data": [
    { "name": "name", "class": "String" },
    { "name": "anchorId", "class": "String", "defaultValue": "" },
    { "name": "typeChips", "class": "CollectionDataSource" },
    { "name": "requiredChipText", "class": "String", "defaultValue": "" },
    { "name": "requiredChipVisibility", "class": "String", "defaultValue": "gone" },
    { "name": "deprecatedChipVisibility", "class": "String", "defaultValue": "gone" },
    { "name": "accentBarColor", "class": "String", "defaultValue": "#E5E7EB" },
    { "name": "description", "class": "String", "defaultValue": "" },
    { "name": "defaultChipText", "class": "String", "defaultValue": "" },
    { "name": "defaultChipVisibility", "class": "String", "defaultValue": "gone" },
    { "name": "enumChips", "class": "CollectionDataSource" },
    { "name": "enumChipsVisibility", "class": "String", "defaultValue": "gone" },
    { "name": "aliasChips", "class": "CollectionDataSource" },
    { "name": "aliasChipsVisibility", "class": "String", "defaultValue": "gone" },
    { "name": "platformMatrixVisibility", "class": "String", "defaultValue": "gone" },
    { "name": "platformIosLabel", "class": "String", "defaultValue": "" },
    { "name": "platformAndroidLabel", "class": "String", "defaultValue": "" },
    { "name": "platformWebLabel", "class": "String", "defaultValue": "" },
    { "name": "note", "class": "String", "defaultValue": "" },
    { "name": "noteVisibility", "class": "String", "defaultValue": "gone" },
    { "name": "nameTextStyle", "class": "String", "defaultValue": "normal" },
    { "name": "nameFontColor", "class": "String", "defaultValue": "#0B1220" }
  ]
}
```

**Design choice:** every conditional section has a `*Visibility` String binding computed by the ViewModel / build script, not by a conditional expression inside the Layout. This keeps the Layout structure flat and grep-able, avoids the surprise-factor of `@{foo ? 'visible' : 'gone'}` sprinkled everywhere, and makes it trivial to write test fixtures that force specific states.

## Full Layout

```json
{
  "type": "View",
  "orientation": "horizontal",
  "width": "matchParent",
  "height": "wrapContent",
  "topMargin": 10,
  "background": "#FFFFFF",
  "cornerRadius": 10,
  "borderColor": "#E5E7EB",
  "borderWidth": 1,
  "id": "@{anchorId}",
  "child": [
    {
      "data": [ ... see §"Data contract" ... ]
    },
    {
      "type": "View",
      "id": "attribute_row_accent_bar",
      "width": 3,
      "height": "matchParent",
      "background": "@{accentBarColor}"
    },
    {
      "type": "View",
      "orientation": "vertical",
      "height": "wrapContent",
      "weight": 1,
      "paddings": [14, 16, 14, 16],
      "child": [
        {
          "type": "View",
          "id": "attribute_row_header",
          "orientation": "horizontal",
          "width": "matchParent",
          "height": "wrapContent",
          "child": [
            {
              "type": "Label",
              "id": "attribute_row_name",
              "width": "wrapContent",
              "height": "wrapContent",
              "fontSize": 14,
              "fontFamily": "monospace",
              "fontWeight": "semibold",
              "textStyle": "@{nameTextStyle}",
              "fontColor": "@{nameFontColor}",
              "text": "@{name}"
            },
            {
              "type": "Collection",
              "id": "attribute_row_type_chips",
              "width": "wrapContent",
              "height": "wrapContent",
              "leftMargin": 12,
              "orientation": "horizontal",
              "items": "@{typeChips}",
              "cellIdProperty": "id",
              "lazy": false,
              "scrollEnabled": false,
              "sections": [
                { "cell": "cells/reference_type_chip" }
              ]
            },
            {
              "type": "Label",
              "width": "wrapContent",
              "height": "wrapContent",
              "weight": 1,
              "text": " "
            },
            {
              "type": "Label",
              "id": "attribute_row_required_chip",
              "width": "wrapContent",
              "height": "wrapContent",
              "visibility": "@{requiredChipVisibility}",
              "paddings": [3, 8, 3, 8],
              "background": "#FEE2E2",
              "cornerRadius": 4,
              "fontSize": 11,
              "fontWeight": "semibold",
              "fontColor": "#B91C1C",
              "text": "@{requiredChipText}"
            },
            {
              "type": "Label",
              "id": "attribute_row_deprecated_chip",
              "width": "wrapContent",
              "height": "wrapContent",
              "leftMargin": 6,
              "visibility": "@{deprecatedChipVisibility}",
              "paddings": [3, 8, 3, 8],
              "background": "#FEF3C7",
              "cornerRadius": 4,
              "fontSize": 11,
              "fontWeight": "semibold",
              "fontColor": "#92400E",
              "text": "deprecated"
            }
          ]
        },
        {
          "type": "Label",
          "id": "attribute_row_description",
          "width": "matchParent",
          "height": "wrapContent",
          "topMargin": 8,
          "fontSize": 14,
          "lineHeightMultiple": 1.5,
          "fontColor": "#475467",
          "text": "@{description}"
        },
        {
          "type": "View",
          "id": "attribute_row_meta_row",
          "orientation": "horizontal",
          "width": "matchParent",
          "height": "wrapContent",
          "topMargin": 10,
          "child": [
            {
              "type": "Label",
              "id": "attribute_row_default_chip",
              "width": "wrapContent",
              "height": "wrapContent",
              "visibility": "@{defaultChipVisibility}",
              "paddings": [3, 8, 3, 8],
              "background": "#F3F4F6",
              "cornerRadius": 4,
              "fontSize": 11,
              "fontFamily": "monospace",
              "fontColor": "#0B1220",
              "text": "@{defaultChipText}"
            },
            {
              "type": "View",
              "id": "attribute_row_enum_chips_wrap",
              "orientation": "horizontal",
              "width": "wrapContent",
              "height": "wrapContent",
              "visibility": "@{enumChipsVisibility}",
              "leftMargin": 8,
              "child": [
                {
                  "type": "Label",
                  "width": "wrapContent",
                  "height": "wrapContent",
                  "fontSize": 11,
                  "fontColor": "#64748B",
                  "text": "values:"
                },
                {
                  "type": "Collection",
                  "id": "attribute_row_enum_chips",
                  "width": "wrapContent",
                  "height": "wrapContent",
                  "leftMargin": 6,
                  "orientation": "horizontal",
                  "items": "@{enumChips}",
                  "cellIdProperty": "id",
                  "lazy": false,
                  "scrollEnabled": false,
                  "sections": [
                    { "cell": "cells/reference_type_chip" }
                  ]
                }
              ]
            },
            {
              "type": "View",
              "id": "attribute_row_alias_chips_wrap",
              "orientation": "horizontal",
              "width": "wrapContent",
              "height": "wrapContent",
              "visibility": "@{aliasChipsVisibility}",
              "leftMargin": 8,
              "child": [
                {
                  "type": "Label",
                  "width": "wrapContent",
                  "height": "wrapContent",
                  "fontSize": 11,
                  "fontColor": "#64748B",
                  "text": "aliases:"
                },
                {
                  "type": "Collection",
                  "id": "attribute_row_alias_chips",
                  "width": "wrapContent",
                  "height": "wrapContent",
                  "leftMargin": 6,
                  "orientation": "horizontal",
                  "items": "@{aliasChips}",
                  "cellIdProperty": "id",
                  "lazy": false,
                  "scrollEnabled": false,
                  "sections": [
                    { "cell": "cells/reference_type_chip" }
                  ]
                }
              ]
            }
          ]
        },
        {
          "type": "View",
          "id": "attribute_row_platform_matrix",
          "orientation": "horizontal",
          "width": "matchParent",
          "height": "wrapContent",
          "topMargin": 12,
          "paddings": [10, 12, 10, 12],
          "background": "#F9FAFB",
          "cornerRadius": 6,
          "borderColor": "#E5E7EB",
          "borderWidth": 1,
          "visibility": "@{platformMatrixVisibility}",
          "child": [
            {
              "type": "View",
              "orientation": "vertical",
              "height": "wrapContent",
              "weight": 1,
              "child": [
                {
                  "type": "Label",
                  "fontSize": 10,
                  "fontWeight": "semibold",
                  "fontColor": "#64748B",
                  "text": "iOS"
                },
                {
                  "type": "Label",
                  "topMargin": 4,
                  "fontSize": 12,
                  "fontColor": "#0B1220",
                  "text": "@{platformIosLabel}"
                }
              ]
            },
            {
              "type": "View",
              "orientation": "vertical",
              "height": "wrapContent",
              "weight": 1,
              "leftMargin": 12,
              "child": [
                {
                  "type": "Label",
                  "fontSize": 10,
                  "fontWeight": "semibold",
                  "fontColor": "#64748B",
                  "text": "ANDROID"
                },
                {
                  "type": "Label",
                  "topMargin": 4,
                  "fontSize": 12,
                  "fontColor": "#0B1220",
                  "text": "@{platformAndroidLabel}"
                }
              ]
            },
            {
              "type": "View",
              "orientation": "vertical",
              "height": "wrapContent",
              "weight": 1,
              "leftMargin": 12,
              "child": [
                {
                  "type": "Label",
                  "fontSize": 10,
                  "fontWeight": "semibold",
                  "fontColor": "#64748B",
                  "text": "WEB"
                },
                {
                  "type": "Label",
                  "topMargin": 4,
                  "fontSize": 12,
                  "fontColor": "#0B1220",
                  "text": "@{platformWebLabel}"
                }
              ]
            }
          ]
        },
        {
          "type": "View",
          "id": "attribute_row_note",
          "orientation": "horizontal",
          "width": "matchParent",
          "height": "wrapContent",
          "topMargin": 12,
          "paddings": [10, 12, 10, 12],
          "background": "#EEF2FF",
          "cornerRadius": 6,
          "visibility": "@{noteVisibility}",
          "child": [
            {
              "type": "Label",
              "width": "wrapContent",
              "height": "wrapContent",
              "fontSize": 12,
              "fontWeight": "semibold",
              "fontColor": "#4F46E5",
              "text": "ⓘ"
            },
            {
              "type": "Label",
              "height": "wrapContent",
              "weight": 1,
              "leftMargin": 8,
              "fontSize": 13,
              "lineHeightMultiple": 1.5,
              "fontColor": "#4F46E5",
              "text": "@{note}"
            }
          ]
        }
      ]
    }
  ]
}
```

## Type chip cell — new

`cells/reference_type_chip.json` — reused by type chips, enum chips, alias chips.

```json
{
  "type": "View",
  "orientation": "horizontal",
  "width": "wrapContent",
  "height": "wrapContent",
  "leftMargin": 4,
  "paddings": [2, 8, 2, 8],
  "cornerRadius": 4,
  "background": "@{background}",
  "child": [
    {
      "data": [
        { "name": "label", "class": "String" },
        { "name": "background", "class": "String", "defaultValue": "#F3F4F6" },
        { "name": "fontColor", "class": "String", "defaultValue": "#0B1220" }
      ]
    },
    {
      "type": "Label",
      "width": "wrapContent",
      "height": "wrapContent",
      "fontSize": 11,
      "fontFamily": "monospace",
      "fontColor": "@{fontColor}",
      "text": "@{label}"
    }
  ]
}
```

Type chip color tokens (hand-authored in the build script, Plan 06):

| Type family | Background | FontColor |
|---|---|---|
| `string` | `#DCFCE7` | `#15803D` |
| `number`, `number[]` | `#FEF3C7` | `#92400E` |
| `boolean` | `#E0E7FF` | `#4338CA` |
| `binding` (`@{...}`) | `#EEF2FF` | `#4F46E5` |
| `@string/key` | `#FAE8FF` | `#86198F` |
| `() -> Void` (event) | `#FFE4E6` | `#9F1239` |
| enum value | `#F3F4F6` | `#0B1220` |
| alias | `#F1F5F9` | `#0B1220` |
| unknown / fallback | `#F3F4F6` | `#0B1220` |

The build script maps each type string to one of these families and emits the chip row accordingly.

## Computed visibility — author in the build script

All `*Visibility` fields resolve to `"visible"` or `"gone"` based on the runtime row content. The build script computes them once at generate time and writes them into the runtime JSON — the hook does not compute visibility. This makes the runtime JSON self-describing and each row trivially test-fixturable.

Rules:

| Field | Rule |
|---|---|
| `requiredChipVisibility` | `"visible"` if row.required === true |
| `requiredChipText` | `"required"` if required else `""` |
| `deprecatedChipVisibility` | `"visible"` if row.deprecated |
| `accentBarColor` | `"#DC2626"` if required, `"#F59E0B"` if deprecated, `"#E5E7EB"` otherwise (keeps layout stable) |
| `nameTextStyle` | `"strikethrough"` if deprecated else `"normal"` |
| `nameFontColor` | `"#94A3B8"` if deprecated else `"#0B1220"` |
| `defaultChipText` | `"default: <value>"` if row.default else `""` |
| `defaultChipVisibility` | `"visible"` if row.default else `"gone"` |
| `enumChipsVisibility` | `"visible"` if row.enumValues.length > 0 |
| `aliasChipsVisibility` | `"visible"` if row.aliases.length > 0 |
| `platformMatrixVisibility` | `"visible"` if row.platformDiff has any non-default cell |
| `platformIosLabel` / `platformAndroidLabel` / `platformWebLabel` | `"✓"` / `"✗"` / `"✓ (via <...>)"` etc., authored in overrides |
| `noteVisibility` | `"visible"` if row.note is non-empty |

## Accessibility notes

- The anchor id on the outer View (`id: "@{anchorId}"`) renders as the container's `id` in HTML, which is what browsers use for `#attr-foo` jumps.
- Color is not the only cue for required / deprecated — text chips carry the meaning as well.
- Note callout uses `ⓘ` as a text glyph, not an icon — screen-reader friendly.

## Validation

1. `jui build` zero warnings — verify each new data field is consumed (visibility bindings count as consumption).
2. `jui verify --fail-on-diff` clean.
3. Visual QA on a single component page after Plan 06 back-fills at least one attribute with every optional field populated (e.g., `text` on `Button` with type chips, default, note, platform matrix). Verify each state renders.
4. Required attribute (e.g., `onClick` on Button): red accent bar on the left, red "required" chip top-right.
5. Deprecated attribute (e.g., a back-filled test case — the current override schema has no deprecated flag; Plan 06 adds one): name strikethrough, yellow "deprecated" chip, description reads "Use `<replacement>` instead."
6. Attribute with no optional fields: renders as just header + description, no empty meta row or matrix.

## Open questions

- **`textStyle: "strikethrough"`.** Confirm this is a supported Label attribute in JsonUI; if not, a workaround is to emit a Unicode strikethrough via CSS only in the TSX — but that drifts from spec. At implementation time, look up the attribute (`lookup_attribute`) on `textStyle`. If unsupported, file a library issue and fall back to wrapping the name in `fontColor: "#94A3B8"` alone (color + deprecated chip still communicate the state).
- **Empty meta row.** If no default / enum / aliases are set, the 10px topMargin on the meta-row View creates a phantom gap between description and platform matrix. Add a `metaRowVisibility` binding and hide the whole row when empty — cleaner.
- **Anchor jump + sticky top bar.** The 56px top bar overlaps the anchor target. Add `scroll-margin-top: 72px` to the attribute row's generated `<div>` via a CSS rule keyed on `id^="attr-"` in `globals.css`. Not an attribute, a CSS one-liner — owned by Plan 06 or a trivial follow-up.
