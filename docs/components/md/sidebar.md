# Sidebar

**Category:** navigation

Site-wide left-rail navigation. Renders a persistent vertical column that lists every documentation route grouped by category (Learn / Guides / Concepts / Reference / Platforms / Tools). Each section is a collapsible group with a leading category icon (rendered via the standard `Image` type against docs/screens/images/icon_<sectionId>.svg); under the header an `<ul>` of links where each row carries aria-current='page' when the row URL matches the active route. Consumer (Chrome screen ViewModel) seeds the items catalog, owns the collapse state, and handles the toggle / link-tap events. Component stays presentational — it renders what it's given and fires events; all state lives outside.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `items` | `Array(SidebarSection)` | Yes | `-` | Ordered list of nav sections. Each section is a SidebarSection with id, label, iconName, and a list of entries. The consumer seeds this from a static catalog keyed by URL. |
| `activeUrl` | `String` | Yes | `-` | Current route pathname (e.g. '/learn/installation'). The component marks the row whose url matches with aria-current='page' and an accent styling. |
| `collapsedIds` | `Array(String)` | Yes | `-` | Ids of sections currently collapsed. Sections not in this list render expanded. Default: empty (all expanded). |
| `mobileOpen` | `Bool` | No | `-` | Under 1024px viewports the sidebar is hidden by default; flip this to true to slide it in as a drawer. CSS handles the transform; the component sets data-mobile-open accordingly. |

## Structure

### Components

| Type | ID | Description |
|------|----|--------------|
| `View` | `sidebar_root` | <aside> element — the sidebar column. |

## Usage

### Example

```json
{'layoutSnippet': '{\n  "type": "Sidebar",\n  "items": "@{navItems}",\n  "activeUrl": "@{activeUrl}",\n  "collapsedIds": "@{collapsedIds}",\n  "mobileOpen": "@{mobileOpen}",\n  "onToggleSection": "@{onToggleSection}",\n  "onLinkTap": "@{onLinkTap}"\n}'}
```

