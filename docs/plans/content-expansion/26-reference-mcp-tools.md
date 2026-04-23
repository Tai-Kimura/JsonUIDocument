# 26. コンテンツプラン: Reference — MCP ツールリファレンス（29 ツール）

> Scope: 5〜7 時間 / 2 セッション。29 MCP ツール × 4 グループの完全仕様（引数・戻り値・エラー・使い方）。
> 依存: plan 09 の構造設計。`/Users/like-a-rolling_stone/resource/jsonui-mcp-server` のソースを参照。

---

## 1. 対象記事

| URL | spec | Layout |
|---|---|---|
| `/reference/mcp-tools` | `docs/screens/json/reference/mcp-tools.spec.json` | `docs/screens/layouts/reference/mcp-tools.json` |

注: `/tools/mcp` は概観ページ（plan 38）、本ページは引数レベルの**完全リファレンス**。重複にならないよう、概観ページからは「全 29 ツールの仕様は `/reference/mcp-tools` を参照」と誘導する。

---

## 2. グループ構成と収録ツール

MCP ツールは 4 グループに分かれる（plan 09 準拠）:

### Group A: Spec & Layout（7 ツール）

| Tool | Purpose (en) | Purpose (ja) |
|---|---|---|
| `get_project_config` | Read `jui.config.json` | `jui.config.json` を読む |
| `list_screen_specs` | List all screen spec files | 全 screen spec 一覧 |
| `list_component_specs` | List all component spec files | 全 component spec 一覧 |
| `list_layouts` | List all generated Layout JSON files | 生成済み Layout JSON 一覧 |
| `read_spec_file` | Read a screen/component spec | spec を読む |
| `read_layout_file` | Read a Layout JSON | Layout JSON を読む |
| `get_data_source` | Resolve which file a symbol/rule comes from | どのファイルから来たかを辿る |

### Group B: Build & Verify（6 ツール）

| Tool | Purpose |
|---|---|
| `jui_init` | Initialize a JsonUI project |
| `jui_build` | Run `jui build` |
| `jui_verify` | Run `jui verify --fail-on-diff` |
| `jui_generate_project` | Generate from one or all specs |
| `jui_generate_screen` | Create a new screen skeleton |
| `jui_generate_converter` | Create a component converter |

### Group C: Doc Authoring（7 ツール）

| Tool | Purpose |
|---|---|
| `doc_init_spec` | Create a screen spec skeleton |
| `doc_init_component` | Create a component spec skeleton |
| `doc_generate_spec` | Generate HTML doc from a screen spec |
| `doc_generate_component` | Generate HTML doc from a component spec |
| `doc_generate_html` | Generate final combined HTML |
| `doc_validate_spec` | Validate spec ↔ HTML doc alignment |
| `doc_validate_component` | Validate component spec ↔ HTML doc |
| `doc_rules_init` / `doc_rules_show` | Project-local doc rules management |

### Group D: Lookup & Search（9 ツール）

| Tool | Purpose |
|---|---|
| `lookup_component` | Get full spec for a single component type |
| `lookup_attribute` | Get full spec for a single attribute |
| `search_components` | Fuzzy search across components |
| `get_binding_rules` | Get binding direction rules for every attribute |
| `get_modifier_order` | Get SwiftUI modifier ordering rules |
| `get_platform_mapping` | Get platform mapping for an attribute |
| `jui_migrate_layouts` | One-shot migration |
| `jui_sync_tool` | Pull tool updates |
| `jui_lint_generated` | CI lint (Bash only, not MCP) |

---

## 3. 各ツールの記述テンプレート

各 29 ツールを以下テンプレートで書き下ろす:

```markdown
### <tool_name>

**Group**: A | B | C | D
**Introduced**: v0.1.0 (or later version)

#### Purpose
- en: "One sentence."
- ja: "1 文。"

#### Arguments
| Name | Type | Required | Description |
|---|---|---|---|

#### Returns
JSON shape + field descriptions.

#### Errors
- `ERROR_CODE_1`: When this happens, the cause, and how to fix.

#### Example
```json
// Input
{ "tool": "<tool_name>", "arguments": { ... } }

// Output (success)
{ ... }

// Output (error)
{ "error": { "code": "...", "message": "..." } }
```

#### When to use
- Scenario 1
- Scenario 2

#### See also
- Related tools
```

---

## 4. 具体例（Group A から 3 件）

### 4.1 `get_project_config`

