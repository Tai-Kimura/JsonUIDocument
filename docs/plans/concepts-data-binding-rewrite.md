# `/concepts/data-binding` rewrite plan

Current page: `docs/screens/json/concepts/data-binding.spec.json` + `docs/screens/layouts/concepts/data-binding.json`. Essay with 4 H2s: **Syntax / Typed / One-way / No logic**.

The page was audited on 2026-04-24 against the real implementations in SwiftJsonUI, KotlinJsonUI, ReactJsonUI (via rjui_tools), and the whisky-find-agent consumer project. **All four essay sections** contain material that is either wrong or misleading. This plan enumerates what's wrong, what needs to be added, and the shape of the rewrite.

## TL;DR

| Section | Current claim | Verdict | Action |
|---|---|---|---|
| Syntax | "3 places use bindings: text/style attribute values, `visibility`, event callbacks" | ❌ Wrong — bindings are pervasive across numeric, color, border, opacity, `items`, `src`, `id`, `currentPage`, etc. | **Rewrite** |
| Typed | "`jui verify` catches type mismatches at build time" | ❌ Wrong — `jui verify` only detects layout-vs-spec drift, never validates binding types. Type safety is platform-dependent: Android compile-time (DataBinding AP), iOS + Web runtime-only | **Rewrite** |
| One-way | "Data flows VM → Layout, no two-way binding, layout calls onChange, VM decides" | ❌ **Wrong on all three platforms** — form inputs are effectively two-way: iOS uses SwiftUI `$binding`, Android auto-invokes `viewModel.updateData()` inside a `LaunchedEffect`, Web auto-generates an `onChange` that writes back. The VM property updates **before** any callback runs; the callback is a notification, not a gate | **Rewrite** |
| No logic | "Cannot write `@{count > 0 ? 'some' : 'none'}` or `@{formatName(user)}`" | ✅ Accurate | **Keep, cite validator** |

Seven notable gaps are also uncovered (form-input two-way semantics, CollectionDataSource, auto-`onXxxChange` generation, visibility enum, `defaultValue` semantics, dot-path support, Android template-literal extension). See §4.

## 1. Ground-truth evidence

Each line range is a pointer the rewriter (and reviewer) should open. Format: `<repo-local path>:<lines>`.

### 1.1 Claim: "typed binding to a ViewModel field"

- **iOS runtime binding is reflection-based, returns `Any?`**
  `/Users/like-a-rolling_stone/resource/SwiftJsonUI/Sources/SwiftJsonUI/Classes/UIKit/Binding.swift:71-121` — `fetchValue()` walks key paths and returns `Any?`. Zero compile-time type check on the binding expression itself. The View code casts at use-site.
- **Web converter strips `@{…}` into a JSX member expression**
  `/Users/like-a-rolling_stone/resource/jsonui-cli/rjui_tools/lib/react/converters/base_converter.rb:493-519` — emits `{data.propName}`. TypeScript's own compiler then type-checks the JSX against the generated `FooData` interface. That gives some compile-time safety, but it's TypeScript's checker catching it — not JsonUI-specific tooling.
- **Android DOES get compile-time type safety via Android DataBinding annotation processor**
  `/Users/like-a-rolling_stone/resource/jsonui-cli/kjui_tools/lib/xml/helpers/binding_parser.rb:9-23` — `@{variable}` → `@{data.variable}` in the generated XML; the Android DataBinding annotation processor type-checks at compile time.

**Net**: the essay should replace the generic "typed binding" phrasing with a per-platform reality table. "Typed at compile time" is only literally true on Android.

### 1.2 Claim: "3 places use bindings"

Real attribute-level uses pulled from `whisky-find-agent/.../Layouts/bar_search_sheet.json`:

| Attribute | Example | Line |
|---|---|---|
| `text` | `"text": "@{searchText}"` | 113, 164 |
| `onClick` | `"onClick": "@{onCancelTap}"` | 95, 187 |
| `onTextChange` | `"onTextChange": "@{onSearchTextChange}"` | 116, 167 |
| `onPageChanged` | `"onPageChanged": "@{onSearchPageChanged}"` | 120 |
| `visibility` | `"visibility": "@{emptyVisibility}"` | 125 |
| `items` | `"items": "@{barList}"` | 134 |
| `currentPage` | `"currentPage": "@{searchPage}"` | 119 |
| `opacity` | `"opacity": "@{cardOpacity}"` | 186 |
| `src` | `"src": "@{imageUrl}"` | 210, 306, 397 |
| `hint` | `"hint": "@{hintText}"` | 164 |

