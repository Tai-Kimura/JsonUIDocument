# Sidebar

**Category:** navigation

Site-wide left-rail navigation. Renders a persistent vertical column that lists every documentation route grouped by category (Learn / Guides / Concepts / Reference / Platforms / Tools). Each section is a collapsible group with a leading category icon (rendered via the standard `Image` type against docs/screens/images/icon_<sectionId>.svg); under the header an `<ul>` of links where each row carries aria-current='page' when the row URL matches the active route. Consumer (Chrome screen ViewModel) seeds the items catalog, owns the collapse state, and handles the toggle / link-tap events. Component stays presentational — it renders what it's given and fires events; all state lives outside.

| | |
|---|---|
| Name | `Sidebar` |
| Created | 2026-04-23 |
| Updated | 2026-04-24 |

## Props

| Name | Type | Required | Default | Description | Notes |
|------|------|----------|---------|-------------|-------|
| `items` | `Array(SidebarSection)` | Yes | `-` | Ordered list of nav sections. Each section is a SidebarSection with id, label, iconName, and a list of entries. The consumer seeds this from a static catalog keyed by URL. | - |
| `activeUrl` | `String` | Yes | `-` | Current route pathname (e.g. '/learn/installation'). The component marks the row whose url matches with aria-current='page' and an accent styling. | - |
| `collapsedIds` | `Array(String)` | Yes | `-` | Ids of sections currently collapsed. Sections not in this list render expanded. Default: empty (all expanded). | - |
| `mobileOpen` | `Bool` | No | `-` | Under 1024px viewports the sidebar is hidden by default; flip this to true to slide it in as a drawer. CSS handles the transform; the component sets data-mobile-open accordingly. | - |

## Structure

### Layout Structure

```
sidebar_root
```

### Components

| Type | ID | Bound To Prop | Description | Notes |
|------|----|---------------|-------------|-------|
| `View` | `sidebar_root` | `-` | <aside> element — the sidebar column. | - |

## Usage

### Example

```json
{'layoutSnippet': '{\n  "type": "Sidebar",\n  "items": "@{navItems}",\n  "activeUrl": "@{activeUrl}",\n  "collapsedIds": "@{collapsedIds}",\n  "mobileOpen": "@{mobileOpen}",\n  "onToggleSection": "@{onToggleSection}",\n  "onLinkTap": "@{onLinkTap}"\n}'}
```

## Notes

- Icon rendering uses CSS `mask-image: url(/images/icon_<iconName>.svg); background-color: currentColor` so the active / inactive icon colour can flip via CSS `color`. Direct <img> would ignore currentColor.
- Component self-localizes the outer `aria-label` via StringManager.getString('chrome_sidebar_aria_label') — no prop needed. Consumers can override via the standard aria-label pass-through if desired.
- All state is external. Component does NOT read localStorage, does NOT persist anything. Persistence is the ChromeViewModel's concern.
- Responsive behavior is CSS-driven. Under 1024px the sidebar translates off-screen by default; setting mobileOpen=true slides it in. Consumer triggers this via the top-bar menu button.
- Every prop must be bound (`@{name}`). Array + String + Bool + event props all flow through the standard rjui binding pipeline.
- Entry-level `platforms` is optional and backward-compatible. When absent, rows render the way they always have (no pills). Pill labels are resolved through StringManager keys `sidebar_platform_ios` / `sidebar_platform_android` / `sidebar_platform_web` so they localize with the rest of the UI.

<!-- jsonui-doc-producer: jsonui-doc:component -->
