# Mcp - jsonui-mcp-server

## Overview

Tools > MCP server overview. The typed API surface the agents use to inspect every JsonUI project. 46 tools in six groups: A (lookup, 10), B (validation, 7), C (generation, 7), D (build + runtime, 9), E (API model discovery, 3), F (test tooling, 10) — as of jsonui-mcp-server 2.15.0. ~12-min read. Companion to /tools/agents — agents are the clients, MCP is the protocol.

| | |
|---|---|
| Created | 2026-04-23 |
| Updated | 2026-09-30 |

## Screen Structure

### UI Components

| Component | ID | Platform | Description | Initial State | Notes |
|---|---|---|---|---|---|
| View | `tools_mcp_root` | - | - | - | - |
| &nbsp;&nbsp;↳ Scroll | `tools_mcp_scroll` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;↳ View | `tools_mcp_header` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;↳ View | `tools_mcp_content_with_rail` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `tools_mcp_body_column` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_what` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_shape` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_catalog` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Collection | `tools_mcp_catalog_collection` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_groups` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `tools_mcp_next` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Collection | `tools_mcp_next_collection` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `tools_mcp_footer` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `tools_mcp_rail_column` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `tools_mcp_toc_wrap` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ TableOfContents | `-` | - | - | - | - |

### Layout Structure

```
tools_mcp_root
└── tools_mcp_scroll
```

## Data Flow

```mermaid
flowchart TD
    VIEW[McpView] --> VM[McpViewModel]
    VM -- tools --> VIEW
    VM -- nextReadLinks --> VIEW
    VIEW -- onNavigate(url) --> VM
```

### ViewModel

#### Methods

| Signature | Platforms | Description |
|---|---|---|
| `onAppear()` | all | Seed tools + nextReadLinks. tools carries 39 MCP tool entries grouped A/B/C/D/E/F by function (Lookup / Validation / Generation / Build+Runtime / API Model Discovery / Test Tooling). Each row's nameKey / groupKey / roleKey is pre-resolved via StringManager with the tools_mcp_ prefix. nextReadLinks points to /tools/agents and /tools/cli. |
| `onNavigate(url: String)` | all | router.push(url). Hit by NextReadLink card taps. |

#### Vars

| Declaration | Flags | Platforms | Description |
|---|---|---|---|
| `var tools: Array(McpToolRow)` | observable | all | 39 MCP tool rows, grouped by role (A/B/C/D/E/F). |
| `var nextReadLinks: Array(NextReadLink)` | observable | all | 2 closing cards. |

## State Management

### UI Data Variables

| Variable Name | Type | Description | Notes |
|---|---|---|---|
| `tools` | [McpToolRow] | 39 MCP tools. Each entry names the tool, declares its group (A/B/C/D/E/F), and a one-line role. Group E (added 2026-05) holds the 3 API Model Discovery tools: list_api_specs, list_api_models, preview_api_model_sync. Group F (added 2026-07) holds the 6 Test Tooling tools: test_validate, test_generate_screen, test_generate_flow, test_generate_description, test_report, test_mock_generate. | - |
| `nextReadLinks` | [NextReadLink] | Two closing cards: Agents (client of MCP) + CLI (caller behind jui build). | - |

### View-local Event Handlers

_Handlers kept inside the View layer. ViewModel public API lives under `dataFlow.viewModel`._

| Handler | Description | Notes |
|---|---|---|
| `onAppear` | Seed tools + nextReadLinks from the static v1 catalog. | - |
| `onNavigate` | Client-side navigation. | - |
| `onNavigateTools` |  | - |

## User Actions

| Action | Processing | Destination | Notes |
|---|---|---|---|
| Tap a TOC entry | TOC-internal scroll. | - | - |
| Tap a NextReadLink card | onNavigate(url). | - | - |

## Validation

## Transitions

| Condition | Destination | Notes |
|---|---|---|
| url is a spec-mapped tools URL or / | Target spec screen or tab | - |

## Related Files

| Type | File Path | Notes |
|---|---|---|
| Layout | `docs/screens/layouts/tools/mcp.json` | - |
| Layout | `docs/screens/layouts/cells/mcp_tool_row.json` | - |
| ViewModel | `jsonui-doc-web/src/viewmodels/tools/McpViewModel.ts` | - |
| View | `jsonui-doc-web/src/app/tools/mcp/page.tsx` | - |

## Notes

