# BranchContracts - Branch contracts

## Overview

Guides > Branch contracts. How the opt-in `branchContracts` section of a screen spec declares machine-checkable branch tables for VM/UseCase methods (jsonui-cli 1.6.18). Nine sections: what the section is, a complete worked example, named conditions with witnesses, the when vocabulary, the then vocabulary, platform-scoped branches (`platforms`, jsonui-cli 1.6.22), what validate enforces (error/warning/skip), what the generated HTML shows (decision tables), and a summary + link to the dedicated Branch tests guide for test generation (user-directed split, 2026-08-24). ~8-min read.

| | |
|---|---|
| Created | 2026-08-24 |
| Updated | 2026-08-24 |

## Screen Structure

### UI Components

| Component | ID | Platform | Description | Initial State | Notes |
|---|---|---|---|---|---|
| View | `guides_branch_contracts_root` | - | - | - | - |
| &nbsp;&nbsp;↳ Scroll | `guides_branch_contracts_scroll` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;↳ View | `guides_branch_contracts_header` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;↳ View | `guides_branch_contracts_content_with_rail` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `guides_branch_contracts_body_column` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_what` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_example` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_conditions` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_when` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_then` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_scoped` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_validate` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_render` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_generate` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `guides_branch_contracts_next` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Collection | `guides_branch_contracts_next_collection` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `guides_branch_contracts_footer` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `guides_branch_contracts_rail_column` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `guides_branch_contracts_toc_wrap` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ TableOfContents | `-` | - | - | - | - |

### Layout Structure

```
guides_branch_contracts_root
└── guides_branch_contracts_scroll
```

## State Management

### UI Data Variables

| Variable Name | Type | Description | Notes |
|---|---|---|---|
| `nextReadLinks` | [NextReadLink] | Three closing cards: writing your first spec, verifying implementation against docs, writing screen tests. | - |

### View-local Event Handlers

_Handlers kept inside the View layer. ViewModel public API lives under `dataFlow.viewModel`._

| Handler | Description | Notes |
|---|---|---|
| `onAppear` | Seed nextReadLinks. | - |
| `onNavigate` | Client-side navigation. | - |
| `onNavigateGuides` |  | - |
| `onNavigateBranchTests` |  | - |

## Notes

- 2026-08-24 — New page, requested alongside the jsonui-cli 1.6.18 uptake: branchContracts is the first machine-checked slice of a screen spec's behavioral prose, so it gets a dedicated authoring guide.
- Canonical source: document_tools/jsonui_doc_cli/spec_doc/screen_spec_schema.py (branchContracts + branchCondition + branchMethodContract + branchEntry $defs; the descriptions there are the primary vocabulary definition) and spec_doc/validator.py (_validate_branch_contracts and its collectors define the error/warning/skip boundary).
- Every validate message and the rendered decision-table text on this page were measured against the shipped 1.6.18 tools with a neutral fixture spec (ProfileScreen), not transcribed from release notes: each error/warning class was triggered one mutation at a time, and the HTML summary line (declared/note-only counts) comes from the actual generator output.
- This page's layout file is kebab-case (branch-contracts.json); own-section string resolution for kebab basenames requires jsonui-cli >= 1.6.5.
- 2026-08-24 — Section 8 added for the v1.6.19 uptake (branchContracts P2). Canonical source: test_tools/jsonui_test_cli/branch_tests.py (the module docstring is the contract description). The command output, the generated it-block, and all four hard generation errors on the page were measured with a neutral fixture project (spec + jui.config.json + tests/mocks) against the shipped 1.6.19 tools; regeneration behavior (harness kept, @generated rewritten) was also exercised. The P1-era sentence 'the scenario name is not checked against any declaration today' was revised, since generation-time binding now checks it.
- 2026-08-24 — Section 9 added for the v1.6.20 uptake (branchContracts P3, Android/JVM). Measured with the same neutral fixture: android outputs 3 files under <out-dir>/<package-path>, regeneration keeps the harness, --package absence and the shared binding errors were exercised, and --platform rejects anything but web/android (the basis for the 'iOS is not supported yet' sentence). The generated @Test block on the page is verbatim generator output.
- 2026-08-24 — Promotion caution added to the validate section (adoption feedback, no upstream change): when declaring a previously-undeclared field, `observable` must match the implementation's actual shape (observable: true demands @Published / StateFlow / Data-object form per the viewModelVar schema description), and `platforms` limits a single-platform field (omit = all, [] = nowhere + warning). Backed by screen_spec_schema.py's viewModelVar observable/platforms descriptions.
- 2026-08-24 — v1.6.22 restructure per user direction: sections 8-9 (web/android generation) moved to the new /guides/branch-tests page; this page keeps declaration/validate/decision-table, gains section 6 (platform-scoped branches — validate error measured verbatim) and section 9 (generation summary + link). Data prop onNavigateBranchTests added for the link.
- 2026-08-24 — Cross-face warnings documented for the v1.6.23 uptake: both seams, the whole-spec difference-set definition, the prose-absence-is-legal principle, and structural opt-in. All five behaviors measured with the neutral fixture (orphan token warning / elsewhere-known token silence / orphan transition warning / non-contracted-action decoy silence / no-branchContracts silence); the two warning messages on the page are verbatim validator output. Existing docsite specs re-validated: 96/96 PASSED, 0 cross-face warnings.
- 2026-08-24 — Promotion caution extended with the visibility half (adoption feedback): a declared var becomes a generated-protocol requirement, which a private field cannot satisfy; typical fix is private(set). Backed by reading the ios generator: the emitted <Screen>ViewModelProtocol lists declared vars as protocol requirements (jui_cli/generators/ios_generator.py protocol emission).
- 2026-08-24 — v1.6.24 uptake: the decision-table platforms gap (our filed seed) is closed upstream — section 8 documents the conditional Platforms column + scoped-count summary (both directions measured: column and '2 branch(es) are scoped' with platforms, byte-stable without), section 6 cross-references it, and the promote bullet records that protocol-sync now accepts private(set) forms directly (backed by the unified _ACCESS_MODIFIER vocabulary in protocol_sync/method_extractor).
- 2026-08-24 — v1.6.26 uptake: section 3 documents the condition usage warnings (declared-but-ungated / used-polarity witness absent — validate now says first what test generation already hard-errors on, only used polarities required / identical witnesses) plus the honest limit (the predicate exists only as meaning prose, so witness self-testing was rejected, not half-promised) and the fix-the-asset principle. All three warnings measured verbatim with the neutral fixture; positive-only-use silence and no-double-finding-on-unknown-cond also measured.
- 2026-08-24 — v1.6.27 uptake: the then-vocabulary section documents `null` as a legal data.<field> value (returns-to-unset, distinct from empty string) with the optimistic-update rollback contract as its canonical use.
- 2026-08-25 — v1.6.29 uptake: the then-vocabulary section documents @response.<path> (server-chosen values that neither a literal nor @key can express; resolved at generation time from the named scenario's response body, so nothing reaches the runtime and all three platforms share the path) alongside a side-by-side of the three @ forms, its exactly-one-scenario precondition, the validate warning, and the three hard errors — all measured verbatim with the fixture (resolution to a literal confirmed in the emitted test; one-scenario case measured silent). Section 1 also records that the note count is an instrument: the census of escaped branches is what produced this vocabulary.
- 2026-08-25 — v1.6.30 uptake: the when-vocabulary section states that arg.<name> binds only to dataFlow.viewModel.methods[].params, with the reason (eventHandlers have no params because they are View-layer; the ViewModel's public API is what dataFlow declares) and the 1.6.30 change from silent drop to error. Backed by the schema definition, not just the release note.
- 2026-08-25 — The passthrough paragraph states the form's boundary as a settled decision (not a pending one): client-produced values (an SDK's own message, a library exception) are not determined by the scenario, so they stay notes — the only available claim would be 'non-empty', which would stay green while an unlocalized library string reaches the screen. Recorded after a scan confirmed the site carried no future-tense hedging on this or on branch-test CI integration.
- 2026-08-25 — when-vocabulary records that data.* values are scalar literals (measured verbatim: 'when data.* value must be a scalar literal (string/number/bool/null), got dict'), with wholesale state substitution belonging to a named condition's witness. Section 1 notes the side effect that writing a contract surfaces rot in the surrounding prose.
- 2026-08-25 — v1.6.34 uptake: the promote bullet now warns that a declaration changes the app's own API — the generated protocol grows a requirement on every platform the screen targets, so one platform's green gates are not evidence — and that when a declaration exists only to let a test reach a state, changing how the test reaches it (arrange through a declared field, let the harness drive the real interaction) beats publishing an internal flag.
- 2026-08-25 — Two independent decisions made explicit: whether a screen deserves a spec (is it an independent thing to declare) and whether it deserves a contract (are there failure paths worth pinning). A display-only screen can answer yes then no; recording that reason in the spec's notes makes it read as a decision rather than an oversight. Section 1 also notes that the prose-rot side effect crosses platforms — a correctness written down on one face makes the same mistake recognizable on the other.
- 2026-08-25 — The cross-platform side effect now carries its operational form: a contract pins a property rather than one implementation, so after writing one, sweep for the same judgement elsewhere. Illustrated with the reported shape (one rule written out four times, wrong in two, the wrong ones diagonal across platform and project) in neutral terms — from one face it reads as a slip, across both it is a duplicated judgement.
- 2026-08-31 — section_then_body gains the 1.7.24 empty-list outcome. Measured on one fixture spec, four arms: then {data.rows: []} PASSES on v1.7.24 and is an ERROR on v1.7.23 ('Value must be a scalar literal ... got list'); a non-empty ["a"] is refused on 1.7.24 with the longer message that names the accepted set and the reason element-by-element matching is out of scope; and the same [] written under api.fetch.request.ids in the same branch is still refused, with the short message that does not mention the exception. That last arm is the one worth keeping — it shows the exception is scoped to the leaf rather than to the value, and it was measured alongside a passing data.<field> [] in the same spec, so nothing about the run explains the difference except the leaf. The companion 1.7.24 change (mock route index union for test-side scenario references) is NOT documented here: the scenario-reference check never fired in the fixture — every arm, including a decoy scenario declared in neither half, reported 'Unchecked mocks: 2' — so there was no measurement to publish.
- 2026-09-01 — section_then_body gains branchContracts.seedableState (jsonui-cli 1.7.29). Four arms measured: a declared name with when {state.canRead: false} validates clean on 1.7.29; the same spec on 1.7.28 is rejected with 'Unknown branchContracts key' plus 'Unknown when key state.canRead'; removing the seedableState block makes the name an ERROR naming the section to declare it in; and, in one spec carrying both, an undeclared state.* is an error while an undeclared data.* is only a warning. That last pair is the one published with its reason, because the asymmetry looks arbitrary otherwise: a data field the spec does not list may exist on a platform this spec does not describe, whereas internal state is arranged by the generated test itself, so an undeclared name seeds nothing and the branch runs from whatever state it started in — green for a reason unrelated to the implementation.
- 2026-09-03 - section_then_body gains the 1.8.20 rule for object- and list-valued seedableState: the read-back is a partial match on every platform (the seed's keys only, nested, lists element-wise), plus the harness-side consequence upstream measured on iOS (a let init argument makes the harness rebuild the view model). Taken from the tool's README and the generator's partialMismatches helper; this site tracks no generated branch tests, so nothing here regenerates.
- 2026-09-08 - jsonui-cli 1.8.48 moves two published sentences in section_then_body, both in the direction that makes the old text false. A request leaf now takes a list of scalars, empty included, meaning the whole array with order — the page said it was 'still refused'. The old refusal rested on two reasons and only one of them travelled: matching elements binds a contract to the mock body, which is true and still the rule on the `data.*` side where the list came from the mock, but a request list is what the app sent, so it is the subject rather than the fixture; the other reason, that `[]` there had no defined partial-match meaning, was a gap and 1.8.48 defined it. The rewrite keeps that distinction rather than saying the page was wrong, because it was not — the meaning was undefined, and a reader who takes 'we were wrong' from it will discount the other dated clauses on this page too. Measured here across both pins: at 1.8.47 both a scalar list and `[]` are refused with 'Value must be a scalar literal … got list'; at 1.8.48 both pass. A reference as a list element is refused at 1.8.48 with its own message, and so is a non-scalar element. The neighbours were measured unmoved: `[]` on a `then data.<field>` outcome still passes, a non-empty list there is still refused, and `when.data.*` takes no list at all — not even `[]`, which is worth knowing because the release notice read as though it did. Second sentence: 'lists element-wise' is now 'arrays element-wise, unordered collections by membership'. Measured on the shipped web runtime by running its own comparison functions rather than a transcription of them — 8 arms, reversed array mismatches at index 0, a Set matches in any order, and length differences fail on both sides; the Kotlin and Swift runtimes carry the same two branches. The sentence now also states what the rule does not guarantee: a declared `[String]` says nothing about whether order is part of the value, so one face may implement a set and another a list from the same declaration and the same contract is then judged differently on each. That limit is upstream's own finding, recorded rather than fixed in this release.
- 2026-09-08 - jsonui-cli 1.8.49 narrows the api-op ambiguity error, and section_validate gains the bullet that error never had. The page's §7 presents three findings — errors, warnings, skip — and says every message shown is real validator output; the ambiguity error was in none of them, while the warning bullet told the reader that an API operation finding is warning-level because 'operation ids may legitimately stay undeclared'. That is the opposite case: ambiguity fires when the name IS declared, twice. A reader following the two bullets predicted a warning and got a failed validation. So the addition is not a version note on an existing sentence — it is a rule the page had never stated, added at the moment the release changed its denominator. What 1.8.49 changed, measured here as an A/B of the two shipped tag trees over one spec written in the page's own vocabulary (ProfileScreen / updateProfile): with a second owner declaring the same bare name at `endpoint: null`, 1.8.48 reports 1 error and 1.8.49 reports 0; with a second owner that names a real route, both pins report the error, so the check narrowed rather than went away. A path with no verb (`/api/entries`) behaves like the null case — error at 1.8.48, silent at 1.8.49 — which is what fixes the predicate at `<METHOD> <path>` rather than at 'an endpoint key is present'. The advice population moved too, and that is the half worth publishing: on a spec with two endpoint-bearing owners and a third endpointless one, 1.8.48 named all three, so the qualification the message told the author to write pointed at an owner the generator would never bind. The collateral the narrowing must not cause was measured as well — the bare name stays in the declared set, so the error is not traded for a 'not declared in dataFlow' warning (0 warnings on that path at 1.8.49). Nothing in this repository moved and the reason is structural, not luck: of 103 specs and 42 dataFlow methods here, 0 declare an HTTP endpoint and 0 branchContracts reference an `api.*` op, so the changed code path is unreachable on this face and `validate spec docs/screens/json` is byte-identical across the two pins. That identity is therefore not evidence about the fix, which is why every claim above comes from the fixture instead. The release's other half, `generate html` recording a failure instead of skipping an input that will not validate, does not reach this face either, and the reason is worth writing down because the gate looks like it should be affected: the fix is in `_pre_generate_spec_docs`, which only `generate html` calls, while the spec-docs-match gate runs `generate spec`, a different entry point that already reported FAILED and exited 1 on an invalid spec at 1.8.48 — measured on both pins with the same fixture. Help churn across the three argparse binaries: 0 of 149 leaves, both arms rendered from one identical directory name, with v1.8.42..v1.8.43 through the same harness as the control at 8 of 149.
