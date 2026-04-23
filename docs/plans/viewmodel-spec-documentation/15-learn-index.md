---
title: "Plan 15 — Learn ViewModel documentation"
status: open
depends_on: [00-overview]
spec: docs/screens/json/learn/index.spec.json
shape: index
owner: jsonui-define
---

# Plan 15 — Learn

## Current state

- uiVariables: `articles:[LearnArticle]`
- eventHandlers: `onAppear, onNavigate`
- customTypes: `LearnArticle`
- `dataFlow.viewModel`: **missing**.

## Required additions

Index specs are the simplest shape — they feed a category catalog (a `Collection` of leaf-page cards). Add:

```jsonc
"viewModel": {
  "methods": [
    {
      "name": "onAppear",
      "description": "Seed `articles` from a module-scope CATALOG_ENTRIES constant. Each entry carries its leaf URL, titleKey, descriptionKey, readTimeKey, statusKey — all resolved through StringManager with the learn_index_ prefix."
    },
    {
      "name": "onNavigate",
      "params": [{ "name": "url", "type": "String" }],
      "description": "router.push(url). Destinations are the leaf URLs under this category (e.g. /learn/installation, /learn/hello-world)."
    }
  ],
  "vars": [
    {
      "name": "articles",
      "type": "Array(CatalogEntry)",
      "observable": true,
      "description": "Category-index rows, seeded in onAppear."
    }
  ]
}
```

String-key prefix: **`learn_index_`**.

## Acceptance

- Spec has the `viewModel` block above.
- `doc_validate_spec` passes.

## Interlock

`design-overhaul-pc-first/12-category-index-routes.md` eventually gives this layout a real URL (`/learn` etc.). That's a routing change — does not alter the VM contract declared here.
