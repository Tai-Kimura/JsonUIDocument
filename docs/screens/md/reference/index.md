# ReferenceIndex - Reference

## Overview

Catalog page for the Reference section: the lookup surfaces — attributes, components, CLI commands, MCP tools, jui.config.json, JSON schema, generated code, test tooling. Rendered both at the standalone URL and inline in the home TabView; the catalog is seeded statically in the owning ViewModel, so a content repository can replace the seed later without touching this spec.

| | |
|---|---|
| Created | 2026-08-25 |
| Updated | 2026-08-25 |

## Screen Structure

### UI Components

| Component | ID | Platform | Description | Initial State | Notes |
|---|---|---|---|---|---|
| View | `reference_index_root` | - | - | - | - |
| &nbsp;&nbsp;↳ Scroll | `reference_index_scroll` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;↳ View | `reference_index_hero` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;↳ View | `reference_index_catalog` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Collection | `reference_index_articles_collection` | - | - | - | - |

### Layout Structure

```
reference_index_root
└── reference_index_scroll
```

## State Management

### UI Data Variables

| Variable Name | Type | Description | Notes |
|---|---|---|---|
| `articles` | [CatalogEntry] | Ordered catalog of Reference entries. Order is editorial, not alphabetical — it is the order a reader should meet them in. | - |

### View-local Event Handlers

_Handlers kept inside the View layer. ViewModel public API lives under `dataFlow.viewModel`._

| Handler | Description | Notes |
|---|---|---|
| `onAppear` | Seed `articles` from the ViewModel's catalog. Every user-visible string resolves through StringManager so the language toggle reaches these cards. | - |
| `onNavigate` | Client-side navigation to the selected entry. | - |

## Notes

- 2026-08-25 — Authored when the spec-coverage check (jsonui-cli 1.6.35) reported this index layout as a screen with no spec. The index pages are real screens (they render at their own URL and inside the home TabView), so they are declared as screens rather than marked `"role": "cell"`. The catalog itself is seeded in the owning ViewModel; this spec records the screen's shape and its one data surface.