- Group: A
- Purpose(en): "Read the project's `jui.config.json` to determine active platforms, directories, and hooks."
- Purpose(ja): "プロジェクトの `jui.config.json` を読み、有効なプラットフォーム・ディレクトリ・hooks を取得。"
- Arguments: none
- Returns:
  ```json
  {
    "platforms": ["web", "ios", "android"],
    "specDir": "docs/screens/json",
    "layoutDir": "docs/screens/layouts",
    "outputs": {
      "web": { "root": "jsonui-doc-web", "viewModelDir": "src/viewmodels" },
      "ios": { "root": "jsonui-doc-ios", "viewModelDir": "..." },
      "android": { "root": "jsonui-doc-android", "viewModelDir": "..." }
    },
    "hooks": { ... }
  }
  ```
- Errors:
  - `NOT_IN_PROJECT`: "Current directory has no `jui.config.json`. Run `jui init` first."
- Example:
  ```json
  // Input
  { "tool": "get_project_config", "arguments": {} }
  // Output
  { "platforms": ["web", "ios"], ... }
  ```
- When to use: 最初に必ず呼んで、以降のすべての操作のベースにする。
- See also: `list_screen_specs`, `list_layouts`

### 4.2 `list_screen_specs`

- Group: A
- Purpose(en): "List all screen spec files (`*.spec.json`) under `specDir`."
- Purpose(ja): "`specDir` 配下の全 screen spec（`*.spec.json`）をリスト。"
- Arguments:
  | Name | Type | Required | Description |
  |---|---|---|---|
  | `pattern` | string | No | Glob filter (e.g., `learn/*`) |
- Returns:
  ```json
  {
    "specs": [
      { "path": "docs/screens/json/learn/hello-world.spec.json",
        "name": "LearnHelloWorld", "url": "/learn/hello-world" },
      ...
    ]
  }
  ```
- Example:
  ```json
  // Input
  { "tool": "list_screen_specs", "arguments": { "pattern": "learn/*" } }
  // Output
  { "specs": [ { "path": "...", ... } ] }
  ```
- When to use: 画面単位の調査・バッチ処理を始めるとき。
- See also: `list_component_specs`, `read_spec_file`

### 4.3 `read_spec_file`

- Group: A
- Purpose(en): "Read the contents of a spec file (screen or component)."
- Purpose(ja): "spec ファイル（screen または component）の中身を読む。"
- Arguments:
  | Name | Type | Required | Description |
  |---|---|---|---|
  | `path` | string | Yes | Absolute or project-relative path |
- Returns: Full JSON object of the spec.
- Errors:
  - `FILE_NOT_FOUND`: path does not exist.
  - `INVALID_SPEC`: file is not a valid spec (missing `metadata.name` etc.).
- When to use: 画面の詳細を読みたいとき。Layout 側の `layoutFile` 参照を辿るとき。

---

## 5. 具体例（Group B から 2 件）

### 5.1 `jui_build`

- Group: B
- Purpose(en): "Run `jui build` across all platforms, returning warnings and errors."
- Purpose(ja): "全プラットフォームで `jui build` を実行し、警告とエラーを返す。"
- Arguments:
  | Name | Type | Required | Description |
  |---|---|---|---|
  | `platforms` | array | No | Override platform list |
  | `verbose` | boolean | No | Return per-file log |
- Returns:
  ```json
  {
    "status": "success" | "warnings" | "error",
    "warnings": [ { "file": "...", "message": "..." } ],
    "errors": [ ... ],
    "stats": { "layouts": 44, "viewModels": 44, "warnings": 0 }
  }
  ```
- When to use: 作業の最後に必ず 0 warnings で通過させる（JsonUI 不変条件 #1）。

### 5.2 `jui_verify`

- Group: B
- Purpose(en): "Verify generated files have not drifted from specs."
- Purpose(ja): "生成ファイルが spec から乖離していないか検証。"
- Arguments:
  | Name | Type | Required | Description |
  |---|---|---|---|
  | `failOnDiff` | boolean | No | default `true`; fail with error if drift detected |
- Returns:
  ```json
  {
    "status": "clean" | "drift",
    "drifts": [ { "file": "...", "expected": "...", "actual": "..." } ]
  }
  ```
- When to use: 作業の最後に必ず通す（不変条件 #2）。

---

## 6. 具体例（Group D から 2 件）

### 6.1 `lookup_component`

- Group: D
- Purpose(en): "Get the full attribute schema for a single component type."
- Purpose(ja): "単一コンポーネント型の全属性スキーマを取得。"
- Arguments:
  | Name | Type | Required | Description |
  |---|---|---|---|
  | `name` | string | Yes | Component type name (e.g., `Label`, `Button`) |
- Returns:
  ```json
  {
    "name": "Label",
    "description": "...",
    "aliases": [...],
    "platforms": ["ios", "android", "web"],
    "attributes": { "text": { "type": [...], "required": true, ... }, ... },
    "commonAttributes": [...]
  }
  ```
