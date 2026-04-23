---
title: "ViewModel documentation in screen specs — overview"
status: open
owner: jsonui-define
last_updated: 2026-04-23
---

# ViewModel documentation in screen specs — overview

## TL;DR

All 30 screen specs under `docs/screens/json/` ship with a `dataFlow` block that omits its most important sub-key: **`viewModel`**. That is a spec bug — per the project's own [`jsonui-dataflow` skill](/Users/like-a-rolling_stone/resource/JsonUIDocument/.claude/skills/jsonui-dataflow/SKILL.md), `dataFlow.viewModel.methods` + `.vars` is the authoritative public contract that the protocol-sync machinery turns into the ViewModel Protocol / Interface / Base class on every platform. Skipping it means the generated protocol is empty, the ViewModel body gets hand-written against a vague `stateManagement.eventHandlers` description, and every new contributor has to reverse-engineer the VM from the existing TypeScript.

We fix that by adding a `dataFlow.viewModel` section to every screen spec, grouped into 30 per-page plans below.

## Audit

Run `python3` over the 30 specs: **every one** is missing `dataFlow.viewModel`.

Three shapes emerge:

| Shape | Count | Example | Characteristics |
|---|---|---|---|
| Minimal | 23 | `platforms/kotlin.spec.json` | 2 uiVariables (`currentLanguage`, `nextReadLinks`), 3 eventHandlers (`onAppear`, `onNavigate(url)`, `onToggleLanguage`), 1 customType (`NextReadLink`). Static "what gets installed" catalogs seeded from a module-scope constant in `onAppear`. |
| Moderate | 4 | `home.spec.json`, `tools/{agents,cli,mcp}.spec.json` | Adds a second collection (e.g. `featuredLinks` + `platformCards`), or an index-feed collection (e.g. `catalog`). |
| Rich | 2 | `learn/installation.spec.json`, `learn/hello-world.spec.json` | Collapsible sections (`expandedIds`), derived visibility strings, multi-collection seeding, 5+ eventHandlers. |
| Index | 1 | `learn/index.spec.json` | Simplest shape — feeds a category landing. |

The fix template is shape-aware (§ "Template" below).

## The canonical schema — `dataFlow.viewModel`

Per `SKILL.md`:

```jsonc
{
  "dataFlow": {
    "viewModel": {
      "methods": [
        { "name": "onAppear" },
        {
          "name": "onNavigate",
          "params": [{ "name": "url", "type": "String" }]
        },
        { "name": "onToggleLanguage" }
      ],
      "vars": [
        { "name": "currentLanguage", "type": "String" },
        { "name": "nextReadLinks",   "type": "Array(NextReadLink)", "observable": true }
      ]
    },
    "repositories": [],
    "useCases": [],
    "apiEndpoints": [],
    "customTypes": [
      { "name": "NextReadLink", "properties": [/* … */] }
    ]
  }
}
```

Every entry in `stateManagement.eventHandlers` must have a matching entry in `dataFlow.viewModel.methods`. Every entry in `stateManagement.uiVariables` that is observable (not a view-local toggle) must have a matching entry in `dataFlow.viewModel.vars`. Pure view-local togglables (e.g. a hover state handled in CSS) stay in `stateManagement` without a `viewModel.methods` entry.

## Template

### For **minimal**-shape specs (23 files)

Paste this under `dataFlow`:

```jsonc
"viewModel": {
  "methods": [
    {
      "name": "onAppear",
      "description": "Seed nextReadLinks from the module-scope NEXT_READ_ENTRIES static catalog. Resolve each entry's titleKey / descriptionKey through StringManager with the screen's namespace prefix (e.g. platforms_kotlin)."
    },
    {
      "name": "onNavigate",
      "params": [{ "name": "url", "type": "String" }],
      "description": "Client-side navigation via router.push(url). Destinations are all spec-mapped URLs listed in transitions (typically 2–3 entries)."
    },
    {
      "name": "onToggleLanguage",
      "description": "Flip StringManager.language between the configured languages, then re-run onAppear so every seeded row re-resolves in the new locale."
    }
  ],
  "vars": [
    {
      "name": "currentLanguage",
      "type": "String",
      "description": "Mirror of StringManager.language, seeded in onAppear. Drives the deprecated per-page lang toggle (slated for removal in design-overhaul-pc-first Phase 09)."
    },
    {
      "name": "nextReadLinks",
      "type": "Array(NextReadLink)",
      "observable": true,
      "description": "2–3 closing 'read next' cards. Seeded by onAppear from the static NEXT_READ_ENTRIES constant."
    }
  ]
}
```

The per-page plan then specifies which URLs the page navigates to and the identity of each NEXT_READ_ENTRIES row (id + titleKey + url).

### For **moderate**-shape specs (4 files)

Same as minimal + one or two extra `vars` per spec. Per-page plan enumerates them.

### For **rich**-shape specs (2 files)

`learn/installation` and `learn/hello-world` have 5+ vars and multi-section collapse state. Per-page plan lists every method + var explicitly with the exact contract.

### For the **index** spec (1 file)

`learn/index.spec.json` just feeds a category catalog. 1 var (`articles`), 2 methods (`onAppear` + `onNavigate`). Per-page plan spells it out.

## Conventions

1. **Method descriptions are load-bearing.** A one-liner like `"Seed nextReadLinks."` is a documentation bug. Describe the static catalog, the string key prefix, the navigation semantics, and any side effects. If the description is shorter than the method body would be in code, it's too thin.

2. **`observable: true` defaults to present.** Only mark `observable: false` on static read-only strings (e.g. a `title` that never changes). For collections seeded on appear and re-seeded on language toggle, observable is correct.

3. **Param types use the project's TypeMapper grammar.** `Array(X)` not `X[]`. `() -> Void` stays as-is. `String` / `Int` / `Bool` are valid. Ask when unsure.

