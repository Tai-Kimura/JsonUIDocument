---
title: "Plan 23 — Component reference ViewModel documentation"
status: open
depends_on: [00-overview]
spec: docs/screens/json/reference/components.spec.json
shape: minimal
owner: jsonui-define
---

# Plan 23 — Component reference

## Current state

- uiVariables: `currentLanguage:String, nextReadLinks:[NextReadLink]`
- eventHandlers: `onAppear, onNavigate, onToggleLanguage`
- customTypes: `NextReadLink`
- `dataFlow.viewModel`: **missing** (matches the minimal pattern in [00-overview.md](00-overview.md) §Template).

The spec's existing `stateManagement.eventHandlers[].description` entries are one-liners (e.g. "Seed nextReadLinks.") that do not carry the ViewModel body concerns.

## Required additions

Add `dataFlow.viewModel` using the **minimal** template from [00-overview.md](00-overview.md). String-key prefix for this screen: **`reference_components_`**.

### Page-specific concerns

- Navigation destinations (listed in `transitions`, repeat here for the VM method description): `/guides/custom-components`, `/reference/attributes`
- `NEXT_READ_ENTRIES` catalog (authoritative mapping from the real VM body):
  | id | url | strings.json keys (title, description) |
  |---|---|---|
  | `next_attributes` | `/reference/attributes` | `reference_components_next_attributes_title` + `reference_components_next_attributes_description` |
  | `next_custom_components` | `/guides/custom-components` | `reference_components_next_custom_components_title` + `reference_components_next_custom_components_description` |

Open `jsonui-doc-web/src/viewmodels/reference/ComponentsViewModel.ts` to confirm the exact entries currently seeded. Document what you find; do not invent new entries here.

## Acceptance

- `dataFlow.viewModel.methods` covers `onAppear`, `onNavigate(url)`, `onToggleLanguage` — descriptions ≥ 2 sentences each.
- `dataFlow.viewModel.vars` covers `currentLanguage`, `nextReadLinks`.
- `jui_verify --fail-on-diff` passes — the existing VM matches the documented contract.
- `doc_validate_spec` passes.

## Interlock with other plans

After this plan lands, `design-overhaul-pc-first/09-page-header-refactor.md` drops `onToggleLanguage` + `currentLanguage` from this spec (and all sibling pages). Phase 09 is safe to run once this plan documents what's being removed.
