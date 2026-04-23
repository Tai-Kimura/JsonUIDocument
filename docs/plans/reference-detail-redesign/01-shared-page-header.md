---
title: "Plan 01 — Shared detail-page header"
status: open
depends_on: [00]
enables: [02, 03]
owner: jsonui-define + jsonui-implement
---

# Plan 01 — Shared detail-page header

## Why

Both the component detail page (Plan 02) and the attribute category page (Plan 03) need the same opening: a breadcrumb, a kicker, a title, a meta row, a description, and an optional alias notice. Today each page re-declares this header inline — there are 37 copies (28 component pages + 9 attribute pages) because the generator emits each from a single template. Fine — that means if we upgrade **the template** in `build-attribute-reference.ts`, all 37 pages inherit the change.

This plan specifies the **authoritative header sub-tree** that 02 and 03 paste into their generator templates. We keep it as a JSON fragment (not a custom component) to stay inside the DSL and avoid a round-trip through the converter pipeline.

## In scope

- The header sub-tree JSON (structure, IDs, data bindings).
- New data-block entries the header needs in both specs: `kicker`, `badges` (CollectionDataSource), `aliasOf`, already-existing `aliasNotice`, `description`.
- The right-rail TOC wrapper the header sits alongside (header is in the left column; TOC lives in the right rail starting at the first section).

## Out of scope

- The content below the header (Plans 02, 03).
- Right-rail TOC on **index** pages — that's `design-overhaul-pc-first/10-toc-to-rail.md`; this plan introduces the pattern for detail pages only.
- Custom-component extraction. If the header proves reused elsewhere (e.g., tools/cli command detail), a follow-up can wrap it as `custom/reference-page-header`.

## Anatomy

Visual order, top to bottom, within the left content column:

```
(top of content area, 32px padding from chrome top bar)

╭─ kicker row ─────────────────────────────────────────────╮
│  COMPONENT · REFERENCE              iOS  Android  Web    │
╰──────────────────────────────────────────────────────────╯

Components  ›  Button                          ← breadcrumb

Button                                         ← 36px title (copy-type button)

╭─ alias callout (visible only when aliasOf is non-empty) ─╮
│  → Alias of  SelectBox                                   │
╰──────────────────────────────────────────────────────────╯

Interactive component that triggers a ViewModel event      ← 17px description
handler on tap. The visual is determined by `style` and
child content; the tap target is always the full bounds.
```

Notes:

- **Kicker row** is a horizontal View: a muted uppercase label on the left (`COMPONENT · REFERENCE` or `ATTRIBUTE CATEGORY · REFERENCE`), platform chips on the right. On attribute category pages the chips are hidden (category is cross-platform).
- **Breadcrumb** is clickable; chevron glyph is `›` rendered as a Label character so we don't need an SVG asset. The last segment is unstyled-link (the current page), colored `#0B1220`.
- **Title** sits on the same horizontal row as a small "copy JSON type" button on component pages, hidden on attribute pages. The button copies the string `"type": "<Component>"` to clipboard.
- **Alias callout** renders only when `aliasOf != null`. Uses the `accent_tint` token background with an `→` glyph.
- **Description** respects `--chrome-content-body-max` (920px) so line length stays readable on a 1920px monitor.

## Data contract

Additions to the screen spec's data block (both component and attribute category specs):

| Field | Class | Required | Default | Notes |
|---|---|---|---|---|
| `kicker` | `String` | yes | — | e.g. `"Component · Reference"` or `"Attribute category · Reference"` |
| `badges` | `CollectionDataSource` | no | empty | platform chips cell; empty on attribute pages |
| `aliasOf` | `String` | no | `""` | component display name the alias points to; empty = hide callout |
| `aliasLinkUrl` | `String` | no | `""` | URL for the alias callout, e.g. `/reference/components/select-box` |
| `onNavigateBreadcrumb` | `() -> Void` | yes | — | replaces `onNavigateBack` — renamed for clarity |
| `onCopyTypeName` | `() -> Void` | no | no-op | component pages only; attribute pages bind to no-op |

Existing fields kept as-is: `title`, `description`, `aliasNotice`. `aliasNotice` still renders in the callout when `aliasOf` is set; redundant with `aliasLinkUrl` but the notice is i18n-able prose while the URL is mechanical — keep both.

## Header JSON (authoritative structure)

