---
title: "Phase 02 — Icon asset system (12 SVGs under docs/screens/images/)"
status: open
depends_on: [01]
enables: [03, 04]
owner: design + web
---

# Phase 02 — Icon asset system

## Why

The chrome (sidebar + top bar) needs 12 icons. The JsonUI workflow already handles image distribution: any SVG placed under `docs/screens/images/` is picked up by `jui build` and copied/converted to each platform's asset directory (`jsonui-doc-web/public/images/` for web, `*.xcassets/<name>.imageset/` for iOS, `res/drawable/<name>.xml` Vector Drawable for Android — see `jsonui-cli/jui_tools/jui_cli/commands/build_cmd.py:623-700`). In layout JSON we reference them via the standard `Image` component: `{"type": "Image", "srcName": "icon_learn"}` → the rjui image converter emits `<img src="/images/icon_learn.svg" />` (see `rjui_tools/lib/react/converters/image_converter.rb:42`).

No React icon components. No external icon library. One SVG file per icon, period.

## In scope

- Place 12 SVG files under `docs/screens/images/`.
- Verify `jui build` distributes them to `jsonui-doc-web/public/images/`.

## Out of scope

- Any TSX icon primitive — there is none. Layouts reference icons through the built-in `Image` type.
- Consuming the icons — Phases 03/04 author sidebar/topbar specs that use them.

## Icon inventory

All 12 share:
- `viewBox="0 0 24 24"`
- stroke-based, no fill (authors should prefer `stroke="currentColor"` so the rjui runtime can theme via CSS `color`)
- `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`
- One SVG per file, no grouping

### Category icons (sidebar section headers)

| File | Concept | Suggested shape |
|---|---|---|
| `icon_learn.svg` | Open book with a spine seam — onboarding / tutorials feel | Two facing pages of a book, slight perspective so it doesn't read as two rectangles |
| `icon_guides.svg` | Compass rose pointing to a direction — "recipes to get you from A to B" | Outer circle + triangular pointer (NE direction suggests "forward") |
| `icon_concepts.svg` | Lightbulb — ideas / mental models | Bulb silhouette + 2 short filament dashes + base plate |
| `icon_reference.svg` | Stack of catalog / library volumes — "look it up" | 3 books, one tilted, shelved |
| `icon_platforms.svg` | 3 stacked offset layers — "one spec, three outputs" | Isometric layer diagram (diamond + two parallels below it) |
| `icon_tools.svg` | Wrench crossed with a small gear tooth — utilities | Wrench silhouette; small cog optional |

### Control icons (chrome affordances)

| File | Concept |
|---|---|
| `icon_search.svg` | Magnifying glass: circle + diagonal handle |
| `icon_menu.svg` | 3 horizontal bars (hamburger) |
| `icon_chevron.svg` | Downward V; layouts rotate with CSS for other directions |
| `icon_external.svg` | Square with an arrow escaping top-right |
| `icon_language.svg` | Globe: circle + one meridian + one parallel (curved lines for approachable geography) |
| `icon_close.svg` | Two crossing lines |

## Authoring rules

1. **File naming**: lowercase, `snake_case`, `.svg` extension, prefix `icon_`. This matches existing project convention (`public/icons/circle.svg` is legacy; we are NOT using the `public/icons/` directory going forward). The `jui build` pipeline pulls from `docs/screens/images/` only.
2. **No `<style>` blocks**. Inline attributes only. `<style>` breaks Android's Vector Drawable conversion.
3. **No raster embeds** (`<image href="data:...">`). SVG path primitives only.
4. **Canvas**: everything fits inside the `24x24` viewBox with a 1.5px inset (so 1.5–22.5 on both axes). Keeps the icon visually centered.
5. **No `fill`** attributes at all — every shape should be stroked. The `2px` stroke + rounded caps + joins give a consistent silhouette. If filled icons become necessary later, that's a separate convention call.
6. **currentColor**: explicitly set `stroke="currentColor"` on the root `<svg>` or each path. The web consumer renders these inside `<img>` tags which ignore `currentColor` — so the rjui `Image` rendering pipeline emits `<img>` and CSS colors must come from a wrapper. If layouts need recoloring on hover / active states, use CSS `filter` on the `<img>` or swap to `background-image: url()` + `mask-image`. Document this trade-off in the Sidebar component spec (Phase 03).

## Example template

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
     fill="none" stroke="currentColor" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round">
  <!-- paths here -->
</svg>
```

## Verification

1. Run `jui build` from the repo root.
2. Confirm the build log includes something like `Converted 12 image(s) → web (12 vector)`.
3. Verify `jsonui-doc-web/public/images/icon_learn.svg` (and the other 11) exist and match the source SVG byte-for-byte.
4. Probe a render: place a temporary `{"type": "Image", "srcName": "icon_learn", "width": 24, "height": 24}` inside an existing layout (home.json is fine), run `jui build`, confirm the generated TSX contains `<img src="/images/icon_learn.svg" />`. Revert the probe once verified.

## Acceptance

- `docs/screens/images/` contains exactly 12 `icon_*.svg` files.
- `jui build` zero warnings.
- All 12 files distributed to `jsonui-doc-web/public/images/`.
- No new React-authored icon primitives anywhere in `jsonui-doc-web/src/`.

## Open questions

- **Recoloring**: `<img src="…svg">` cannot respond to `currentColor`. If the active-sidebar-link state needs a different icon color than the inactive state, we either (a) ship two SVG files per icon (`icon_learn.svg` + `icon_learn_active.svg`), or (b) use `mask-image` in CSS and color via `background-color`. Phase 03 picks one; recommended is (b) for fewer files.