Plus the converter explicitly supports bindings on: `background`, `fontColor`, `fontWeight`, `borderWidth`, `borderColor`, `borderStyle`, `alpha`, `id`, and nested style attributes (e.g. `shadow.color`). See `base_converter.rb:136-217` for the switch table.

**Net**: the Syntax section should describe bindings as "any attribute value that isn't a layout primitive like `type` or `orientation`" and give a short taxonomy (text / style / layout / event / collection-control) rather than the wrong 3-way split.

### 1.3 Claim: "`jui verify` catches type mismatches"

- `/Users/like-a-rolling_stone/resource/jsonui-cli/jui_tools/jui_cli/commands/verify_cmd.py:57-231` — the verifier only calls `checker.compare(generated, actual)` on the Layout JSON tree and reports `match / missing / extra / type_mismatch`. The `type_mismatch` counter is about *node type* (e.g., a spec expected `Label`, the layout authored `Button`), not about binding type mismatches.
- `/Users/like-a-rolling_stone/resource/jsonui-cli/rjui_tools/lib/core/binding_validator.rb:11-100` — the binding validator exists but checks for **business logic** (no ternaries, no arithmetic, no function calls); it does NOT type-check the bound property against the attribute's expected type.

**Net**: the Typed section has to be rewritten. Either drop the "`jui verify` catches it" sentence entirely, or replace it with the honest version: "On Android, the DataBinding annotation processor enforces types at compile. On Web, TypeScript checks the generated `<FooData>` prop shape. On iOS, type errors surface at runtime — keep the ViewModel field type in sync with the attribute the binding sits on."

### 1.4 Claim: "one-way, VM → Layout, onChange callback"

**This claim is wrong in the most important way: form inputs are effectively two-way on every platform, and the VM field updates before the author's callback runs.** The layout-JSON author still writes `text: "@{searchText}"` + (optional) `onTextChange: "@{onSearchTextChange}"` — which looks one-way — but the generators emit platform-native two-way machinery underneath. The author's handler, if declared, is a notification hook, not a gate.

Evidence on each platform:

- **iOS — SwiftUI native `$binding` (two-way)**
  `/Users/like-a-rolling_stone/resource/SwiftJsonUI/Sources/SwiftJsonUI/Classes/SwiftUI/Dynamic/Converters/TextFieldConverter.swift:64` creates `let textBinding = DynamicBindingHelper.string(...)`; line 89 passes it as `TextField(placeholder, text: textBinding)`. That's SwiftUI's own write-through binding — keystrokes flush directly into the VM's field, no indirection. The author's `onValueChange` callback (when declared) is attached via `.onChange(of:)` **after** the write has happened. `ToggleConverter.swift:124` only applies `.onChange` if the author supplied a handler, but the binding itself is always two-way regardless.

- **Android — `LaunchedEffect` auto-syncs to VM (two-way)**
  `/Users/like-a-rolling_stone/resource/jsonui-cli/kjui_tools/lib/compose/components/textfield_component.rb:56-62` generates a local `rememberTextFieldState` tied to the VM property via a `LaunchedEffect` that calls `viewModel.updateData(...)` every time the local state changes. Works identically whether the author declared `onTextChange` or not. `checkbox_component.rb:81` emits `onCheckedChange = { newValue -> viewModel.updateData(...) }` by default — the author's handler isn't required for the VM to see the change.

- **Web — auto-generated `onChange` closes over `updateData`-style path (two-way)**
  `/Users/like-a-rolling_stone/resource/jsonui-cli/rjui_tools/lib/react/converters/text_field_converter.rb:289-294` — when the author writes only `text: "@{email}"` without declaring `onTextChange`, the converter still emits `onChange={(e) => data.onEmailChange?.(e.target.value)}`, and `binding_validator.rb:521-541` backs this up by synthesizing the `onEmailChange` pathway. Same pattern for `toggle_converter.rb:84-91`.