Paste target: inside `build-attribute-reference.ts` as the first N children of the content column (the current breadcrumb + title + alias + description + usage block — roughly lines 62–120 of today's generated output).

```json
{
  "type": "View",
  "id": "page_header",
  "orientation": "vertical",
  "width": "matchParent",
  "height": "wrapContent",
  "paddings": [24, 0, 24, 0],
  "child": [
    {
      "type": "View",
      "id": "page_header_kicker_row",
      "orientation": "horizontal",
      "width": "matchParent",
      "height": "wrapContent",
      "child": [
        {
          "type": "Label",
          "id": "page_header_kicker",
          "height": "wrapContent",
          "weight": 1,
          "fontSize": 11,
          "fontWeight": "semibold",
          "fontColor": "#64748B",
          "text": "@{kicker}"
        },
        {
          "type": "Collection",
          "id": "page_header_badges",
          "width": "wrapContent",
          "height": "wrapContent",
          "orientation": "horizontal",
          "items": "@{badges}",
          "cellIdProperty": "id",
          "lazy": false,
          "scrollEnabled": false,
          "sections": [
            { "cell": "cells/reference_platform_badge" }
          ]
        }
      ]
    },
    {
      "type": "View",
      "id": "page_header_breadcrumb_row",
      "orientation": "horizontal",
      "width": "matchParent",
      "height": "wrapContent",
      "topMargin": 16,
      "child": [
        {
          "type": "Label",
          "id": "page_header_breadcrumb_parent",
          "width": "wrapContent",
          "height": "wrapContent",
          "fontSize": 13,
          "fontWeight": "semibold",
          "fontColor": "#2563EB",
          "tapBackground": "#F3F4F6",
          "onClick": "@{onNavigateBreadcrumb}",
          "text": "@{kickerParentLabel}"
        },
        {
          "type": "Label",
          "width": "wrapContent",
          "height": "wrapContent",
          "leftMargin": 8,
          "rightMargin": 8,
          "fontSize": 13,
          "fontColor": "#94A3B8",
          "text": "›"
        },
        {
          "type": "Label",
          "id": "page_header_breadcrumb_current",
          "width": "wrapContent",
          "height": "wrapContent",
          "fontSize": 13,
          "fontColor": "#0B1220",
          "text": "@{title}"
        }
      ]
    },
    {
      "type": "View",
      "id": "page_header_title_row",
      "orientation": "horizontal",
      "width": "matchParent",
      "height": "wrapContent",
      "topMargin": 12,
      "child": [
        {
          "type": "Label",
          "id": "page_header_title",
          "height": "wrapContent",
          "weight": 1,
          "fontSize": 36,
          "fontWeight": "bold",
          "fontColor": "#0B1220",
          "text": "@{title}"
        },
        {
          "type": "Button",
          "id": "page_header_copy_type",
          "width": "wrapContent",
          "height": "wrapContent",
          "visibility": "@{copyTypeVisibility}",
          "paddings": [6, 10, 6, 10],
          "background": "#F3F4F6",
          "cornerRadius": 6,
          "fontSize": 12,
          "fontFamily": "monospace",
          "fontColor": "#0B1220",
          "text": "copy type",
          "onClick": "@{onCopyTypeName}"
        }
      ]
    },
    {
      "type": "View",
      "id": "page_header_alias_callout",
      "orientation": "horizontal",
      "width": "wrapContent",
      "height": "wrapContent",
      "topMargin": 16,
      "paddings": [8, 12, 8, 12],
      "background": "#EEF2FF",
      "cornerRadius": 8,
      "visibility": "@{aliasCalloutVisibility}",
      "child": [
        {
          "type": "Label",
          "width": "wrapContent",
          "height": "wrapContent",
          "fontSize": 13,
          "fontColor": "#4F46E5",
          "text": "→"
        },
        {
          "type": "Label",
          "width": "wrapContent",
          "height": "wrapContent",
          "leftMargin": 8,
          "fontSize": 13,
          "fontWeight": "semibold",
          "fontColor": "#4F46E5",
          "text": "@{aliasNotice}"
        }
      ]
    },
    {
      "type": "Label",
      "id": "page_header_description",
      "width": "matchParent",
      "maxWidth": 920,
      "height": "wrapContent",
      "topMargin": 20,
      "fontSize": 17,
      "lineHeightMultiple": 1.55,
      "fontColor": "#475467",
      "text": "@{description}"
    }
  ]
}
```

### Notes on specific attributes

- `visibility: "@{copyTypeVisibility}"` and `visibility: "@{aliasCalloutVisibility}"` — the ViewModel computes these from `isComponentPage` and `aliasOf` so the generator doesn't have to emit a branch.
- `maxWidth: 920` on the description binds to `--chrome-content-body-max` conceptually. The chrome token is CSS-only; the Layout value is the hard copy. Add a comment in `styles.json` if we ever expose this as a style.
- The `kickerParentLabel` is resolved per-page: `"Components"` for component pages, `"Attributes"` for attribute pages. The ViewModel seeds it.
- **No `fontFamily` on the title.** Default sans-serif — matches the rest of the site. Title weight does the work.

## Right-rail TOC wrapper

Detail pages become a **2-column layout** below the header: left column (weight 1) holds everything the header spans plus the content sections; right column (240px) holds a sticky `TableOfContents`.

The split happens at the outer level — the header sits **inside** the left column, so the TOC doesn't start above it. Structure:

```
[reference_xxx_root]                    ← outer, vertical, matchParent
  [reference_xxx_scroll]                ← scroll owner, full width
    [content_with_rail]                 ← horizontal, 2 columns, 1200 max
      [column_body]                     ← vertical, weight 1
        (page_header)                   ← from this plan
        (content sections)              ← from Plan 02 or 03
      [column_rail]                     ← vertical, width 240
        (TableOfContents, sticky: true, stickyOffset: 80)
```

Below 1024px, the right rail is hidden via its `breakpoints` — the content column expands to full width. Plan 02 and Plan 03 both inherit this wrapper.

## Platform badge cell

One new cell to create: `docs/screens/layouts/cells/reference_platform_badge.json`. Rendered by the `Collection` inside the kicker row.

```json
{
  "type": "View",
  "orientation": "horizontal",
  "width": "wrapContent",
  "height": "wrapContent",
  "leftMargin": 8,
  "paddings": [3, 8, 3, 8],
  "background": "#F3F4F6",
  "cornerRadius": 4,
  "child": [
    {
      "data": [
        { "name": "label", "class": "String" },
        { "name": "supported", "class": "String", "defaultValue": "yes" }
      ]
    },
    {
      "type": "Label",
      "width": "wrapContent",
      "height": "wrapContent",
      "fontSize": 11,
      "fontWeight": "semibold",
      "fontFamily": "monospace",
      "fontColor": "@{supported == 'yes' ? '#0B1220' : '#94A3B8'}",
      "text": "@{label}"
    }
  ]
}
```

Row data shape (emitted by the build script, Plan 06):

```ts
{ id: "platform_ios", label: "iOS", supported: "yes" | "no" | "partial" }
```

When `supported === "no"` the label goes muted. When `"partial"`, add an `*` suffix (`iOS*`) and the tooltip-equivalent copy is the attribute row's own platform-diff table — we don't add hover tooltips in v1.

## Build-script changes (pointers, owned by Plan 06)

- `build-attribute-reference.ts`'s screen-spec emitter (currently produces the `data:` block around lines 300–350 of the script — re-confirm line range at implementation time) adds the six new fields listed in §"Data contract".
- The layout template's top section is replaced with the JSON block in §"Header JSON".
- The runtime-JSON emitter seeds `kicker`, `badges`, `aliasOf`, `aliasLinkUrl` per page.
- The hook (`useComponentReference` / `useCategoryReference`) converts `badges` raw arrays to `CollectionDataSource` the same way it does `attributes`.

All of the above is tracked in detail by **Plan 06**; this plan only declares the contract.

## Validation

Acceptance criteria for this plan:

1. `jui build` zero warnings after the header JSON is pasted into any one component page (use `button.json` as the smoke target).
2. `jui verify --fail-on-diff` clean on that page.
3. Rendered page at 1440px shows kicker row with platform chips right-aligned, title with copy-type button, alias callout hidden on Button (it has no alias), description below 920px wide.
4. Rendered page at 1024px: header same structure, platform chips wrap if needed (flex-wrap via Collection's horizontal list behavior — confirm).
5. Breadcrumb's "Components" text color is `#2563EB` (accent) and clicking navigates to `/reference/components`.
6. The copy-type button, when clicked, writes `"type": "Button"` to the clipboard. (ViewModel-level check; runtime UI verification in Plan 02.)

## Open questions

- **Breadcrumb coloring.** Is accent blue right, or is gray-to-ink (with hover → blue) calmer? Vercel uses gray; Stripe uses black. Recommend starting with blue since it's our only cue that this is a link; revisit if A/B testing says otherwise.
- **Copy-type button location.** Inline with the title risks a visual clash with the 36px headline. Alternative: put it as a second line under the title, left-aligned. Decide at implementation time — whichever doesn't fight the headline.
- **Title typography.** Stay with the default sans stack, or commit to a display font (e.g., Söhne / Inter Display via a webfont). Introducing a webfont has bundle-cost implications (LCP) and contradicts Principle 9 (lean on existing tokens). Recommend NO webfont in v1. If typography feels weak after the layout is in place, open a follow-up plan.
