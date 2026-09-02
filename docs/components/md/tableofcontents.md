# Table of contents

**Category:** navigation

Compact, accessible 'On this page' navigation that lists the section anchors of the current screen, visually emphasizes the currently in-view section, and scrolls to the target section on click. Used on long-form content pages (/learn/installation, /learn/hello-world, and eventually /reference/* and /guides/*). Web-only v1: the React converter registers under rjui_tools/lib/react/converters/extensions/.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `items` | `[TocItem]` | Yes | `-` | Required. Ordered list of entries to render. Each TocItem has: id (String, stable identifier used as React key and anchor fallback), label (String, user-visible text; may be a strings.json key or a pre-resolved string — implementer decides), anchor (String, the DOM fragment id to scroll to, without the leading '#'), level (Int?, 1 or 2, defaults to 1, drives nesting indentation). Authored by the page spec; v1 does NOT auto-extract from DOM headings. |
| `title` | `String?` | Yes | `-` | Optional heading rendered above the list (e.g. 'On this page'). When omitted, the <nav> has no caption. |
| `sticky` | `Bool?` | Yes | `-` | When true, the component uses position: sticky with top: stickyOffset under a sufficiently tall viewport. Responsive behavior (stack at narrow widths) is the React component's decision. Defaults to true. |
| `stickyOffset` | `Int?` | Yes | `-` | Offset from viewport top, in pixels, used when sticky is true so the TOC doesn't overlap a site header. Defaults to 80. |
| `activeAnchor` | `String?` | Yes | `-` | Binding-only input. When present, the row whose anchor matches this value is emphasized. When absent, the React component runs an IntersectionObserver to self-compute the active anchor. Supply this prop only when the consumer wants authoritative external control (e.g. router-scroll integration). |
| `maxDepth` | `Int?` | Yes | `-` | Items whose level is greater than maxDepth are filtered out before rendering. Allows reusing one rich source list to render a shallow TOC. Defaults to 2. |

## Structure

### Components

| Type | ID | Description |
|------|----|--------------|
| `View` | `toc_root` | Root <nav aria-label='On this page'> container wrapping the optional title and the ordered anchor list. |

## State Management

### Internal States

| Name | Type | Initial Value | Description |
|------|------|---------------|-------------|
| `computedActiveAnchor` | `String?` | `-` | Self-computed active anchor produced by the React component's IntersectionObserver when the 'activeAnchor' prop is not supplied. Implementation detail; not part of the public props contract. |

### Exposed Events

| Name | Parameters | Description |
|------|------------|-------------|
| `onSelect` | `-` | Fired when the user clicks an item. The component invokes onSelect(anchor) first (if wired) and then performs the native scroll-to-anchor. Optional: when not wired, default scroll behavior still runs. |

## Usage

### Example

```json
{'layoutSnippet': {'type': 'TableOfContents', 'title': 'On this page', 'sticky': True, 'stickyOffset': 80, 'maxDepth': 2, 'items': [{'id': 'toc_overview', 'label': 'Overview', 'anchor': 'overview', 'level': 1}, {'id': 'toc_prerequisites', 'label': 'Prerequisites', 'anchor': 'prerequisites', 'level': 1}, {'id': 'toc_install_cli', 'label': 'Install CLI', 'anchor': 'install-cli', 'level': 2}, {'id': 'toc_install_mcp', 'label': 'Install MCP', 'anchor': 'install-mcp', 'level': 2}, {'id': 'toc_next_steps', 'label': 'Next steps', 'anchor': 'next-steps', 'level': 1}]}, 'description': "Minimal TableOfContents usage inside a /learn/installation Layout JSON. Authored items mirror the page's heading structure; level 2 rows are filtered out if maxDepth is set to 1."}
```

