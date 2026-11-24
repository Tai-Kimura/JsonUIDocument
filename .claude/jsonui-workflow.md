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

Every task must satisfy all five invariants:

1. `jui build` must pass with **zero warnings**.
2. `jui verify --fail-on-diff` must pass with no drift — **and you must read both of its counts**: `verified N of M screen(s)` and `checked against the spec's declarations: K of E externally authored layout(s) — F finding(s)`. Screens whose layout is authored externally are not in `verified`; they are checked on the `checked` line, and its findings are WARNINGs that do not affect the exit code unless `"verify": {"external": "gate"}`. `verified 0` with `checked` 0 or missing (the line is printed only when there is an externally authored layout) means the check did not run, not that it passed.
3. `@generated` files are never hand-edited — edit the spec instead.
4. `jui lint-strings` must be clean (and `jsonui-localize` run for VM-side strings) before a screen is considered done.
5. Conditional logic and hand-written code are **declared and tested** — `branchContracts` / `unitContracts` where the entry makes a real test exist, and `jsonui-test generate branch-tests --check` / `unit-stubs --check` exit 0, and (from 1.9.0) `jsonui-test validate` passes its coverage section — nothing outside the app's baseline, nothing stale or vanished in it, nothing that cannot be baselined. A method with no branches and nothing to assert gets no entry.

Full details in `.claude/jsonui-rules/invariants.md`.

### MCP-first

Agents call the `jsonui-mcp-server` for spec reads, layout reads, component lookups, `jui build` / `jui verify` / `jui generate project|screen|converter`, and platform-tool sync. Two `jui` subcommands still require Bash: `jui lint-generated` (CI-only) and `jui lint-strings` (the localize gate). See `.claude/jsonui-rules/mcp-policy.md`.

### What you MUST NOT do

1. Edit `@generated` files by hand — edit the spec.
2. Commit work that produces `jui build` warnings — fix them first.
3. Skip `jsonui-localize` "just this once" — it's a gate.
4. Silently fall back to Bash when an MCP call fails — surface the failure.
5. Bypass bug-trace investigation for Workflow 2 bug fixes — the spec-first trace dramatically improves accuracy.
6. Invent behavior that is not in the spec — ask the user or update the spec first.
7. Record the first coverage baseline (`jsonui-test contracts baseline --initial`), or pass `--no-coverage-check`, to turn `jsonui-test validate` green — the first recording is the user's decision; agents only shrink an existing baseline (see `.claude/jsonui-rules/invariants.md`).

### File layout

- Agents: `.claude/agents/jsonui-*.md` (`jsonui-conductor`, `jsonui-define`, `jsonui-ground`, `jsonui-implement`, `jsonui-debug`, `jsonui-test`, `jsonui-navigation-{ios,android,web}`)
- Rules: `.claude/jsonui-rules/{invariants,mcp-policy,design-philosophy,file-locations,specification-rules}.md`
- This file: `.claude/jsonui-workflow.md` (injected at session start and invoked via `/jsonui`)
