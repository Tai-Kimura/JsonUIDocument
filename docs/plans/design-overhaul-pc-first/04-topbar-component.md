---
title: "Phase 04 — TopBar as a JsonUI custom component"
status: open
depends_on: [01, 02]
enables: [05]
owner: jsonui-define + jsonui-implement
---

# Phase 04 — TopBar custom component

## Why

Parallel to Phase 03. The sticky top bar (brand + Search trigger + language toggle) is the second site-wide chrome piece and belongs on the same spec → converter → React impl pipeline.

## In scope

1. `docs/components/json/topbar.component.json` — component spec.
2. `jsonui-doc-web/rjui_tools/lib/react/converters/extensions/topbar_converter.rb` — scaffolded + hand-adjusted converter.
3. `jsonui-doc-web/rjui_tools/lib/react/converters/extensions/attribute_definitions/TopBar.json`.
4. `jsonui-doc-web/src/components/extensions/TopBar.tsx` — React implementation.

## Out of scope

- Mounting the TopBar into the Chrome screen → Phase 05.
- Language toggle state management (owned by `ChromeViewModel` in Phase 05).
- The Search widget itself — already a spec-driven component (`Search`). TopBar reuses it.

## Component contract

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `brandLabel` | `String` | yes | Text shown next to the brand mark. Goes through StringManager (snake_case key → localized). |
| `brandHref` | `String` | optional, default `/` | Where the brand mark links to. |
| `currentLanguage` | `String` | yes | `"en"` or `"ja"`. Used to decorate the language toggle label. |
| `onToggleLanguage` | `() -> Void` | yes | Invoked when the language button is tapped. ViewModel flips `StringManager.language` and re-seeds data. |
| `onToggleMobileMenu` | `() -> Void` | optional | Tapped on <1024px to open the sidebar drawer. Not rendered on wide viewports. |

### Rendering behavior

- Sticky at top, height 56px.
- Layout: hamburger (mobile only) · brand (link to `brandHref`) · flexible spacer · Search trigger · language toggle.
- The Search trigger is an instance of the existing `Search` component. TopBar renders it without passing a `placeholder` — Search self-localizes (see `src/components/extensions/Search.tsx` line ~140).
- Language toggle: a button whose label reads "日本語" when `currentLanguage === "en"` and "English" when `currentLanguage === "ja"` (matches the existing home page convention in `home.json`).

### Accessibility

- `<header aria-label={chromeString("chrome_topbar_aria_label")}>`.
- Language toggle: `aria-label={chromeString("chrome_lang_toggle_aria_label")}`.
- Mobile menu button: `aria-label={chromeString("chrome_mobile_menu_open")}`; flips to `..._close` when the drawer is open (TopBar receives that state via a separate prop? — no, TopBar only fires `onToggleMobileMenu`; the drawer open/close state lives in the Chrome screen's ViewModel, which owns the aria label. TopBar renders the static "open" label and lets the Chrome screen swap on open).

## Attribute definitions

```json
{
  "TopBar": {
    "brandLabel":         { "type": ["string", "binding"], "description": "Brand mark label. Snake_case key is resolved through StringManager." },
    "brandHref":          { "type": ["string", "binding"], "description": "Brand-mark link destination. Default '/'." },
    "currentLanguage":    { "type": ["string", "binding"], "description": "'en' or 'ja'. Drives the toggle label." },
    "onToggleLanguage":   { "type": ["binding"],           "description": "Event: () -> Void." },
    "onToggleMobileMenu": { "type": ["binding"],           "description": "Optional event: () -> Void." }
  }
}
```

## Converter notes

Same rules as Phase 03:
1. `@{binding}` routes through `add_viewmodel_data_prefix`.
2. `emit_string_prop` uses the miss-safe `convert_string_key` branch.
3. `emit_event_prop` requires `@{binding}`.
4. Drop any auto-injected flex wrapper; TopBar owns its own chrome.

## React implementation notes

File: `jsonui-doc-web/src/components/extensions/TopBar.tsx` — `"use client"`.

- Import `StringManager` and the `Search` component from `./Search`.
- Render Search without a `placeholder` prop so it self-localizes.
- Language toggle writes `StringManager.setLanguage(next)` and calls `props.onToggleLanguage()` so the ViewModel can re-seed its data. Also calls `router.refresh()` (or dispatches an event the generated pages listen to) so generated components re-render in the new locale. This pattern was already in the old hand-written chrome (`TopBar.tsx` old impl) — migrate its behavior into the new spec-driven React file.

## String additions (for Phase 11)

```json
{
  "chrome": {
    "brand_name":              { "en": "JsonUI",                    "ja": "JsonUI" },
    "topbar_aria_label":       { "en": "Site header",               "ja": "サイトヘッダー" },
    "lang_toggle_aria_label":  { "en": "Switch language",           "ja": "言語を切り替え" },
    "mobile_menu_open":        { "en": "Open navigation",           "ja": "ナビゲーションを開く" },
    "mobile_menu_close":       { "en": "Close navigation",          "ja": "ナビゲーションを閉じる" },
    "lang_toggle_label_en":    { "en": "日本語",                     "ja": "日本語" },
    "lang_toggle_label_ja":    { "en": "English",                   "ja": "English" }
  }
}
```

## Acceptance

- `jui build` zero warnings.
- `npx tsc --noEmit` 0 errors.
- Smoke layout instantiates TopBar with mock data and compiles.
- `jui verify --fail-on-diff` clean.

## Open questions

- Does the TopBar need a "Version" slot (GitHub-docs-style version dropdown)? Deferred; see Phase 00 overview §Open questions.