- Second live entry under the Tools tab. Flipping TOOLS_ENTRIES row 2 (mcp) from 'upcoming' to 'live' in HomeViewModel finishes the task.
- 39 tools total (as of 2026-07). Group A = 8 (lookup, incl. get_data_source), Group B = 6 (validation), Group C = 7 (generation), Group D = 9 (build + runtime), Group E = 3 (API Model Discovery — 2026-05), Group F = 6 (Test Tooling — new 2026-07). Per-tool prose lives on /reference/mcp-tools; this page is the overview.
- The cell uses a generic mcp_tool_row layout, not the agent_row layout — even though the visual is similar, the group pill differs in semantics (A/B/C/D/E/F letter code rather than a named role).
- 2026-05 update (swagger-driven Data Models): Group E added with 3 tools — list_api_specs (enumerate docs/api/), list_api_models (per-platform DTO/Domain/orphan inventory), preview_api_model_sync (dry-run filter changes; returns kept_schemas / filtered_out / skip_domain_matches / halts JSON). Body copy gains a Group E section after the existing D section; the section_groups_body / section_catalog_body / section_what_body strings are revised accordingly. Per /docs/plans/2026-05-27-swagger-models-doc-additions §5, this is also the trigger to fix the stale 'Rendered from live Swagger / tool manifests' phrasing in tools_mcp_section_catalog_body — replacement copy framing is 'Hand-authored catalog kept in sync with the MCP server's 5-group tool list (33 tools currently — A:8 / B:6 / C:7 / D:9 / E:3).' Detail page for each Group E tool is /reference/mcp-tools and /guides/api-data-models §5–§6.
- 2026-07 update (test tooling migrated to jsonui-cli + MCP): Group F added with 6 tools — test_validate (schema-validate test files; installs validated tests to platform dirs when test.install is configured), test_generate_screen, test_generate_flow, test_generate_description, test_report (results JSON → JUnit/HTML), test_mock_generate (scaffold OpenAPI mocks; check:true = drift-only). The long-running `mock serve` is intentionally NOT exposed over MCP (local HTTP server + run-target execution). Totals move 33 → 39 tools, 5 → 6 groups; section_groups_body / section_catalog_body strings gain a Group F clause. Source of truth = TOOL_IDS in jsonui-doc-web/src/viewmodels/tools/McpViewModel.ts. Detail rows on /reference/mcp-tools; guide at /guides/testing.
- 2026-09-25 — jsonui-mcp-server 2.13.0 adds test_contracts_coverage (group F): the catalogue is 46 tools, A:10 / B:7 / C:7 / D:9 / E:3 / F:10. Checked against the installed 2.13.0 server's registered tool names: 46 on each side, no difference in either direction. The English lead still said 'Forty-four' while the Japanese said 45; both now say 46, as do the count sentences on the other pages (14 keys). jui_generate_converter's Japanese role line had been left in English and is translated.
- 2026-09-28 — jsonui-mcp-server 2.14.0 (npm latest since 09:06 JST) uptake. The published 2.13.0 and 2.14.0 packages were unpacked and compared: the same 46 tools by name (the catalogue did not move), with three definitions changed — jui_generate_converter's container (false now asks for a leaf, --no-container, needs jsonui-cli 1.9.0; before, false passed nothing), jui_generate_project's description and force (an existing layout that differs from the spec is kept and named), get_data_source (adds type_synonyms.json) — and two internals: the CLI child's stdin is closed at start, and the loader resolves type synonyms. Measured: lookup through each version's own loader on its bundled data — ProgressBar and HStack are not found on 2.13.0 and resolve to Progress / View with a typeSynonym (HStack implying orientation horizontal) on 2.14.0, Progress resolving on both as the control; `jui g project` re-run on a hand-edited layout — 1.8.120 overwrote it ('Created:'), 1.9.1 kept it ('Kept existing layout: … --force replaces it') and --force replaced it. The stdin change is the server's own record, not measured here.
- 2026-09-30 — jsonui-mcp-server 2.14.1 and 2.15.0 uptake. The catalogue did not move: 46 tools by name on both. 2.14.1 re-pins the definitions snapshot to jsonui-cli v1.9.2 and corrects the version its descriptions name for type synonyms and a leaf converter (1.9.0, not the unreleased 1.8.121). 2.15.0 (snapshot pinned to v1.9.3) changes read_spec_file: a spec whose prose fields hold texts-file references ({"md": ...}, in the fields jsonui-cli 1.9.3 accepts) comes back with each one expanded to {"md", "text"} plus a summary block, and a spec without references comes back byte for byte (src/tools/context/read_spec_file.ts at 5a85869; tests/tools_context.test.ts, 31/31 passing). search_specs still matches the spec JSON only, and its role line now says so. npm's latest is still 2.14.1; the installer and install.sh track origin/main, so an install made today gets 2.15.0.

<!-- jsonui-doc-producer: jsonui-doc:spec -->