- When to use: 新規画面を実装中、あるコンポーネントの attribute を確認したいとき。

### 6.2 `search_components`

- Group: D
- Purpose(en): "Fuzzy search across all components by name or description."
- Purpose(ja): "名前・説明文に対する曖昧検索。"
- Arguments:
  | Name | Type | Required | Description |
  |---|---|---|---|
  | `query` | string | Yes | Search term |
- Returns: Array of components with match scores.
- When to use: コンポーネント名がうろ覚えのとき、機能で検索したいとき。

---

## 7. 29 ツール分すべてを書き下ろす

§4〜§6 のテンプレートに従って、以下も同じ密度で記述:

**Group A 残り**: `list_component_specs`, `list_layouts`, `read_layout_file`, `get_data_source`
**Group B 残り**: `jui_init`, `jui_generate_project`, `jui_generate_screen`, `jui_generate_converter`
**Group C 全て**: `doc_init_spec`, `doc_init_component`, `doc_generate_spec`, `doc_generate_component`, `doc_generate_html`, `doc_validate_spec`, `doc_validate_component`, `doc_rules_init`, `doc_rules_show`
**Group D 残り**: `lookup_attribute`, `get_binding_rules`, `get_modifier_order`, `get_platform_mapping`, `jui_migrate_layouts`, `jui_sync_tool`, `jui_lint_generated`

各ツールは最低:
- Purpose（2 言語）
- Arguments（表）
- Returns（JSON スキーマ）
- 1 つの Example（Input / Output）
- When to use（最低 2 シナリオ）

---

## 8. エラーコード一覧（横断）

全ツール共通のエラーコードを 1 表にまとめる:

| Code | Meaning | Common cause |
|---|---|---|
| `NOT_IN_PROJECT` | No `jui.config.json` in cwd | `jui init` 未実行 |
| `FILE_NOT_FOUND` | Path does not exist | Typo / File moved |
| `INVALID_SPEC` | Schema validation failed | `type`/`version` 欠落 |
| `DRIFT_DETECTED` | Generated file modified by hand | Hand-edit `@generated` |
| `BUILD_WARNINGS` | Build succeeded with warnings | Unused bindings, missing strings |
| `TOOL_SYNC_FAILED` | `jui sync-tool` 失敗 | Network / git error |
| `PLATFORM_UNSUPPORTED` | Tool not available for current platform | iOS-only tool on web project |

---

## 9. 必要な strings キー

`mcp_ref_*` prefix:

- `mcp_ref_intro_*`
- `mcp_ref_group_{a,b,c,d}_{title,description}`
- 各ツールに `mcp_ref_tool_<name>_{purpose,when_to_use}`
- 各引数に `mcp_ref_tool_<name>_arg_<arg>_desc`
- `mcp_ref_errors_table_header_*`

概算 400 キー × 2 言語（MCP 全仕様を網羅するため、plan 25 より多い）。

---

## 10. データファイル形式

`docs/data/mcp-tools.json`:

```json
{
  "tools": [
    {
      "name": "get_project_config",
      "group": "A",
      "introducedIn": "0.1.0",
      "purpose": { "en": "...", "ja": "..." },
      "arguments": [],
      "returns": { "type": "object", "fields": [ ... ] },
      "errors": [ { "code": "NOT_IN_PROJECT", "description": {...} } ],
      "examples": [ { "input": {...}, "output": {...} } ],
      "whenToUse": [ { "en": "...", "ja": "..." } ],
      "seeAlso": ["list_screen_specs", "list_layouts"]
    }
  ]
}
```

---

## 11. クロスリンク追加先

- `/learn/installation` → 「MCP の 29 ツール」から本ページへ
- `/tools/mcp`（概観ページ、plan 38）→ 「全ツール仕様」
- `/tools/agents` → 「エージェントが呼ぶ MCP ツール」から該当ツールへ（個別アンカー）

---

## 12. 実装チェックリスト

- [ ] 29 ツール分の仕様を `docs/data/mcp-tools.json` に構造化（日英）
- [ ] `docs/screens/json/reference/mcp-tools.spec.json` の metadata 更新
- [ ] strings キー追加（約 400 × 2 言語）
- [ ] Layout 再生成（`jui g project`）
- [ ] クロスリンク追加
- [ ] エラーコード表の整合確認（MCP サーバー実装と照合）
- [ ] `jui build` / `jui verify` / `jsonui-localize`

---

## 13. セッション分割の推奨境界

- **分割 A**: Group A（7 ツール、2 時間）+ エラーコード表整備
- **分割 B**: Group B（6 ツール）+ Group D（9 ツール、3 時間）
- **分割 C**: Group C（9 ツール、2 時間）
