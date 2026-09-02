# Search

**Category:** navigation

Site-wide search. Renders as an inline trigger (a narrow button with a magnifier icon and the placeholder copy the author provides). Clicking the trigger opens a full-viewport modal that loads public/search-index.json on first open, pipes it through FlexSearch, and lets the user navigate to any page by title / lead / section heading in either en or ja. Self-contained — the component owns its own open/close state, its own FlexSearch index, and its own router integration; placing it in a layout is a single Search tag with no wiring required.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `placeholder` | `String` | No | `-` | Placeholder copy shown inside the trigger button. Also used as the modal's input placeholder until the user focuses it. |
| `shortcut` | `String` | No | `-` | Keyboard shortcut that toggles the modal. Accepts 'cmd+k', 'ctrl+k', 'slash', or any single printable key. Cross-platform: 'cmd+k' resolves to ⌘+K on macOS and Ctrl+K elsewhere. Empty string disables the shortcut. |
| `maxResults` | `Int` | No | `-` | Upper bound on results shown in the modal. Past this limit the UI emits 'Refine your query' rather than paginating — search is meant to be targeted, not browsed. |
| `indexUrl` | `String` | No | `-` | URL the component fetches on first open. Defaults to the prebuild output path. Point at a versioned CDN path for cache-busted ship. |

## Structure

### Components

| Type | ID | Description |
|------|----|--------------|
| `View` | `search_root` | Root container — renders as an inline trigger button, portals the modal overlay when open. |

## Usage

### Example

```json
{'layoutSnippet': '{\n  "type": "Search",\n  "placeholder": "search_placeholder",\n  "shortcut": "cmd+k"\n}'}
```

