---
title: "Phase 03 — Sidebar as a JsonUI custom component"
status: open
depends_on: [01, 02]
enables: [05]
owner: jsonui-define + jsonui-implement
---

# Phase 03 — Sidebar custom component

## Why

The left-rail navigation is the single most important piece of chrome on this site. It belongs on the spec → converter → React impl pipeline — same pattern as `Search`, `TableOfContents`, `CodeBlock`.

## In scope

1. `docs/components/json/sidebar.component.json` — component spec declaring props + structure.
2. `jsonui-doc-web/rjui_tools/lib/react/converters/extensions/sidebar_converter.rb` — Ruby converter scaffolded via `jui g converter --from sidebar.component.json`, then hand-adjusted.
3. `jsonui-doc-web/rjui_tools/lib/react/converters/extensions/attribute_definitions/Sidebar.json` — attribute contract (emitted by the scaffold).
4. `jsonui-doc-web/src/components/extensions/Sidebar.tsx` — React implementation of the component.

## Out of scope

- Placing the Sidebar into the Chrome screen → Phase 05.
- RootLayout wiring → Phase 06.
- The nav catalog data (seeded by `ChromeViewModel` in Phase 05).
- TopBar — parallel plan, Phase 04.

## Component contract

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `items` | `[SidebarSection]` | yes | Ordered list of nav sections. Each section renders a collapsible group. |
| `activeUrl` | `String` | yes | Current route (`/learn/installation`). Used to mark `aria-current="page"` on the matching link. |
| `collapsedIds` | `[String]` | yes | Section ids that are currently collapsed. Sections not in this list are expanded. |
| `onToggleSection` | `(id: String) -> Void` | yes | Invoked when a section header is tapped. |
| `onLinkTap` | `(url: String) -> Void` | optional | Fires after a link is clicked. Consumer uses it to close the mobile drawer. No preventDefault — the underlying `<a>` still navigates. |

### Custom types

```json
{
  "name": "SidebarSection",
  "properties": [
    { "name": "id",      "type": "String" },
    { "name": "label",   "type": "String" },
    { "name": "iconName", "type": "String", "description": "SVG basename under docs/screens/images/ (no extension, no 'icon_' prefix). The component prepends 'icon_' internally." },
    { "name": "entries", "type": "[SidebarEntry]" }
  ]
}
```

```json
{
  "name": "SidebarEntry",
  "properties": [
    { "name": "id",    "type": "String" },
    { "name": "label", "type": "String" },
    { "name": "url",   "type": "String" }
  ]
}
```

### Rendering behavior

- Each section renders a `<button>` header (icon + label + chevron) that toggles expand/collapse. Under the header, an `<ul>` of links.
- Active link: `aria-current="page"`, visual highlight via the accent color.
- Icon colouring: use CSS `mask-image: url("/images/icon_<iconName>.svg"); background-color: currentColor;` pattern so the active / inactive states can flip icon colour via `color`. (See Phase 02's open question — Option (b).)
- Chevron rotates 180° when section is expanded.
- Responsive: the component renders identically on every viewport. Hiding / revealing on <1024px is the parent Chrome screen's job via CSS (Phase 06 `globals.css`).

### Accessibility

- The outer element is `<aside aria-label={ariaLabel}>`. `ariaLabel` is not a prop — the component reads `StringManager.getString("chrome_sidebar_aria_label")` internally (same pattern as the existing Search component's self-localized placeholder).
- Section headers: `aria-expanded={!isCollapsed}`, `aria-controls={listId}`.
- List items: the active one gets `aria-current="page"`.

## Attribute definitions

Follow the existing pattern (see `attribute_definitions/Search.json`, `TableOfContents.json`). Key shapes:

```json
{
  "Sidebar": {
    "items":         { "type": ["array", "binding"],  "description": "Ordered SidebarSection list. Usually @{bindingName} from a ViewModel." },
    "activeUrl":     { "type": ["string", "binding"], "description": "Current route; drives the aria-current='page' decoration." },
    "collapsedIds":  { "type": ["array", "binding"],  "description": "Section ids that start collapsed." },
    "onToggleSection": { "type": ["binding"],         "description": "Event: (id: String) -> Void." },
    "onLinkTap":     { "type": ["binding"],           "description": "Optional event: (url: String) -> Void, fires after navigation." }
  }
}
```

## Converter notes (for `jsonui-implement`)

Scaffold first: `cd jsonui-doc-web && jui g converter --from docs/components/json/sidebar.component.json` with overwrite-prompt `y`.

Hand-adjustments the scaffold won't produce on its own:

1. Route every `@{binding}` through `add_viewmodel_data_prefix(...)`; the scaffold emits bare identifiers that only compile if the prop name happens to be in local scope. Follow the `table_of_contents_converter.rb` pattern (`emit_array_prop` + `emit_string_prop` + `emit_event_prop` helpers).
2. `build_class_name` override: drop the scaffold's auto-inserted `flex flex-col` wrapper — the React component owns its own chrome.
3. Event props: emit `onToggleSection` and `onLinkTap` through `emit_event_prop` (mandatory `@{binding}` — inline handlers not supported).
4. `emit_string_prop` should use the new miss-safe `convert_string_key` branch (identical to the latest `table_of_contents_converter.rb`).

## React implementation notes (for `jsonui-implement`)

File: `jsonui-doc-web/src/components/extensions/Sidebar.tsx`. Must be `"use client"` (uses interactive state + localStorage).

- Import `StringManager` from `@/generated/StringManager` for the aria label.
- `aria-label` resolves through `StringManager.getString("chrome_sidebar_aria_label")` (declared in Phase 11's string additions, paste-ready keys in §String additions below).
- No internal `localStorage` for section state. The ViewModel owns `collapsedIds` (Phase 05). The component is pure: given `collapsedIds + activeUrl`, it renders; on a tap it calls `onToggleSection(id)`.
- Do NOT read `search-index.json` inside the component. The catalog is supplied via `items`.
- Do NOT own the language-toggle affordance — that lives on the TopBar. Sidebar just re-renders when its `items` prop changes (ViewModel pushes new labels on language toggle).

## String additions (for Phase 11)

Consumed by this component at runtime; register them under a top-level `chrome` namespace in `docs/screens/layouts/Resources/strings.json`:

```json
{
  "chrome": {
    "sidebar_aria_label": { "en": "Documentation navigation",        "ja": "ドキュメントナビゲーション" },
    "collapse_aria_label":{ "en": "Collapse section",                "ja": "セクションを閉じる" },
    "expand_aria_label":  { "en": "Expand section",                  "ja": "セクションを開く" }
  }
}
```

## Acceptance

- `jui build` zero warnings; the sidebar component is discoverable via the generator (`jui lookup_component Sidebar` should succeed if MCP is queried).
- `npx tsc --noEmit` in `jsonui-doc-web/` → 0 errors.
- A smoke layout that instantiates Sidebar with mock data compiles to working JSX (can be a throwaway test layout).
- `jui verify --fail-on-diff` clean.

## Open questions

- Do we need a `searchTrigger` slot inside the sidebar (for mobile) or is the top-bar-only Search enough? Current answer: top-bar-only. Re-open if Phase 06 reveals a UX gap.