Behavior when the author omits the callback:
- iOS: field still updates as the user types (SwiftUI binding is unconditional).
- Android: field still updates (LaunchedEffect fires unconditionally).
- Web: field still updates (auto-generated onChange still writes).

Callback signatures where authors DO declare a handler (still relevant — the author is usually *reacting to* the already-applied update, not *deciding* it):
- **iOS**: `(oldValue: String, newValue: String) -> Void` — whisky-find-agent Layout has `((String, String) -> Void)?`.
- **Web (rjui)**: `(newValue: string) => void` — `text_field_converter.rb:162-167` emits `onChange={(e) => data.onXChange?.(e.target.value)}`.
- **Android (kjui)**: single-arg `(String) -> Unit`.

**Net**: the section has to be rewritten, not extended. It should say: "Form inputs (TextField, EditText, Input, CheckBox, Switch, Toggle, Slider, SelectBox, Segment…) are two-way. The `@{foo}` binding is both the read source and the write destination — the VM field updates on every keystroke/toggle, before any `onFooChange` handler runs. If you need to reject or transform user input, don't treat the callback as a gate: snap the VM field back to the corrected value (it will re-render the bound attribute) or maintain a separate validated projection. This differs from non-form bindings (Label `text`, `visibility`, `src`, etc.), which really are one-way reads because the underlying widget has no user-input path."

### 1.5 Claim: "no logic in bindings"

- `/Users/like-a-rolling_stone/resource/jsonui-cli/rjui_tools/lib/core/binding_validator.rb:18-79` — explicit deny list: ternary, `&&`/`||`, comparison (`===` / `==` / `<` / `>`), arithmetic (`+` / `*` / `%` / …), function calls (`\w+\([^)]+\)`).
- Allowed forms (lines 82-91): simple property (`@{prop}`), dot-path (`@{user.profile.name}`), array index (`@{items[0]}`), action binding (`@{onFoo}`), cell-scoped `@{data.prop}`.

**Net**: keep the claim, strengthen it with the enumerated allow/deny list and a citation to `binding_validator.rb`. Also add a caveat: the validator runs in **rjui only** — iOS and Android currently accept malformed expressions and fail at runtime. File as library bug if this matters to coverage (not in scope for this page).

## 2. Missing topics the page should add

1. **Two-way semantics on form inputs — and the right way to validate/transform user input**. Now that §1.4 is clear that form bindings are two-way, the essay has to tell readers how to reject invalid characters (snap the VM field back), how to trim/format (same pattern: update field in `onXxxChange`), and when NOT to fight the two-way flow (almost always — let it flow, compute a separate `isValid` / `errorMessage` projection). Without this, readers wire `onTextChange` expecting it to be a gate and silently get broken validation.
2. **CollectionDataSource binding**. The page never mentions how `items: "@{barList}"` is different from `text: "@{foo}"`. A `CollectionDataSource` carries sections + cells and is the bridge between `@{items}` on a `Collection` and `cells/*.json` cell files. Cover briefly or link to `/concepts/one-layout-json` if that's covered there.
3. **Auto-generated `onXxxChange`**. If the author writes `text: "@{name}"` on a TextField without declaring `onNameChange`, the converter fabricates it. `rjui_tools/.../binding_validator.rb:521-541` is the evidence. Readers hit this and assume their layout is broken when it isn't — document it.
4. **`visibility` is a String enum (`"visible" / "invisible" / "gone"`), not a Boolean**. Binding validator explicitly warns when a Boolean is bound. `binding_validator.rb:437-456`. Flows naturally in the Syntax rewrite.
5. **`data[]` block's `defaultValue` semantics**. Lots of layout JSONs declare `{ name, class, defaultValue }` (see `bar_search_sheet.json:21,45,...`). The page should state that the default is used until the VM first emits — otherwise bindings render as raw `undefined` during the first paint.
6. **No path-ascent syntax** (`@{^prop}`, `@{../prop}`). Often asked about, absent from the grammar. One-sentence callout under "No logic".
7. **Android template-literal extension** — `kjui_tools/.../binding_parser.rb:60-68` accepts interpolated strings like `"${user.firstName} ${user.lastName}"` inside attribute values. This is Android-only; iOS/Web do not have it. Either promote this to a cross-platform standard (library change, out of scope) or flag it in the essay as "Android has an extra interpolation form — avoid if you care about cross-platform parity".

