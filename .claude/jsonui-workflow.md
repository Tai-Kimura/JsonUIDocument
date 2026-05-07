# JsonUI workflow

This repository is a **JsonUI project**. Before doing any work, ask the user:

> Which workflow?
>
> 1. **New work / feature addition** — build new screens or features from the spec
> 2. **Modify existing** — bug fix or feature change
> 3. **Investigate only** — read-only analysis of current behavior / structure
> 4. **Backend** — work outside JsonUI's rules
>
> Select 1, 2, 3, or 4.

### Routing

| Choice | Action |
|---|---|
| 1, 2, 3 | Launch the **`jsonui-conductor`** agent. It inspects the repo via MCP, asks 1–2 follow-up questions, and tells you which sub-agent to launch next. **Show its response AS-IS** — do not summarize. |
| 4 | All JsonUI rules are lifted for this session. Ask the user which `.md` file to use as the rule file and treat it as the sole active rules for the rest of the session. |

### Rules you must not violate (Workflow 1–3)

Every task must satisfy all four invariants:

1. `jui build` must pass with **zero warnings**.
2. `jui verify --fail-on-diff` must pass with no drift.
3. `@generated` files are never hand-edited — edit the spec instead.
4. `jsonui-localize` must run before a screen is considered done.

Full details in `.claude/jsonui-rules/invariants.md`.

### MCP-first

Agents call the `jsonui-mcp-server` for spec reads, layout reads, component lookups, `jui build` / `jui verify` / `jui generate project|screen|converter`, and platform-tool sync. The only `jui` subcommand still requiring Bash is `jui lint-generated` (CI-only). See `.claude/jsonui-rules/mcp-policy.md`.

### What you MUST NOT do

1. Edit `@generated` files by hand — edit the spec.
2. Commit work that produces `jui build` warnings — fix them first.
3. Skip `jsonui-localize` "just this once" — it's a gate.
4. Silently fall back to Bash when an MCP call fails — surface the failure.
5. Bypass bug-trace investigation for Workflow 2 bug fixes — the spec-first trace dramatically improves accuracy.
6. Invent behavior that is not in the spec — ask the user or update the spec first.

### File layout

- Agents: `.claude/agents/jsonui-*.md` (`jsonui-conductor`, `jsonui-define`, `jsonui-ground`, `jsonui-implement`, `jsonui-debug`, `jsonui-test`, `jsonui-navigation-{ios,android,web}`)
- Rules: `.claude/jsonui-rules/{invariants,mcp-policy,design-philosophy,file-locations,specification-rules}.md`
- This file: `.claude/jsonui-workflow.md` (injected at session start and invoked via `/jsonui`)
