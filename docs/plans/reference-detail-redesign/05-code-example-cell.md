---
title: "Plan 05 — Code example cell redesign"
status: open
depends_on: [00, 06]
owner: jsonui-define + jsonui-implement
---

# Plan 05 — Code example cell (`cells/reference_code_example.json`)

## Why

The current code example cell is "title + tiny language pill + CodeBlock + note". See [cells/reference_code_example.json:1–96](../../docs/screens/layouts/cells/reference_code_example.json#L1-L96). It works, but:

- One example = one language. We have 9 common-category overrides whose Examples section ships the same example in Swift, Kotlin, and React — we render them as separate examples, leaving the reader to infer they're the same thing. They should collapse into one card with platform tabs.
- No "description" line — some examples need a one-sentence prose caption.
- No file-path header — the code sits in a white rectangle with no indication of "this goes in your Layout JSON" vs "this goes in your ViewModel".
- Copy button is inside the CodeBlock's own chrome but small — easy to miss. Want a visible "Copy" affordance on the card header.

## In scope

- The full code example cell Layout.
- Multi-variant support: a row of platform tabs at the top of the card when the example has > 1 variant; a single language pill (current behavior) when there's only one.
- File-path header (e.g., `Layouts/button.json`) — optional, rendered when set.
- Description line (above the code) — optional.
- Copy affordance at the card level.

## Out of scope

- The CodeBlock internals. It's an existing custom component (`@/components/extensions/CodeBlock`) — we trust its contract and keep using it.
- Runtime JSON shape for variants (Plan 06).
- Syntax highlighting theming (CodeBlock owns that).

## Target anatomy

```
┌─ example card ────────────────────────────────────────────────┐
│  ╭ header ───────────────────────────────────────────────╮    │
│  │ Title of the example                       [ Copy ]   │    │
│  │ Layouts/button.json                                    │    │  ← file path (optional)
│  ╰───────────────────────────────────────────────────────╯    │
│                                                               │
│  One-sentence description of what this example demonstrates.  │  ← optional
│                                                               │
│  ╭ variant tabs (only if variants.length > 1) ──────────╮     │
│  │ [ Spec ][ Swift ][ Kotlin ][ React ]                 │     │
│  ╰──────────────────────────────────────────────────────╯     │
│                                                               │
│  ╭ window chrome ───────────────────────────────────────╮     │
│  │ ● ● ●                                   • json •     │     │
│  │                                                      │     │
│  │  <CodeBlock>                                         │     │
│  │                                                      │     │
│  ╰──────────────────────────────────────────────────────╯     │
│                                                               │
│  ⓘ  Optional note rendered as a callout.                      │
└───────────────────────────────────────────────────────────────┘
```

## Data contract

```json
{
  "data": [
    { "name": "title", "class": "String" },
    { "name": "anchorId", "class": "String", "defaultValue": "" },
    { "name": "description", "class": "String", "defaultValue": "" },
    { "name": "descriptionVisibility", "class": "String", "defaultValue": "gone" },
    { "name": "filePath", "class": "String", "defaultValue": "" },
    { "name": "filePathVisibility", "class": "String", "defaultValue": "gone" },
    { "name": "tabs", "class": "CollectionDataSource" },
    { "name": "tabsVisibility", "class": "String", "defaultValue": "gone" },
    { "name": "languagePill", "class": "String", "defaultValue": "json" },
    { "name": "languagePillVisibility", "class": "String", "defaultValue": "visible" },
    { "name": "activeLanguage", "class": "String", "defaultValue": "json" },
    { "name": "activeCode", "class": "String", "defaultValue": "" },
    { "name": "note", "class": "String", "defaultValue": "" },
    { "name": "noteVisibility", "class": "String", "defaultValue": "gone" },
    { "name": "onCopy", "class": "() -> Void" },
    { "name": "onSelectTab", "class": "(String) -> Void" }
  ]
}
```

**Tab vs pill:**

- If the example has one variant (the common case for JSON-only examples on component pages), `tabsVisibility = "gone"` and `languagePillVisibility = "visible"` — current behavior.
- If the example has multiple variants (common-category attribute overrides that ship Swift+Kotlin+React together, or flagship examples like "Hello World" where we want to show all three), `tabsVisibility = "visible"` and `languagePillVisibility = "gone"`. Tabs are rendered via a horizontal Collection of tab-cells.

**Active variant state:**

Tab clicks mutate `activeLanguage` and `activeCode`. In the hook (per example), we keep the full variants list client-side and swap the active code when the tab changes. This stays contained in the cell's local state — no need for a page-level `activeTab` uiVariable.

Because CollectionDataSources are generated and each cell's state is per-row, the cleanest way is to have the ViewModel (or the runtime JSON) emit one cell-row per example with all variants pre-packed, and the cell's React output wires `onSelectTab` to a React `useState` inside the generated component. This is non-trivial inside the generator — **decision in v1:**

> Emit the active variant per tab click via a ViewModel handler the hook installs when it wraps the row. The hook holds `Map<exampleId, activeLanguage>` state. When `onSelectTab(newLang)` fires, it updates the map and re-emits the CollectionDataSource with the new `activeCode`. This keeps the cell pure and the logic in one place.

Implementation detail tracked in Plan 06's hook changes.

## Full Layout

```json
{
  "type": "View",
  "orientation": "vertical",
  "width": "matchParent",
  "height": "wrapContent",
  "topMargin": 16,
  "paddings": [18, 20, 18, 20],
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
      "id": "code_example_header",
      "orientation": "horizontal",
      "width": "matchParent",
      "height": "wrapContent",
      "child": [
        {
          "type": "View",
          "orientation": "vertical",
          "height": "wrapContent",
          "weight": 1,
          "child": [
            {
              "type": "Label",
              "width": "matchParent",
              "height": "wrapContent",
              "fontSize": 15,
              "fontWeight": "semibold",
              "fontColor": "#0B1220",
              "text": "@{title}"
            },
            {
              "type": "Label",
              "id": "code_example_file_path",
              "width": "matchParent",
              "height": "wrapContent",
              "topMargin": 4,
              "visibility": "@{filePathVisibility}",
              "fontSize": 12,
              "fontFamily": "monospace",
              "fontColor": "#64748B",
              "text": "@{filePath}"
            }
          ]
        },
        {
          "type": "Button",
          "id": "code_example_copy_btn",
          "width": "wrapContent",
          "height": "wrapContent",
          "paddings": [5, 10, 5, 10],
          "background": "#F3F4F6",
          "cornerRadius": 6,
          "fontSize": 12,
          "fontColor": "#0B1220",
          "text": "Copy",
          "onClick": "@{onCopy}"
        }
      ]
    },
    {
      "type": "Label",
      "id": "code_example_description",
      "width": "matchParent",
      "height": "wrapContent",
      "topMargin": 8,
      "visibility": "@{descriptionVisibility}",
      "fontSize": 13,
      "lineHeightMultiple": 1.5,
      "fontColor": "#475467",
      "text": "@{description}"
    },
    {
      "type": "View",
      "id": "code_example_tabs_wrap",
      "orientation": "horizontal",
      "width": "matchParent",
      "height": "wrapContent",
      "topMargin": 12,
      "visibility": "@{tabsVisibility}",
      "child": [
        {
          "type": "Collection",
          "id": "code_example_tabs",
          "width": "wrapContent",
          "height": "wrapContent",
          "orientation": "horizontal",
          "items": "@{tabs}",
          "cellIdProperty": "id",
          "lazy": false,
          "scrollEnabled": false,
          "sections": [
            { "cell": "cells/reference_code_tab" }
          ]
        }
      ]
    },
    {
      "type": "View",
      "id": "code_example_language_pill_wrap",
      "orientation": "horizontal",
      "width": "matchParent",
      "height": "wrapContent",
      "topMargin": 12,
      "visibility": "@{languagePillVisibility}",
      "child": [
        {
          "type": "Label",
          "width": "wrapContent",
          "height": "wrapContent",
          "paddings": [2, 8, 2, 8],
          "background": "#EEF2FF",
          "cornerRadius": 4,
          "fontSize": 11,
          "fontFamily": "monospace",
          "fontColor": "#4F46E5",
          "text": "@{languagePill}"
        }
      ]
    },
    {
      "type": "View",
      "id": "code_example_window",
      "orientation": "vertical",
      "width": "matchParent",
      "height": "wrapContent",
      "topMargin": 12,
      "background": "#0F172A",
      "cornerRadius": 8,
      "child": [
        {
          "type": "View",
          "orientation": "horizontal",
          "width": "matchParent",
          "height": "wrapContent",
          "paddings": [8, 12, 8, 12],
          "borderBottomWidth": 1,
          "borderColor": "#1E293B",
          "child": [
            {
              "type": "View",
              "width": 10,
              "height": 10,
              "cornerRadius": 5,
              "background": "#EF4444"
            },
            {
              "type": "View",
              "width": 10,
              "height": 10,
              "cornerRadius": 5,
              "leftMargin": 6,
              "background": "#F59E0B"
            },
            {
              "type": "View",
              "width": 10,
              "height": 10,
              "cornerRadius": 5,
              "leftMargin": 6,
              "background": "#10B981"
            },
            {
              "type": "Label",
              "height": "wrapContent",
              "weight": 1,
              "leftMargin": 12,
              "fontSize": 11,
              "fontFamily": "monospace",
              "fontColor": "#94A3B8",
              "text": "@{activeLanguage}"
            }
          ]
        },
        {
          "type": "CodeBlock",
          "id": "code_example_block",
          "width": "matchParent",
          "height": "wrapContent",
          "code": "@{activeCode}",
          "language": "@{activeLanguage}",
          "showLineNumbers": false,
          "copyable": false
        }
      ]
    },
    {
      "type": "View",
      "id": "code_example_note",
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
```

Notes:

- The **"window chrome"** (the dark bar with three dots) is purely decorative. It signals "this is code someone wrote, not decoration" and makes the dark code body pop against the light card. Inspired by the macOS traffic-light window aesthetic; tuned to be restrained, not themed.
- The `CodeBlock` inside the window has `copyable: false` because the card-level "Copy" button covers that affordance. Prevents double-up.
- The dark surface `#0F172A` is a deeper variant of `--color-ink` — add as a token `--color-ink-deep` in `globals.css` as part of this plan's CSS touch.

## Code tab cell — new

`cells/reference_code_tab.json`. Rendered by the tabs Collection.

```json
{
  "type": "Button",
  "width": "wrapContent",
  "height": "wrapContent",
  "rightMargin": 6,
  "paddings": [6, 12, 6, 12],
  "background": "@{background}",
  "cornerRadius": 6,
  "borderColor": "@{borderColor}",
  "borderWidth": 1,
  "fontSize": 12,
  "fontWeight": "@{fontWeight}",
  "fontColor": "@{fontColor}",
  "text": "@{label}",
  "onClick": "@{onClick}",
  "child": [
    {
      "data": [
        { "name": "label", "class": "String" },
        { "name": "background", "class": "String", "defaultValue": "#FFFFFF" },
        { "name": "borderColor", "class": "String", "defaultValue": "#E5E7EB" },
        { "name": "fontColor", "class": "String", "defaultValue": "#475467" },
        { "name": "fontWeight", "class": "String", "defaultValue": "normal" },
        { "name": "onClick", "class": "() -> Void" }
      ]
    }
  ]
}
```

Active vs inactive:

- **Active tab:** `background: "#0F172A"`, `fontColor: "#F9FAFB"`, `fontWeight: "semibold"`, `borderColor: "#0F172A"`.
- **Inactive tab:** `background: "#FFFFFF"`, `fontColor: "#475467"`, `fontWeight: "normal"`, `borderColor: "#E5E7EB"`.

The hook computes the active/inactive state per tab row before handing the CollectionDataSource to the cell.

## Single-variant flow (simpler path)

When an example has only one variant:

- `tabs` = empty CollectionDataSource
- `tabsVisibility` = `"gone"`
- `languagePill` = e.g. `"json"`
- `languagePillVisibility` = `"visible"`
- `activeLanguage` = `"json"`, `activeCode` = the single code string
- `onSelectTab` = no-op

This is the default path for today's 37 pages until the overrides are back-filled with multi-platform variants.

## Validation

1. `jui build` zero warnings.
2. `jui verify --fail-on-diff` clean.
3. Rendered component page (Button) with default single-variant JSON examples: each example card shows title + Copy button + small language pill + dark window with three dots + code.
4. Rendered example with multi-variant (author a test override with Swift/Kotlin/React variants on one of Button's examples): tabs row appears, clicking Swift/Kotlin/React swaps the code in the CodeBlock, the active tab styles (dark background, white text) update correctly.
5. Copy button (card-level) writes the current `activeCode` to clipboard; verify via a unit-level check on the ViewModel.
6. Visual: three-dot window chrome aligns, language label on the right of the chrome is legible, code body has sufficient contrast (CodeBlock's syntax highlighting handles this).

## Open questions

- **Dark window vs all-light card.** The dark window is a visual anchor but breaks the rest of the page's light aesthetic. Alternative: keep the CodeBlock light and use a subtle `#F9FAFB` window with a thin border. Recommend dark in v1 — it's what code editors look like, and the contrast helps code scan. If user feedback says it feels jarring, swap.
- **Copy button duplication.** Card-level Copy + CodeBlock's own copy feels redundant. v1 disables CodeBlock's `copyable` (as above). If CodeBlock's internal copy is more accessible (keyboard handler), reconsider.
- **Tab state persistence.** Should switching Swift on example 1 also switch example 2 to Swift? Sticky per-page preference? v1: no, each example is independent. Trivial to lift later if user feedback asks for it.
- **Syntax highlighting for all four languages.** CodeBlock uses Shiki (confirmed). Shiki supports Swift, Kotlin, TypeScript (for React/JSX), JSON out of the box. Verify at implementation that all four languages are in the Shiki preload bundle — if not, add them and measure bundle impact.