## 3. Proposed new section structure

Keep the 4-section skeleton but retitle and rewrite:

| # | New heading | Core point |
|---|---|---|
| 1 | **Where bindings live** (was: Syntax) | The 5-group taxonomy (text / style / layout / event / collection), with one line per group naming a real attribute. |
| 2 | **How typing works per platform** (was: Typed) | Android = compile-time via DataBinding AP. Web = TypeScript checks the generated `FooData` interface. iOS = runtime reflection. "`jui verify` catches *structural* drift, not binding types." |
| 3 | **Read-only bindings vs two-way form bindings** (was: One-way) | Non-input attributes (`text` on Label, `visibility`, `src`, colors, sizes, `items`…) are read-only — the view has no way to write back. Input widgets (TextField / Input / CheckBox / Switch / Slider / SelectBox / Segment / Toggle) emit platform-native two-way wiring: SwiftUI `$binding` on iOS, `LaunchedEffect`-driven `viewModel.updateData()` on Android, auto-generated `onChange` on Web. The VM field updates first; the optional `onXxxChange` callback is a notification hook, not a gate. Validation/transform pattern: let the field update, snap it back inside the callback if you need to reject — don't treat the callback as a guard. Include the per-platform callback-signature table so cross-platform VM authors know whether to expose `(old, new)` or `(new)`. |
| 4 | **No expressions** (was: No logic) | Keep. Add the enumerated allow-list + deny-list + a line on `rjui only` enforcement + the `@{^}` / `@{../}` non-feature note. |

Plus a new **one-paragraph intro** before §1 replacing the current lead: "`@{variable}` is how a layout JSON names a field on its ViewModel. What the field holds, how it's typed, and whether the widget can write back into it depends on the platform *and* on the widget — the Layout JSON stays the same."

Close with an unchanged next-reads pair (`/concepts/why-spec-first` + `/concepts/viewmodel-owned-state`).

## 4. Spec / layout / strings diff

Minimum required edits to implement §3:

- **`docs/screens/json/concepts/data-binding.spec.json`** — no structural change. Bump `metadata.updatedAt`, add a `notes[]` entry referencing this plan.
- **`docs/screens/layouts/concepts/data-binding.json`** — replace the 4 body Labels' `text` keys with new ones; optionally add 1–2 CodeBlocks to section 1 (taxonomy snippet) and section 3 (per-platform callback signatures).
- **`docs/screens/layouts/Resources/strings.json`** — rewrite the 4 `section_*_body` entries (en + ja), rename 1–2 of the `toc_row_*` keys to match new headings. New keys needed for the added CodeBlocks if we keep them inline.

Spec & rules whitelists stay untouched; no new custom component types, no new event handlers.

## 5. Out of scope / upstream

These are libraries issues surfaced by the audit — **do not fix in this project**, file reports against `jsonui-cli/docs/bugs/` if they aren't already:

- iOS + Android converters do not run the `binding_validator.rb` deny-list equivalent (currently rjui-only). File as `sjui-binding-validator-missing.md` / `kjui-binding-validator-missing.md`.
- Callback signatures diverge by platform (iOS takes `(old, new)`, Web takes `(new)`). Either library-side normalization or doc-level disclosure — we pick doc for now; upstream normalization is library work.
- `CollectionDataSource` binding isn't documented in the attribute reference either (a separate audit target under `/reference/attributes`).

## 6. Rollout

1. Author the rewritten strings (§3) and update the layout's text bindings + optional CodeBlocks (§4). Per project invariants: `jui build` must stay at zero warnings and `jui verify --fail-on-diff` must stay clean.
2. Run `jsonui-localize` over the edited files.
3. Smoke-test the page in `http://localhost:3000/concepts/data-binding` — confirm the 4 new section bodies render in both EN and JA.
4. Commit the strings.json / layout / spec changes with scoped paths (do NOT touch parallel-session work under `docs/plans/guides-deepening/` or the pending `docs/plans/*.md` deletions).

No agent hand-offs required — this is purely a copy rewrite plus optional CodeBlocks. `jsonui-define` is not needed unless the author decides to add the per-platform callback-signature CodeBlock as a separate component; in that case route the addition through `jsonui-define` + `jsonui-implement` per workflow 1.
