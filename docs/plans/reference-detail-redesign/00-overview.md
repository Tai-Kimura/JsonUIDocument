---
title: "Reference detail redesign — overview"
status: open
owner: jsonui-define + jsonui-implement
depends_on:
  - design-overhaul-pc-first/06-rootlayout-integration   # new chrome must be live first
  - content-expansion/14-attribute-reference-generation  # generator pipeline already lands the pages
last_updated: 2026-04-23
---

# Reference detail redesign — overview

## TL;DR

The 28 component detail pages (`/reference/components/<name>`) and 9 attribute category pages (`/reference/attributes/<category>`) are auto-generated from `docs/data/attribute-overrides/*.json` by [scripts/build-attribute-reference.ts](../../jsonui-doc-web/scripts/build-attribute-reference.ts). The **pipeline works**, but the resulting pages are visually flat: a breadcrumb label, a 40px title, a description paragraph, and then a wall of identical white attribute cards. On a laptop they read as "API dump printed as HTML" — there is no hierarchy, no scannable overview, no rhythm.

This plan redesigns those pages **without touching the pipeline's shape** (overrides → specs → layouts → runtime JSON → page.tsx). The generator keeps producing the same set of files; we rewrite the Layout JSON templates, the three cells they consume, and extend the override schema + build script so the new layouts have the data they need.

## What's wrong today (citations)

Paths are `path:line` relative to repo root.

### Flat visual hierarchy

