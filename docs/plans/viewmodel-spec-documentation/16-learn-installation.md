---
title: "Plan 16 — Installation ViewModel documentation"
status: open
depends_on: [00-overview]
spec: docs/screens/json/learn/installation.spec.json
shape: rich
owner: jsonui-define
---

# Plan 16 — Installation

## Current state

- uiVariables: `currentLanguage:String, installTargets:[InstallTargetCard], prerequisites:[Prer…`
- eventHandlers: `onAppear, onToggleExpand, onCopyCode, onNavigate, onToggleLanguage`
- customTypes: `InstallTargetCard, PrereqRow, VerifyRow, TroubleshootRow, RelatedLink`
- `displayLogic`: present (this spec has derived visibility strings, making it rich-shape).
- `dataFlow.viewModel`: **missing**.

Rich-shape specs are the only ones where the handler descriptions are already substantive (see `learn/installation.spec.json:67-95`) — the gap here is **promoting** those descriptions into `dataFlow.viewModel.methods` and adding matching `vars` entries.

## Required additions

Author `dataFlow.viewModel` by hand (no template — rich specs are each unique). For every entry in `stateManagement.eventHandlers`, write a corresponding `methods[]` entry with the same description plus the ViewModel body contract (which static catalog is consumed, which StringManager keys are touched, what private helpers exist in the VM). For every entry in `stateManagement.uiVariables`, write a corresponding `vars[]` entry.

### Specific concerns

- The VM body lives at `jsonui-doc-web/src/viewmodels/learn/InstallationViewModel.ts` and is the authoritative reference. Every private helper method (e.g. `buildCatalog`, `asCollection`, `sectionVisibilityFromExpandedIds`) stays private to the Impl — don't surface it in the spec. Only public methods (the ones called from Layout bindings or the hook layer) belong in `methods[]`.

- Display-logic-driven strings (e.g. `*BodyVisibility`) correspond to one entry per section in `vars` with `observable: true` and a description noting the binding source (`displayLogic[].effects[].variableName`).

- Catalog constants at module scope (e.g. `TROUBLESHOOT_ROW_DEFS`, `SECTION_IDS`) are VM-body implementation detail but should be mentioned in the `onAppear` method description so contributors know where to look.

String-key prefix: **`learn_installation_`**.

### Navigation destinations

`/learn/hello-world`, `/tools/agents`, `/tools/cli`, `/tools/mcp`, `/tools/mcp/tools/get-data-source`

## Acceptance

- `dataFlow.viewModel.methods` has an entry for each `stateManagement.eventHandlers` item, with descriptions ≥ 3 sentences.
- `dataFlow.viewModel.vars` has an entry for each `stateManagement.uiVariables` item.
- `jui_verify --fail-on-diff` clean.
- `doc_validate_spec` passes.

## Interlock

`design-overhaul-pc-first/09-page-header-refactor.md` removes `onToggleLanguage` / `currentLanguage` from content specs. This rich spec's lang toggle is `stateManagement.eventHandlers[onToggleLanguage]` — it will be removed; document it here anyway so the removal is reversible / auditable.

After this plan, `design-overhaul-pc-first/10-toc-to-rail.md` moves the TOC to a right rail (layout-only change — no VM contract change).
