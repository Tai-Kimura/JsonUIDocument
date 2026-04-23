---
title: "Phase 09 — Per-page header refactor (28 content pages)"
status: open
depends_on: [06]
enables: [10, 11]
owner: jsonui-define + jsonui-implement
---

# Phase 09 — Per-page header refactor

## Why

Every content page opens with a 300px dark slab (`#0B1220` hero + 44px title + language toggle + optional CTA). On a laptop with the new top-bar + sidebar chrome in place (Phases 05–06), that slab is redundant (language is in top bar; brand is in top bar; navigation is in sidebar). It buries the actual content below the fold on every navigation.

This phase mechanically applies a unified lighter header to all 28 content pages.

## In scope

All 28 files under `docs/screens/layouts/`:

- `learn/{data-binding-basics,first-screen,hello-world,installation,what-is-jsonui}.json`
- `guides/{custom-components,localization,navigation,testing,writing-your-first-spec}.json`
- `concepts/{data-binding,hot-reload,one-layout-json,viewmodel-owned-state,why-spec-first}.json`
- `reference/{attributes,cli-commands,components,json-schema,mcp-tools}.json`
- `platforms/{kotlin,rjui,swift}.json`
- `tools/{agents,cli,helper,mcp,test-runner}.json`

Plus their paired specs under `docs/screens/json/`  and ViewModels under `jsonui-doc-web/src/viewmodels/`.

## Out of scope

- Moving the `TableOfContents` to a right rail → Phase 10.
- String cleanup → Phase 11.
- Anything on home → Phases 07–08.

## Target pattern

### Before (per page, average)

```
[full-width #0B1220 band, 48px padding]
  [eyebrow 12px]                         [language toggle button]
  [44px headline]
  [18px subcopy]
  [optional hero CTA block — inline code / button cluster]
[end band]
```

### After

```
[no band — same background as body, 24px top padding, 32px side padding]
  [breadcrumb row: Category ›  (12px, muted, non-clickable in v1)]
  [36px headline, ink on light]
  [17px subcopy, muted]
[hero CTA block stays — moves out of the header and becomes the first content block]
```

Visual changes on every page:
1. Outer header View's `background: "#0B1220"` → drop the `background` attribute (inherits body `#F9FAFB`).
2. Outer header View's `paddings: [48, 32, 48, 32]` → `paddings: [24, 32, 24, 32]`.
3. Title `fontSize: 44` → `fontSize: 36`.
4. Subcopy `fontColor: "#CBD5F5"` (on-dark) → `fontColor: "#475467"` (on-light).
5. Eyebrow `fontColor: "#93C5FD"` (on-dark) → `fontColor: "#64748B"` (muted on-light).
6. Delete the language-toggle button block entirely. The button is typically a `Button` with `id: "*_lang_toggle"` inside a horizontal row with the eyebrow. After deleting the button, the row becomes a single `Label` — flatten it to just the eyebrow label.
7. Delete the inline CTA block if the page had one (some pages put an eyebrow CTA like "Read the guide" inside the header). The hero `CodeBlock` one-liner on `learn/installation.json:85–104` is NOT chrome — it stays, just outside the header now.

### Spec + ViewModel removals (per page)

1. Remove `currentLanguage` uiVariable and `onToggleLanguage` eventHandler from the spec.
2. Remove the corresponding `data` block entries from the layout.
3. Delete the `onToggleLanguage` handler from the ViewModel. Delete any `currentLanguage: StringManager.language` seed in `onAppear`.

### Styles

Currently pages use a style called `page_header` (or similar — audit needed) for the dark band. Replace references with a new `page_hero_light` style (or drop the style reference entirely and inline the 3 remaining attributes). Keep `page_header` declared in `styles.json` for one release — Phase 11 removes it.

### Breadcrumb

Add a leading breadcrumb label above the title:

```json
{ "type": "Label", "fontSize": 12, "fontColor": "#64748B", "text": "breadcrumb_<category>_<page>" }
```

The breadcrumb text is a new string per page under the respective namespace, e.g. `learn_installation.breadcrumb = "Learn › Installation"` / `"学ぶ › インストール"`. Until category-index routes exist (Phase 12), the breadcrumb is a plain label, not a link.

## Execution hint for the agent

This phase is **mechanical** — same edit on 28 pages. Consider scripting the JSON edit in Python:

1. For each layout file, find the outer header `View` (by id pattern `*_header`).
2. Remove `background: "#0B1220"`, shrink paddings, update title `fontSize`.
3. Find and delete the `*_lang_toggle` button.
4. Insert the breadcrumb Label at the top of the header's `child` array.

Then for each spec file, remove the `currentLanguage` uiVariable + `onToggleLanguage` eventHandler.

Then for each ViewModel, remove the `onToggleLanguage` handler + any `currentLanguage` seed.

Run `jui build` once at the end to confirm everything still regenerates cleanly.

## Strings

Add 28 `breadcrumb` entries (one per page) under each page's namespace. Paste-ready example:

```json
{
  "learn_installation": { "breadcrumb": { "en": "Learn › Installation", "ja": "学ぶ › インストール" } },
  "learn_hello_world":  { "breadcrumb": { "en": "Learn › Hello World",  "ja": "学ぶ › ハロー・ワールド" } }
}
```

Full table of 28 breadcrumbs can be generated by `jsonui-localize` when it runs — a machine translation seed is fine; a human sweep is a follow-up.

## Acceptance

- `jui build` zero warnings, no drift.
- `jui verify --fail-on-diff` clean.
- `npx tsc --noEmit` 0 errors.
- `npm run build` succeeds.
- Visual smoke: every content page opens with a light header, no dark band, no per-page language toggle. The top-bar language toggle flips all page labels (including the breadcrumb).

## Open questions

- Should the breadcrumb's first segment ("Learn", "Guides", …) be rendered as a link now (pointing to a hash on home that opens the right category) or wait for Phase 12's real category-index routes? Proposal: wait. Plain label in this phase, link in Phase 12.
