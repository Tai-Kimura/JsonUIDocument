---
title: "Plan 09 — Writing screen tests ViewModel documentation"
status: open
depends_on: [00-overview]
spec: docs/screens/json/guides/testing.spec.json
shape: minimal
owner: jsonui-define
---

# Plan 09 — Writing screen tests

## Current state

- uiVariables: `currentLanguage:String, nextReadLinks:[NextReadLink]`
- eventHandlers: `onAppear, onNavigate, onToggleLanguage`
- customTypes: `NextReadLink`
- `dataFlow.viewModel`: **missing** (matches the minimal pattern in [00-overview.md](00-overview.md) §Template).

The spec's existing `stateManagement.eventHandlers[].description` entries are one-liners (e.g. "Seed nextReadLinks.") that do not carry the ViewModel body concerns.

## Required additions

Add `dataFlow.viewModel` using the **minimal** template from [00-overview.md](00-overview.md). String-key prefix for this screen: **`guides_testing_`**.

### Page-specific concerns

- Navigation destinations (listed in `transitions`, repeat here for the VM method description): `/guides/navigation`, `/tools/test-runner`
- `NEXT_READ_ENTRIES` catalog (authoritative mapping from the real VM body):
  | id | url | strings.json keys (title, description) |
  |---|---|---|
  | `next_test_runner` | `/tools/test-runner` | `guides_testing_next_test_runner_title` + `guides_testing_next_test_runner_description` |
  | `next_navigation` | `/guides/navigation` | `guides_testing_next_navigation_title` + `guides_testing_next_navigation_description` |

Open `jsonui-doc-web/src/viewmodels/guides/TestingViewModel.ts` to confirm the exact entries currently seeded. Document what you find; do not invent new entries here.

## Acceptance

- `dataFlow.viewModel.methods` covers `onAppear`, `onNavigate(url)`, `onToggleLanguage` — descriptions ≥ 2 sentences each.
- `dataFlow.viewModel.vars` covers `currentLanguage`, `nextReadLinks`.
- `jui_verify --fail-on-diff` passes — the existing VM matches the documented contract.
- `doc_validate_spec` passes.

## Interlock with other plans

After this plan lands, `design-overhaul-pc-first/09-page-header-refactor.md` drops `onToggleLanguage` + `currentLanguage` from this spec (and all sibling pages). Phase 09 is safe to run once this plan documents what's being removed.
