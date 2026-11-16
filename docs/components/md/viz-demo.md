# jui viz demo

**Category:** display

The jui viz demo page, running inside an iframe. The page is the static folder that `jui viz export-demo` writes, served by this site from /tools/viz-demo/<jsonui-cli version>/. Its data is built into the page; it talks to no server and loads nothing from another origin.

| | |
|---|---|
| Name | `VizDemo` |
| Created | 2026-10-18 |
| Updated | 2026-10-18 |

## Props

**Notes:** ['Propless. There is one demo and one place it is served from, so a `src` prop would only invite a second copy to drift from the first.', 'The iframe title is the string key `tools_viz_demo_frame_title`, resolved per language like the other chrome strings.']

## Slots

**Notes:** ['Leaf component. The iframe owns its own document.']

## Structure

### Layout Structure

```
viz_demo_root
```

### Components

| Type | ID | Bound To Prop | Description | Notes |
|------|----|---------------|-------------|-------|
| `View` | `viz_demo_root` | `-` | Wrapper that sizes the iframe: full width, a 16:10 frame with a minimum height so the narrow layout of the demo still fits. | - |

## Usage

### Example

```json
{'layoutSnippet': {'type': 'VizDemo'}, 'description': 'Zero-attribute usage inside a Layout JSON.'}
```

### Used In Screens

- /
- /tools/viz

## Notes

- Rendering contract: <iframe src="/tools/viz-demo/<version>/index.html" title=... loading="lazy"> inside the wrapper. The demo is a same-origin page, so no sandbox flags are needed for it to run, and it may not be given any that let it reach another origin.
- Colour mode: the demo reads `data-theme` on its own root element and watches it. The component sets that attribute to the site's colour mode (ColorManager) on load and on every change. It sets an attribute only; no script is added to the demo.
- Updating the demo: run `jui viz export-demo --out <an empty folder>` with the pinned jsonui-cli into jsonui-doc-web/public/tools/viz-demo/<version>/, point DEMO_SRC in VizDemo.tsx at it, and delete the previous folder. A new folder, not an overwrite: deploy uploads non-HTML files as immutable for a year, and the export keeps its file names. Do it on every pin bump that changes the export.
- Nothing is injected into the demo: no analytics, no measurement, no extra script. The request from the jui viz side asks for exactly that.

<!-- jsonui-doc-producer: jsonui-doc:component -->
