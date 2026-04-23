---
title: "Plan 11 — JsonUI ViewModel documentation"
status: open
depends_on: [00-overview]
spec: docs/screens/json/home.spec.json
shape: moderate
owner: jsonui-define
---

# Plan 11 — JsonUI

## Current state

- uiVariables: `currentLanguage:String, featuredLinks:[FeaturedLink], platformCards:[PlatformCa…`
- eventHandlers: `onAppear, onNavigate, onToggleLanguage`
- customTypes: `FeaturedLink, PlatformCard`
- `dataFlow.viewModel`: **missing** (this is a moderate-shape spec — 3 uiVariables, 2 custom types).

## Required additions

Extend the **minimal** template in [00-overview.md](00-overview.md) with the extra var(s) and method(s) below.

### Additional vars / methods unique to this spec

Home adds:
- `featuredLinks: Array(FeaturedLink)` — 3 hero-level cards seeded from FEATURED_LINKS.
- `platformCards: Array(PlatformCard)` — 3 platform promos seeded from PLATFORM_CARDS.
- (After the design-overhaul/08 "What's new" lands) `recentChanges: Array(ChangelogCard)`.
- Navigation event handlers: `onHeroInstallTap`, `onHeroAiAgentsTap`, `onHeroShowcaseTap`.
- Landing-specific handlers — each navigates to a leaf via `router.push`. Document every destination in `transitions` AND in the method description.

String-key prefix: **`home_`**.

### Navigation destinations

`/learn/hello-world`, `/platforms/kotlin/setup`, `/platforms/react/setup`, `/platforms/swift/setup`, `/tools/agents/overview`

## Acceptance

- Every `stateManagement.eventHandlers` entry has a matching `dataFlow.viewModel.methods` entry with description ≥ 2 sentences.
- Every non-trivial `stateManagement.uiVariables` entry has a matching `dataFlow.viewModel.vars` entry.
- `jui_verify --fail-on-diff` passes.
- `doc_validate_spec` passes.

## Interlock

Same as the minimal pattern — `design-overhaul-pc-first/09-page-header-refactor.md` will remove the `onToggleLanguage` / `currentLanguage` pair after this plan lands.
