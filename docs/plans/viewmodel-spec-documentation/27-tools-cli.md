---
title: "Plan 27 — jsonui-cli ViewModel documentation"
status: open
depends_on: [00-overview]
spec: docs/screens/json/tools/cli.spec.json
shape: moderate
owner: jsonui-define
---

# Plan 27 — jsonui-cli

## Current state

- uiVariables: `currentLanguage:String, cliRows:[CliRow], nextReadLinks:[NextReadLink]`
- eventHandlers: `onAppear, onNavigate, onToggleLanguage`
- customTypes: `CliRow, NextReadLink`
- `dataFlow.viewModel`: **missing** (this is a moderate-shape spec — 3 uiVariables, 2 custom types).

## Required additions

Extend the **minimal** template in [00-overview.md](00-overview.md) with the extra var(s) and method(s) below.

### Additional vars / methods unique to this spec

tools/cli adds:
- `subCommands: Array(SubCommand)` — the sub-CLI catalog (jui / sjui / kjui / rjui / jsonui-test / jsonui-doc). Seeded in onAppear.
- No extra handlers beyond the standard three.

String-key prefix: **`tools_cli_`**.

### Navigation destinations

`/tools/agents`, `/tools/mcp`

## Acceptance

- Every `stateManagement.eventHandlers` entry has a matching `dataFlow.viewModel.methods` entry with description ≥ 2 sentences.
- Every non-trivial `stateManagement.uiVariables` entry has a matching `dataFlow.viewModel.vars` entry.
- `jui_verify --fail-on-diff` passes.
- `doc_validate_spec` passes.

## Interlock

Same as the minimal pattern — `design-overhaul-pc-first/09-page-header-refactor.md` will remove the `onToggleLanguage` / `currentLanguage` pair after this plan lands.