4. **Navigation destinations are listed in `transitions`, NOT inside the method description.** Keep the spec normalized — the method description can say "to a spec-mapped URL" and `transitions` enumerates them.

5. **StringManager key prefix is implicit from `layoutFile`.** `layoutFile: "platforms/kotlin"` → prefix `platforms_kotlin_`. Document this explicitly in `onAppear.description` so an agent regenerating the VM knows where to look.

6. **Do NOT duplicate information already in `stateManagement`.** `dataFlow.viewModel` is the public Protocol contract. `stateManagement.eventHandlers[].description` can repeat user-facing intent; `dataFlow.viewModel.methods[].description` should focus on the ViewModel implementation contract (what data gets seeded, which static catalog is used, what StringManager keys are touched).

## Per-page plan status

Each spec gets its own plan file. Per-page plans are numbered in alphabetical order by path.

| # | Spec | Shape | Plan |
|---|---|---|---|
| 01 | `concepts/data-binding.spec.json` | minimal | [01-concepts-data-binding.md](01-concepts-data-binding.md) |
| 02 | `concepts/hot-reload.spec.json` | minimal | [02-concepts-hot-reload.md](02-concepts-hot-reload.md) |
| 03 | `concepts/one-layout-json.spec.json` | minimal | [03-concepts-one-layout-json.md](03-concepts-one-layout-json.md) |
| 04 | `concepts/viewmodel-owned-state.spec.json` | minimal | [04-concepts-viewmodel-owned-state.md](04-concepts-viewmodel-owned-state.md) |
| 05 | `concepts/why-spec-first.spec.json` | minimal | [05-concepts-why-spec-first.md](05-concepts-why-spec-first.md) |
| 06 | `guides/custom-components.spec.json` | minimal | [06-guides-custom-components.md](06-guides-custom-components.md) |
| 07 | `guides/localization.spec.json` | minimal | [07-guides-localization.md](07-guides-localization.md) |
| 08 | `guides/navigation.spec.json` | minimal | [08-guides-navigation.md](08-guides-navigation.md) |
| 09 | `guides/testing.spec.json` | minimal | [09-guides-testing.md](09-guides-testing.md) |
| 10 | `guides/writing-your-first-spec.spec.json` | minimal | [10-guides-writing-your-first-spec.md](10-guides-writing-your-first-spec.md) |
| 11 | `home.spec.json` | moderate | [11-home.md](11-home.md) |
| 12 | `learn/data-binding-basics.spec.json` | minimal | [12-learn-data-binding-basics.md](12-learn-data-binding-basics.md) |
| 13 | `learn/first-screen.spec.json` | minimal | [13-learn-first-screen.md](13-learn-first-screen.md) |
| 14 | `learn/hello-world.spec.json` | rich | [14-learn-hello-world.md](14-learn-hello-world.md) |
| 15 | `learn/index.spec.json` | index | [15-learn-index.md](15-learn-index.md) |
| 16 | `learn/installation.spec.json` | rich | [16-learn-installation.md](16-learn-installation.md) |
| 17 | `learn/what-is-jsonui.spec.json` | minimal | [17-learn-what-is-jsonui.md](17-learn-what-is-jsonui.md) |
| 18 | `platforms/kotlin.spec.json` | minimal | [18-platforms-kotlin.md](18-platforms-kotlin.md) |
| 19 | `platforms/rjui.spec.json` | minimal | [19-platforms-rjui.md](19-platforms-rjui.md) |
| 20 | `platforms/swift.spec.json` | minimal | [20-platforms-swift.md](20-platforms-swift.md) |
| 21 | `reference/attributes.spec.json` | minimal | [21-reference-attributes.md](21-reference-attributes.md) |
| 22 | `reference/cli-commands.spec.json` | minimal | [22-reference-cli-commands.md](22-reference-cli-commands.md) |
| 23 | `reference/components.spec.json` | minimal | [23-reference-components.md](23-reference-components.md) |
| 24 | `reference/json-schema.spec.json` | minimal | [24-reference-json-schema.md](24-reference-json-schema.md) |
| 25 | `reference/mcp-tools.spec.json` | minimal | [25-reference-mcp-tools.md](25-reference-mcp-tools.md) |
| 26 | `tools/agents.spec.json` | moderate | [26-tools-agents.md](26-tools-agents.md) |
| 27 | `tools/cli.spec.json` | moderate | [27-tools-cli.md](27-tools-cli.md) |
| 28 | `tools/helper.spec.json` | minimal | [28-tools-helper.md](28-tools-helper.md) |
| 29 | `tools/mcp.spec.json` | moderate | [29-tools-mcp.md](29-tools-mcp.md) |
| 30 | `tools/test-runner.spec.json` | minimal | [30-tools-test-runner.md](30-tools-test-runner.md) |

## Acceptance (per plan)

Each per-page plan passes when:
- Spec's `dataFlow.viewModel.methods` covers every `stateManagement.eventHandlers` entry.
- Spec's `dataFlow.viewModel.vars` covers every observable `stateManagement.uiVariables` entry.
- Every method has a description >= 2 sentences spelling out the ViewModel body concerns.
- `jui_verify --fail-on-diff` passes (the existing ViewModel matches the documented contract).
- `doc_validate_spec` passes.

## References

- `jsonui-dataflow` skill — canonical schema for `dataFlow.viewModel`.
- [`design-overhaul-pc-first/09-page-header-refactor.md`](../design-overhaul-pc-first/09-page-header-refactor.md) — removes `onToggleLanguage` from every content spec; Phase 09 and this plan **collide** if executed in parallel. Run this overview's plans **first**, then Phase 09 drops the handler cleanly knowing what it's dropping.
