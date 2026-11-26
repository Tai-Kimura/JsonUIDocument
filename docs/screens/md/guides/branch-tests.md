# BranchTests - Branch tests

## Overview

Guides > Branch tests. Dedicated page (user-directed split from the branch-contracts guide) for `jsonui-test generate branch-tests` across all three platforms. Nine sections: what it generates and who owns which file, the HTTP-boundary-only design principle (incl. api:"none" = zero matched-route calls), per-platform sections for web/vitest, android/Robolectric+MockWebServer, ios/XCTest+URLProtocol (with the read/write asymmetry, config swizzle, process-lifetime harness retain, Xcode 16 file placement), the harness contract in its three flavors, the hard generation errors, platform-scoped branches (`platforms` key, loud skip), formatted strings via pseudo-key + harness formatting, platform-scoped branches, time-dependent state (note, not platforms — the test time models differ: virtual clock in Android settle() vs real-time run loop on iOS), and the red-check discipline + regeneration flow. ~11-min read.

| | |
|---|---|
| Layout File | `guides/branch-tests` |
| Created | 2026-08-24 |
| Updated | 2026-08-24 |

## Screen Structure

### UI Components

| Component | ID | Platform | Description | Initial State | Notes |
|---|---|---|---|---|---|
| View | `guides_branch_tests_root` | - | - | - | - |
| &nbsp;&nbsp;↳ Scroll | `guides_branch_tests_scroll` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;↳ View | `guides_branch_tests_header` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;↳ View | `guides_branch_tests_content_with_rail` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `guides_branch_tests_body_column` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_what` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_boundary` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_web` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_android` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_ios` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_harness` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_format` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_errors` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_scoped` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_timemodel` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ CodeBlock | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_scope` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `section_redcheck` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `guides_branch_tests_next` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Collection | `guides_branch_tests_next_collection` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `guides_branch_tests_footer` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ Label | `-` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `guides_branch_tests_rail_column` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ View | `guides_branch_tests_toc_wrap` | - | - | - | - |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ TableOfContents | `-` | - | - | - | - |

### Layout Structure

```
guides_branch_tests_root
└── guides_branch_tests_scroll
```

## State Management

### UI Data Variables

| Variable Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| `nextReadLinks` | [NextReadLink] | `-` | Three closing cards: branch contracts (the declaration side), writing screen tests, verifying implementation against docs. | - |

### View-local Event Handlers

_Handlers kept inside the View layer. ViewModel public API lives under `dataFlow.viewModel`._

| Handler | Description | Notes |
|---|---|---|
| `onAppear` | Seed nextReadLinks. | - |
| `onNavigate` | Client-side navigation. | - |
| `onNavigateGuides` |  | - |
| `onNavigateContractGaps` |  | - |

## Notes

- 2026-08-24 — New page, per user direction: generation moves off /guides/branch-contracts into this dedicated guide; the old page keeps declaration/validate/decision-table and links here.
- Canonical sources: test_tools/jsonui_test_cli/branch_tests.py (module docstring + the ios runtime template's reason comments — URLProtocol config swizzle, retain-for-process-lifetime) and document_tools screen_spec_schema/validator for the branch-level platforms key.
- Measurement: web and android sections reuse earlier fixture-measured outputs; ios generation, --module requirement, the platforms-scoped skip comments (both directions), the platforms validate error, and the api:"none" matchedCalls() assertion were measured against the shipped tools with the same neutral fixture. The ios @generated blocks on the page are verbatim generator output; actual XCTest execution was not run here (no xcodebuild here) — execution evidence is upstream's own run.
- The HTML decision table does not yet tag platforms-scoped branch rows (only the test generators honor the key visibly) — noted upstream in an acceptance report; this page deliberately claims only validate + generator behavior.
- 2026-08-24 — Red-check section refined after an investigation upstream: the lesson generalized from 'pick the observed surface' to 'vary the mutation depth' — a decode/mapping-stage mutation behaves like a real payload drop (empties every downstream reader), a shallow stored-field mutation can stay green when the method reads the response directly; shoot coarse-to-fine and treat a green probe as information. Source: upstream's probe results, generalized.
- 2026-08-24 — Two adoption patterns added (upstream request): section 7 pseudo-key + harness formatting for formatted localized strings (three harness flavors, illustrative app-owned code, not generator output), and section 10 time-dependent state as note-not-platforms. The time-model claim was verified in the shipped runtime templates: the Kotlin settle() calls dispatcher.scheduler.advanceUntilIdle() (virtual clock), the Swift settle() drains the real-time main run loop in slices — both with matching comments in branch_tests.py.
- 2026-08-24 — section 1 gains the endpoint-vs-OpenAPI-canon warnings (three classes measured verbatim with an OpenAPI fixture; match and non-HTTP declarations measured silent; PASSED maintained), section 10 gains the third non-contractable class (external-SDK-latency-bound state, same note-not-platforms reasoning).
- 2026-08-24 — section 7 documents the @strings_key existence check (validate = shape only vs lint-strings = existence against table + harness declarations; harness key-shaped literals in *BranchHarness* files count, covering the Swift/Kotlin closed-switch form; neither-place = missing). Scanner behavior verified by source read (check_spec_string_keys + _BRANCH_HARNESS_RE literal collection); no verbatim finding quoted since no lint-strings fixture was run. Batch validate (directory form) measured on the real tree: 'Result: PASSED (97 spec file(s))'.
- 2026-08-24 — iOS section gains the null/nil/NSNull equivalence bullet (assertFieldEquals normalizes both sides; harness may return Optionals as-is) and the consistency-restoration lesson (partialMismatches always knew the equivalence — a convention only one face knows is a hole). Measured with the fixture: a null then-value emits assertFieldEquals(NSNull(), ...), normalizeNull sits at the assert entry, the protocol comment states either form is fine, and partialMismatches' null branch also accepts absent keys.
- 2026-08-24 — Section 11 added (adoption feedback, prose-only design guidance, no tool-behavior claims): a fourth keep-it-out reason distinct from the three cannot-judge classes — a writable claim that pins an unrelated axis (canonical shape: display variants depending on plan tier; declare the axis-independent invariant instead). Includes the survive-an-unrelated-axis-change test and the too-wide-scope alarm (a red imaginable for reasons other than breakage). Red-check renumbered to 12.
- 2026-08-25 — Red-check section gains the vacuous-arrange failure mode (adoption feedback): a '…is cleared/collapses' contract whose baseline leaves the field at a default already equal to the post-clear value asserts nothing — decided at authoring time, unlike probe selection — plus the mutation-landed discipline (same line in several methods: mutate by line number; wrong-window edits: grep after applying). Section 1's arrange description cross-references it. Prose-only guidance, no tool-behavior claims, so no fixture measurement.
- 2026-08-25 — the harness section gains the web-only shadowing failure (a loop-assigning setState invents ViewModel properties for data-only fields, which readField then prefers over the store — use applyDeclaredKeys; Android skips undeclared writes, iOS is a typed switch), and the red-check section pairs it with the vacuous arrange as the same trigger seen from opposite sides (green vs red). Section 1 records the mocks-directory precedence (--mocks-dir > mock.mockDir > tests/mocks) and that the failure names the searched directory and file count. Measured: applyDeclaredKeys' key-in-target guard and the skeleton's reasoning comment read from the emitted runtime; mockDir precedence exercised by relocating the fixture's mocks and declaring mock.mockDir; error text observed (absolute path not reproduced on the page).
- 2026-08-25 — Adoption feedback: the red-check section now carries all three vacuous/misleading variants (green-and-vacuous, red-from-a-lying-harness, and green-through-the-wrong-path when the baseline disagrees with the scenario's own data on matched values like ids and timestamps), so a reader can enter from either symptom. The boundary section notes that every operation the method reaches needs a declaration, not only the branch's subject — an undeclared call goes unmatched and stops the run partway.
- 2026-08-25 — Adoption feedback (recurrence-driven): the mutation-landing advice is now a two-step procedure (locate the function and mutate relative to it; on a green run suspect a missed probe before concluding the implementation is right, grepping the marker's line number first) because the string-targeted variant recurred the same day. The three variants close with the unifying principle — the baseline is an arrange, not decoration: vacuous = no pre-state built, lying harness = built in the wrong place, wrong path = built with the wrong contents — plus the practical corollary that a new shape of arrange is when a harness's shortcuts surface, so suspect the harness before the implementation.
- 2026-08-25 — the boundary section documents file-backed scenarios (contentType + bodyFile, no inline body): status and content type are faithful, the body is empty, file contents are never embedded, so a branch can pin the call, its status and content-type branching but nothing about the bytes — reaching in with @response is a generation error, tied back to the contracts guide's mock boundary. The harness section adds the mirrored lesson: all three runtimes disagreed with the mock declaration and the fix was copied from the mock server rather than invented, plus the index-signature rationale (output the project cannot hand-edit must not break its type-check when a mock grows a key). Measured: generation succeeds for a file-backed scenario, the emitted RouteSpec carries contentType/bodyFile verbatim with no file contents, @response into such a body is a hard error, and the runtime's own comments state the empty-body/default-content-type rule.
- 2026-08-25 — section 1 records that the runtime is shared per output directory, so regeneration is a project-level operation — after a release that changes its shape, regenerating one screen breaks the siblings' compilation. Measured: with one screen no note appears; with a sibling present the command names it verbatim. The deliberate non-action (it will not regenerate for you) is stated as a design choice.
- 2026-08-25 — Fourth variant added (adoption feedback): an expectation that does not identify the branch — a @key whose text coincides with the server's own message — cannot go red when the mapping breaks; the fix belongs in the fixture (give the mock different wording). Also: redundant guards in the implementation keep a correctly-landed probe green, so 'something else already ensures this' joins 'the probe missed' as a suspect. The unifying principle now spans both ends: an arrange must build the state that makes the observation possible, an expectation must be one only this branch can satisfy.
- 2026-08-25 — The two suspects for a red-check that stays green are now ordered: first confirm the probe landed (grep the marker's line), then look for a second guard covering the same outcome. Same symptom, different place to look.
- 2026-08-25 — The two suspects for a stubborn green now have a mirror: when more goes red than the branch you broke, check the working tree before concluding the branches are entangled — restoring a mutation with a wholesale VCS checkout drags uncommitted work with it, so keep a copy before mutating and restore from that. Prose-only discipline, no tool-behavior claims, so no fixture measurement.
- 2026-08-31 — section_what_nocanon revised. Three measured facts: the notice is per file with per-file counts (the fixture holding four unchecked declarations as 3+1 across two specs prints both); the message names the resolved directory and the answering config; and a declared api_directory answers even when it resolves to nothing — on a nested fixture whose inner config points api_directory at a missing path while an ancestor's default directory holds documents, one warning names the broken path rather than borrowing the ancestor canon and blaming routes that are correct. The preserved side is measured with the same fixture minus one key: a config that says nothing about the API still falls through to the ancestor's canon, so the monorepo layout keeps working. Published paths are elided to '…/sub/...' because the real message prints absolute paths.
- 2026-08-31 — section_what_nocanon updated: the notice carries its unit, 'N endpoint(s), declared in M place(s)'. Measured on a one-spec fixture with two routes declared four ways (each route on a method and again in apiEndpoints, one of them spelled {item_id} in one place and {itemId} in the other): 2 endpoint(s) / 4 place(s), and dropping the apiEndpoints block alone takes it to 2 / 2 — so routes stay put while places halve, which is the contrast that shows the two units are counting different things. The published guidance is routes for how much contract is unchecked, places for how much work the check skipped.
- 2026-08-31 — section_what_nocanon gains the caveat on summing the two columns across a run, prompted by an upstream report whose totals disagreed with the sum of the notices. Measured rather than transcribed: two specs declaring the same route each print '1 endpoint(s), declared in 1 place(s)' over a fixture of one route and two places, so the places column sums exactly (a declaring site belongs to one file) while the routes column double-counts anything shared between files. The upstream note also offered a second mechanism, a parent spec's merged view re-listing its subs' declarations; that one did not reproduce here — on a parent with two subs, jsonui-doc validate spec counts the parent among the files but only the subs carry the notice — so only the mechanism that was measured is published.
- 2026-09-01 — section_what_shared gains generate branch-tests --check. Measured end to end on a fixture: generate, then change ONLY a mock scenario body and regenerate nothing, and the run goes from '1 up to date, 0 stale' with exit 0 to a [DRIFT] line naming the generated test file, '0 up to date, 1 stale', and exit 1. Getting there took four fixture corrections (endpoint on the repository method, a swagger, generated mocks, a scenario name the mock actually declares), each of which failed with its own message rather than silently — worth noting because the failures were legible enough to fix without guessing. The exit code was captured into a variable rather than read after a pipe, after a first attempt printed the exit status of tail.
- 2026-09-01 — the harness contract section gains the return-value half. The rule itself was read out of the shipped generated runtime and then exercised: the wrapper's condition (resolved === key, or an identifier-shaped result ending in _<key>) was transcribed verbatim and run over eight inputs. One edge is published because it changes what the check's silence means: text that is a single identifier-shaped word ending in the key is rejected as well — Some_title for title — which is a false positive narrow enough to accept but not to hide. Also checked: this page publishes the branch-tests --check summary verbatim as '1 up to date, 0 stale' and '0 up to date, 1 stale'. The file-level marker is [RETIRED] and the count in the parenthetical is 'retired', but the screen-level clause is as quoted. Confirmed by reading the shipped format string and by the upstream tests that assert those exact substrings — not by running the command against a fixture of this site's own, because this repo declares no branchContracts and the command exits with 'no screen declares branchContracts.methods'. No resolveString harness exists here either, so the return-value check has nothing to fire on in this repo: that zero is structural, not measured.
- 2026-09-01 — an empty resolveString return fails like a key return; the condition has a leading !resolved. Ran the transcription harness against the shipped runtime over ten inputs: "" is rejected, and "0" is not — worth checking because the guard is a JS truthiness test and "0" is truthy in JS, so the obvious port to a language where it is not would misfire. One edge stays open and is published: the test is emptiness, not blankness, so a single space is accepted. Some_title stays rejected on purpose — upstream's reasoning, which this page adopts, is that it errs toward refusing and names what it refused, while the empty case would be silent in the passing direction.
- 2026-09-01 — the resolveString failure text has a single source (3dcaf4b7). Measured rather than read off the constant: the emitted TS carries the placeholder, so the constant alone says nothing about what lands in a generated runtime. Called the renderer directly for ts, swift and kotlin and compared the three outputs: the phrase this page quotes is the same in all three. The wrapper's condition is !resolved, key equality, identifier ending _<key>, so the ten-input boundary published on this page holds. One clause added, because the page calls this a rule shared across three platforms and it is one text rather than three that agree. Not applicable here: generate branch-tests --check. This repo declares no branchContracts, so the command exits 1 with 'no screen declares branchContracts.methods (103 spec(s) scanned)' — nothing to regenerate. That is a structural zero, not a clean check: this site cannot confirm the generator change end to end, only the text it emits.
- 2026-09-01 — the resolveString failure prose is single-sourced and each language has its own quoting (JSON.stringify on ts, an emitted quotedValue helper on swift and kotlin, written to JSON.stringify's rules). A check that only compares the three renderings with each other cannot see the value splicing: it treats the value as the placeholder rather than as content. Verified with the method upstream supplied: the plain-string parts of RESOLVE_STRING_FAILURE are one list, and all three renderings carry the quoted phrase verbatim, so the page's claim — same words, not same string — is stated as the narrower thing it is. Also confirmed: prose.message with an unknown language raises ValueError naming 'kotlin', 'swift', 'ts'.
- 2026-09-01 — generated branch tests carry an inferred reachability assert, which falsified this page's 'assert = exactly the then entries'. Measured by running the shipped generator against one fixture built with the upstream test module's own _project/BASIC helpers (the fixture is input data; the generator was imported fresh per run and its file path printed as a control). It emits exactly one — expect(rec.countFor(...)).toBeGreaterThan(0) with the failure text quoting the route and the observed count — and places it before the then entries (indices 1855 < 1948 in the emitted file), so an unreached route reports as the cause rather than as a data mismatch. Suppression measured on two of the four documented forms: a then carrying api.<op>: called and a then carrying api: none each produce zero occurrences; not-called and .request are upstream-tested but not re-measured here. The web spelling was measured; the android/ios spellings are upstream-tested only. This site generates no branch tests of its own, so nothing in this repository regenerates; the measurement lives entirely in scratchpad fixtures.
- 2026-09-11 — the three `jsonui-test generate branch-tests` transcripts on this page were stale AT THE PIN, not at a release. The tool appends a qualifier to the `routes:` line — the list comes from dataFlow.repositories[].methods[].endpoint, not from the contract's api references — and closes by naming the toolchain that generated the files; neither was on the page. Nothing had moved upstream, so no release-driven check would ever have found it: the drift was already there at the pin, and it surfaced sideways while A/B-ing an unreleased candidate for something else. All three are re-shot from the pinned tool against a fixture that reproduces this page's own example (screen profile_screen, one route updateProfile, three declared branches and one note-only), and the page now states the two conventions it uses: the tool prints paths absolute and they are shown relative to the project root, and `<version>` stands in for the number the closing line carries — the page cannot name a number that is whichever toolchain the reader ran. A nineteenth gate, branch-transcripts, runs the command the page shows and compares every line of the block, so this cannot rot silently again. cli-example-shapes structurally could not see it: that arm reads the reference cards, one line family, jsonui-doc only — a gate speaks for its own set, and the fix for a blind spot is another arm rather than a broader sentence from the arm that already exists. Fired against four inputs that must fail: the pre-fix page (it names the missing qualifier), a wrong branch count, a flag the binary rejects — the command itself has to succeed for the transcript under it to be true — and an empty harvest, which is refused rather than read as agreement. Two limits, both real: wrapping and indentation are NOT compared, because the page wraps two long lines on purpose and would otherwise be red for being readable; and the fixture MIRRORS the example rather than being derived from it, so changing the example's screen name, route or counts reddens the gate until the fixture follows.
- 2026-09-11 — the read-side refusal (`countFor` and `lastBodyFor` reject an op no route declares) is documented on this page WITH its edges, because a refusal described without them reads as a guarantee. Three of the four edges are shared: it does not reach a test that filters the public `calls` list by op directly; it only hides a defect where the assert expects zero or nothing; and 'expects zero' has a second form that never spells a zero, a count taken before the act and compared with the count after. The fourth was measured here rather than transcribed, and it is NOT uniform across the faces. On Android and iOS the route table is optional and a recorder built without one refuses nothing, so a hand-written harness opts in by passing `routeOps`; on web there is no such recorder at all, because `installFetchMock` takes the routes as a required argument and derives the declared set from them — that face is always armed. Stating the limit flat would have sent a web reader looking for an opt-in that does not exist. Measured from the generated runtimes: the refusal is present on all three faces, and the generated entry points pass the route table on all three.
- 2026-09-25 — the three transcripts are re-shot: the generator prints `apiOutcomeRules: none (no app contracts spec declares them)` after the routes line; branch-transcripts went red on all three before the re-shoot and green after. Section 1 gains the act window and the upper bound, read from the generated output on all three platforms on the page's fixture: the harness is built inside the mock scope and settled before the arranged state is written and `rec.mark()` is called; countFor / matchedCalls / lastBodyFor read the window; `rec.unexpectedOps([...])` must come back empty, checked after the act and before the then entries (after the inferred reach assert where one is emitted); `api: "none"` is asserted through matchedCalls, so it means none during the act. The per-method allowance is quoted from the generated failure message; the apiOutcomeRules summary line was measured both ways (none, and '1 rule(s) from app_contracts.spec.json'). The boundary section's 'incidental calls do not fail the test' was false and is corrected. The readside paragraph gains that the public calls list keeps the calls made before the mark (the runtime's own comment). Links to the new Contract gaps guide.
- 2026-09-25 — the harness section gains harness conditions (P2d). Measured on the page's example with a `session` condition and one row naming it: validate passes the row; generate branch-tests writes the hook skeleton (branch-conditions.ts / BranchConditions.kt / BranchConditions.swift, one per app) and adds two summary lines; the generated web test awaits arrangeCondition("session", "present") after installFetchMock and before createHarness; a row naming an undeclared condition, or a value outside `values`, passes validate but is refused by generate branch-tests and contracts coverage (exit 1, naming the condition and the allowed values); with the hook deleted, --check warns and exits 0. The three transcripts on this page need no change (branch-transcripts green).
- 2026-09-25 — P2e. Section 1 gains the request handling: an unmatched request to the app's API is answered 599 and warned; another host is the info unmatched_foreign; apiOrigins on the web harness module, apiOrigin on iOS; delayMs honoured on all three platforms with settle() waiting up to 31000 ms; side routes. The first and the last were read from the generated test and runtime and measured in the generator's output. delayMs and the timeout were read from the runtime and README, not run. The boundary bullet is rewritten to match. Harness conditions gain --condition-controls (measured: 'condition controls: 1' and a '[control: session=absent instead of present]' test) and the harnessConditions-only app spec (passes). The vitest caveat is upstream's report, credited as such: with AI_AGENT or CLAUDECODE in the environment, vitest 4.1.11's default reporter drops passing tests' console output. The three transcripts on this page did not move (branch-transcripts green).
- 2026-09-25 — the request reports are one row-named line on stderr. Measured by calling the shipped web runtime's reportUnmatched / reportUnmatchedForeign directly with node: 0 bytes on stdout and the two quoted lines on stderr (the extraction first corrupted 'export apiOrigins' by stripping `export ` from the message text; it was re-run with the definitions only, and the lines are verbatim). iOS on xcodebuild's stdout and Android on Gradle's console (not the XML) come from upstream's report, not measured here.
- 2026-09-28 — a generated row's wait returns when the act's work has landed (no request in flight, QUIET_MS 400 since the last request or answer, and a row's expected ops recorded; EXPECT_MS 10000 and the 31000 ms budget fail by name), the bound's message names that window, a call an earlier row's view model makes after its row ended does not count on web and is named earlier_row_call (web, Android, iOS 26+), and web rows run under ROW_TIMEOUT_MS. That is upstream's record (commits d1499126, c644bece); measured here is the generated web code. The three transcripts did not move (branch-transcripts green).
- 2026-09-28 — on web the quiet window is settleQuiet(), which the generated rows call; the exported settle() / settle(n) is a turn drain for hand-written tests, settle({ rec, expect }) is settleQuiet, and an unnamed installFetchMock(routes) is a global mock (upstream's record, commits 3b024a6a, d5808b85, eb3fb8dc). Measured: the generated web rows call `await settleQuiet({ rec, expect: ["updateProfile"] })`. The section-1 paragraph separates the generated rows' wait from the plain settle().
- 2026-09-28 — the wait a generated web row makes after building the harness is `settleHarness()` (one turn, returning when construction made no request and scheduled no timer; settleQuiet otherwise). Measured: the generated rows call `await settleHarness()` after createHarness and `await settleQuiet({ rec, expect: ["updateProfile"] })` after the act.

<!-- jsonui-doc-producer: jsonui-doc:spec -->