- Component detail: [docs/screens/layouts/reference/components/button.json:62–213](../../docs/screens/layouts/reference/components/button.json#L62-L213). The whole body is an unstructured vertical stack of Labels and Collections. No kicker, no section dividers, no rail, no at-a-glance panel. A reader looking for one attribute has to Cmd-F through a list of 40+ identical cards.
- Attribute category: [docs/screens/layouts/reference/attributes/layout.json:33–110](../../docs/screens/layouts/reference/attributes/layout.json#L33-L110). Same pattern — description then one flat Collection of attribute rows. No overview table, no grouping by sub-concept.

### Attribute row is under-specified

- Cell: [docs/screens/layouts/cells/reference_attribute_row.json:1–101](../../docs/screens/layouts/cells/reference_attribute_row.json#L1-L101). Renders only `name`, `type`, `required`, `description`, `note`. Does **not** render: default value, enum values, aliases, platform-diff, binding direction, deprecated state. All five of those fields exist in `ReferenceAttributeRow` ([useComponentReference.ts:15–27](../../jsonui-doc-web/src/hooks/reference/useComponentReference.ts#L15-L27)) but are dropped on the floor by the cell. Readers who want "what values does this enum accept?" have to read the JSON spec file.
- "Required" is a small red text label in the row's top bar — easy to miss when a component has 3 required attrs out of 40.
- Type is one muted monospace line. Union types like `string | binding | @string/key` read as a comma-string, not typed tokens.

### Code examples look like afterthoughts

- Cell: [docs/screens/layouts/cells/reference_code_example.json:1–96](../../docs/screens/layouts/cells/reference_code_example.json#L1-L96). We swapped the code Label for a CodeBlock during the content expansion — good — but the card is still just "title + tiny language pill + code". There's no per-platform tab (our `_common_*` overrides already ship Swift/Kotlin/Web code side by side but we render only one string), no file-path header, no "Copy example" button on the card itself (CodeBlock has `copyable: true` but it's easy to miss), and no description line above the code.

### Related-component pills read as tag filters, not nav

- Cell: [docs/screens/layouts/cells/reference_related_pill.json:1–42](../../docs/screens/layouts/cells/reference_related_pill.json#L1-L42). A fully-rounded #EEF2FF chip with the component name. It looks like a tag on a blog post — most users don't realize it's a link. No accompanying "why related" hint, no icon, no arrow.

### Page header is a naked h1

Current pattern on every detail page:

```
Components                       ← breadcrumb, muted gray label
Button                           ← 40px bold
<alias notice — often empty>     ← 13px indigo (invisible on wide screens)
<description paragraph>          ← 17px muted
<usage paragraph>                ← 15px muted
```

No kicker ("COMPONENT · REFERENCE"), no platform matrix chips, no "copy JSON type" affordance, no Table-of-Contents rail, no jump-to-attribute anchor nav. `design-overhaul-pc-first/Phase 10` moves TOCs to a right rail on the **index** pages but doesn't touch detail pages — we add one here.

### No canonical example

A Button page never shows what a Button actually looks like. That's the #1 thing a reader wants. We have 6 code examples below the fold; we don't render any of them.

## Design direction

**Reference style, not marketing.** Dense, editorial, code-first. Think React docs + Radix Primitives + Fastly API docs. No decorative gradients, no heroes, no 48px titles — every pixel carries meaning. Variety comes from typography, restraint, and the JSON itself being a visual motif.

### Principles

1. **Code is the hero.** Every detail page opens with a canonical JSON example inside a window-chromed CodeBlock, not a prose paragraph.
2. **Scannability beats completeness.** Above the fold: title + platform matrix + canonical example + attribute category tabs. Readers land on any of them and are on their way.
3. **Required and deprecated deserve color.** Required attributes get a left-rail accent (1px · 3px inset) and a "Required" chip. Deprecated attributes get a strikethrough name and a warning chip.
4. **Union types render as typed chips, not comma-strings.** `string | binding | @string/key` becomes three small chips, each with a distinct subtle tint.
5. **Platform diffs are first-class.** A 3-column micro-matrix (iOS · Android · Web) is attached to every attribute row that has one. Component pages also show a page-level matrix in the header.
6. **One cell, many platforms.** A single example cell with tabs for Swift / Kotlin / React / Spec — not N separate cells.
7. **Anchor everything.** Every attribute and example gets a stable `#attr-<name>` / `#example-<n>` id. Right rail TOC lists them.
8. **Respect the chrome.** PC-first chrome from `design-overhaul-pc-first` gives us a 1200px content max, 272px sidebar, 56px top bar. We author to `matchParent` inside `.site-main` and never re-declare colors the chrome owns.
9. **Lean on existing tokens.** All colors come from [`globals.css:12–46`](../../jsonui-doc-web/src/app/globals.css#L12-L46). We add **zero** new CSS variables — if a color isn't in the token list, we justify adding it to globals.css first.
10. **Dogfood the DSL.** Every new structural piece is plain JsonUI — View, Label, CodeBlock, Collection. No custom-component escapes unless a primitive is genuinely missing. If we reach for one, we stop and file a library issue first.

### What this is NOT

- Not a visual rebrand. Tokens, palette, font stack stay the same.
- Not a change to the pipeline's contract. `build-attribute-reference.ts` still reads overrides and emits specs/layouts/runtime/page files in the same places.
- Not a new custom component. Everything is expressible in the existing JsonUI DSL.
- Not a mobile concern. ≥1024px is the primary target. Narrow viewports fall back to stacking via existing `breakpoints` (handled in layout plans 02–03).

## Phase map

```
 00 overview  (you are here)
   │
   ▼
 01 shared-page-header ──┐
                         ├─▶ 02 component-detail ──┐
                         └─▶ 03 attribute-category ┘
                                                    │
 04 attribute-row-cell ─────────────────────────────┤
 05 code-example-cell  ─────────────────────────────┤
                                                    ▼
                                            06 data-and-build
                                                    │
                                                    ▼
                                             (validate + hand off)
```

All plans are **independently pickable** after 00 — a jsonui agent can take 04 (attribute row cell) and finish it in one session without needing 02 done. Only 02 and 03 consume the shared header pattern from 01, and everything reads the new schema from 06, so 06 must land before the Layouts can render non-empty data.

## Plan files

| # | File | Scope | Primary executor |
|---|---|---|---|
| 00 | `00-overview.md` (this file) | Audit, direction, phase map | — |
| 01 | [`01-shared-page-header.md`](01-shared-page-header.md) | Unified header sub-layout used by 02 + 03: kicker, breadcrumb, title, platform-matrix row, description, TOC-rail wrapper | jsonui-define + jsonui-implement |
| 02 | [`02-component-detail-layout.md`](02-component-detail-layout.md) | New `docs/screens/layouts/reference/components/<name>.json` template: canonical example, attribute tabs, grouped attribute sections, examples with platform tabs, related-components grid, next reads | jsonui-define + jsonui-implement |
| 03 | [`03-attribute-category-layout.md`](03-attribute-category-layout.md) | New `docs/screens/layouts/reference/attributes/<category>.json` template: overview table, grouped detail sections, see-also | jsonui-define + jsonui-implement |
| 04 | [`04-attribute-row-cell.md`](04-attribute-row-cell.md) | New `docs/screens/layouts/cells/reference_attribute_row.json`: union-type chips, default chip, enum chips, required/deprecated rail, platform matrix, note callout, anchor link | jsonui-define + jsonui-implement |
| 05 | [`05-code-example-cell.md`](05-code-example-cell.md) | New `docs/screens/layouts/cells/reference_code_example.json`: platform tabs, window chrome, description line, copy button, file-path header | jsonui-define + jsonui-implement |
| 06 | [`06-data-schema-and-build.md`](06-data-schema-and-build.md) | Extend `docs/data/attribute-overrides/*.json` schema + `scripts/build-attribute-reference.ts` to emit the new fields the redesigned cells consume (category, defaults, enum, platform matrix, deprecation, anchor IDs, multi-platform example variants) | web (hand-written script) |

## Gates (every plan must satisfy)

Every plan in this series declares its own acceptance criteria, but all of them share:

1. `jui build` — **zero warnings** (including the "Data property 'X' defined but never used" warning — see `.claude/jsonui-rules/invariants.md`).
2. `jui verify --fail-on-diff` — no drift between Layout and generated TSX.
3. `tsc` clean (for 06's script changes and any hook updates).
4. `next build` succeeds.
5. Visual QA at 1440px + 1024px: no horizontal scrollbars, TOC rail stays sticky, attribute anchor links jump correctly.
6. `build-attribute-reference.ts` must be re-runnable with no diff on second run (idempotent).

## Rollout order

1. **Plan 06 first** (schema + build script). The new cells can't render what the generator doesn't emit. Ship this with the **old** Layouts still in place — they ignore the new fields and keep working.
2. **Plans 04 + 05 in parallel** (cells). Each lands its own cell + re-run the generator. The index pages and detail pages still use the old Layout templates — cells are consumed by both.
3. **Plan 01 shared header** — authored as a reusable sub-tree (not a custom component yet); 02 and 03 paste it in. If 01's structure proves worth sharing across even more pages later, a follow-up can extract it into a custom component.
4. **Plans 02 + 03 in parallel** (container Layouts). Replace the templates in `build-attribute-reference.ts` so the generator emits the new structure on next re-run.
5. Run `npm run build:attrs`, commit the regenerated files, run all four gates, visual QA.

## Open questions

- **Tabs primitive.** The attribute category tabs (Plan 02 §"Attribute section header") want real tabs that switch visible content. Check whether `TabView` works inside a non-scrolling content column; if not, fall back to scroll-to-anchor buttons that highlight the active section via sticky intersection. (Answer in Plan 02 §Tabs; verify before implementing.)
- **Platform matrix source.** Components declare `platforms: ["ios","android","web"]` in their overrides today, but attributes don't have a structured `platformDiff` yet. Plan 06 adds the field; we should back-fill at least the 10 most common attributes (layout + style group) so the matrix isn't empty on v1. Out of scope for this plan: back-filling all 131 attributes — that is a content pass tracked by `content-expansion` follow-ups.
- **Canonical example source.** Do we reuse `examples[0]` as the canonical, or add a dedicated `canonical` field to the override schema? Plan 06 proposes the latter (explicit, short, hand-authored) so generator code doesn't have to guess "is the first example simple enough to be canonical?". If deferring, the page falls back to `examples[0]` with a small warning in the build log.
