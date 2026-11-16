# Search

**Category:** navigation

Site-wide search. Renders as an inline trigger (a narrow button with a magnifier icon and the placeholder copy the author provides). Clicking the trigger opens a full-viewport modal that loads public/search-index.json on first open, pipes it through FlexSearch, and lets the user navigate to any page by title / lead / section heading in either en or ja. Self-contained — the component owns its own open/close state, its own FlexSearch index, and its own router integration; placing it in a layout is a single Search tag with no wiring required.

| | |
|---|---|
| Name | `Search` |
| Created | 2026-04-23 |
| Updated | 2026-04-23 |

## Props

| Name | Type | Required | Default | Description | Notes |
|------|------|----------|---------|-------------|-------|
| `placeholder` | `String` | No | `-` | Placeholder copy shown inside the trigger button. Also used as the modal's input placeholder until the user focuses it. | - |
| `shortcut` | `String` | No | `-` | Keyboard shortcut that toggles the modal. Accepts 'cmd+k', 'ctrl+k', 'slash', or any single printable key. Cross-platform: 'cmd+k' resolves to ⌘+K on macOS and Ctrl+K elsewhere. Empty string disables the shortcut. | - |
| `maxResults` | `Int` | No | `-` | Upper bound on results shown in the modal. Past this limit the UI emits 'Refine your query' rather than paginating — search is meant to be targeted, not browsed. | - |
| `indexUrl` | `String` | No | `-` | URL the component fetches on first open. Defaults to the prebuild output path. Point at a versioned CDN path for cache-busted ship. | - |

## Structure

### Layout Structure

```
search_root
```

### Components

| Type | ID | Bound To Prop | Description | Notes |
|------|----|---------------|-------------|-------|
| `View` | `search_root` | `-` | Root container — renders as an inline trigger button, portals the modal overlay when open. | - |

## Usage

### Example

```json
{'layoutSnippet': '{\n  "type": "Search",\n  "placeholder": "search_placeholder",\n  "shortcut": "cmd+k"\n}'}
```

## Notes

- Self-contained v1 — the component owns open/close state, the FlexSearch index, and the router push. No sibling components need to be wired up; dropping `{ "type": "Search" }` anywhere in a layout is enough.
- Fetch-on-open rather than fetch-on-mount: the index is 20-50 KB in v1 and never needed by readers who do not search. Cost is one round-trip on first open; subsequent opens hit the in-memory copy.
- Keyboard shortcut listens on `document.addEventListener('keydown', ...)` at component mount. Multiple Search instances on the same page would each install a listener — acceptable for v1 since every current layout places at most one.
- Results rank by FlexSearch's built-in relevance over title + lead + section headings. No custom weighting in v1; tune later if search-driven navigation starts missing obvious targets.
- Locale: the current StringManager language decides which of the bilingual fields FlexSearch indexes. Switching language rebuilds the index.

<!-- jsonui-doc-producer: jsonui-doc:component -->
