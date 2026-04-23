# 27. コンテンツプラン: Reference — JSON スキーマリファレンス

> Scope: 3〜4 時間 / 1 セッション。spec / layout / strings / cells / component-spec 5 種類の JSON 構造を網羅的に記述。
> 依存: plan 17（spec-templates）を参照。

---

## 1. 対象記事

| URL | spec | Layout |
|---|---|---|
| `/reference/json-schema` | `docs/screens/json/reference/json-schema.spec.json` | `docs/screens/layouts/reference/json-schema.json` |

---

## 2. コンテンツ構造

読者が JsonUI の全ファイル形式を理解するリファレンスとして、以下の順に記述する:

### 2.1 導入

- en: "JsonUI uses five JSON file types. Each has a well-defined schema, and `jui verify` enforces them."
- ja: "JsonUI は 5 種類の JSON ファイルを使う。それぞれ明確なスキーマを持ち、`jui verify` が検証する。"

| File type | 拡張子 | 典型的場所 | 役割 |
|---|---|---|---|
| Screen spec | `*.spec.json` | `docs/screens/json/**/*` | 画面の目的・データフロー・ViewModel を記述 |
| Component spec | `*.component.json` | `docs/screens/json/components/` | 再利用可能なカスタムコンポーネントを記述 |
| Layout | `*.json` | `docs/screens/layouts/**/*` | spec から自動生成される UI 構造 |
| Strings | `strings.json` / `strings/{lang}.json` | `docs/strings/` | 多言語文字列リソース |
| Cell layout | `cells/*.json` | `docs/screens/cells/` | Collection 内に繰り返し描画する行 |

### 2.2 Screen Spec（`*.spec.json`）

#### Top-level structure

```json
{
  "type": "screen_spec",
  "version": "1.0",
  "metadata": { ... },
  "structure": { ... },
  "stateManagement": { ... },
  "dataFlow": { ... },
  "userActions": [ ... ],
  "transitions": [ ... ],
  "strings": [ ... ]
}
```

#### `metadata`
```json
{
  "name": "LearnHelloWorld",
  "displayName": "Hello, JsonUI",
  "description": "...",
  "platforms": ["web", "ios", "android"],
  "layoutFile": "learn/hello-world"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | PascalCase string | Yes | ViewModel class name (e.g., `LearnHelloWorldViewModel`) |
| `displayName` | string | Yes | Human-readable title, used as page `<title>` |
| `description` | string | Yes | Short summary for list views |
| `platforms` | array | Yes | Platforms this screen supports |
| `layoutFile` | string | Yes | Path under `layouts/` (no extension) |

#### `structure`
```json
{
  "components": [
    { "name": "Header", "required": true },
    { "name": "Footer", "required": true }
  ],
  "layout": {
    "sections": ["hero", "content", "related"],
    "hero": { "type": "fullWidth" }
  }
}
```

Purpose: 画面を構成するセクションの宣言的なメタ情報。実際のレイアウトは Layout JSON 側。

#### `stateManagement`
```json
{
  "uiVariables": [
    { "name": "username", "type": "String", "initial": "" },
    { "name": "isLoading", "type": "Bool", "initial": "false" }
  ],
  "eventHandlers": [
    { "name": "onAppear" },
    { "name": "onSubmit", "params": [{ "name": "value", "type": "String" }] }
  ],
  "displayLogic": [ ... ],
  "computed": [ ... ]
}
```

各フィールドの詳細仕様（`uiVariables` の `type` 受け付け値、`eventHandlers` の `params`）を表で示す。

#### `dataFlow`
```json
{
  "viewModel": { "name": "LearnHelloWorldViewModel", "properties": [...] },
  "repositories": [ { "name": "...", "methods": [...] } ],
  "useCases": [ ... ],
  "apiEndpoints": [ ... ],
  "customTypes": [ ... ]
}
```

Purpose: ViewModel 以下のデータ層。

#### `userActions` / `transitions`
画面遷移定義。`transitions` は platform-agnostic で、実装は jsonui-navigation-* エージェントが担う。

#### `strings`
この画面で必要な strings キーのリスト（プリフィックス明示）。

### 2.3 Component Spec（`*.component.json`）

```json
{
  "type": "component_spec",
  "version": "1.0",
  "metadata": {
    "name": "CodeBlock",
    "displayName": "Code Block",
    "description": "Syntax-highlighted code snippet with copy button",
    "category": "display"
  },
  "props": [
    { "name": "language", "type": "String", "required": true },
    { "name": "code", "type": "String", "required": true },
    { "name": "showCopyButton", "type": "Bool", "initial": "true" }
  ],
  "events": [
    { "name": "onCopy", "params": [{ "name": "text", "type": "String" }] }
  ],
  "slots": [ ... ],
  "variants": [ ... ]
}
```

#### 各フィールドの詳細を表で:

| Field | Type | Required | Description |
|---|---|---|---|
| `props` | array | Yes | Input properties |
| `events` | array | No | Callback events |
| `slots` | array | No | Named content slots (for wrapper components) |
| `variants` | array | No | Named style variants |

### 2.4 Layout JSON（`*.json`）

```json
{
  "type": "View",
  "id": "learn_hello_world_root",
  "orientation": "vertical",
  "width": "matchParent",
  "child": [
    { "data": [ ... ViewModel inject decls ... ] },
    { "type": "Label", "text": "@string/hello_world_title", "fontSize": 32 },
    { "type": "Button", "text": "@string/action", "onClick": "@{onAction}" }
  ]
}
```

#### ルートキー

| Key | Required | Description |
|---|---|---|
| `type` | Yes | Component type (Label, View, Button, etc.) |
| `id` | Recommended | Unique identifier, used for tests and ViewModel access |
| `data` | Sometimes | Declares ViewModel binding sources (see below) |
| `child` | When container | Nested components |
| `include` | Alternative to `child` | Reference to another Layout file |

#### `data` ブロックの記述

```json
{
  "data": [
    { "name": "breadcrumbItems", "class": "CollectionDataSource" },
    { "name": "userName", "class": "String", "defaultValue": "" },
    { "name": "onSubmit", "class": "() -> Void" }
  ]
}
```

ViewModel がこの Layout に対して注入すべきプロパティを宣言。`class` は型名:
- `String` / `Int` / `Double` / `Bool` — プリミティブ
- `CollectionDataSource` — Collection 用
- `() -> Void` / `(Type) -> Void` — クロージャ／イベント
- カスタム型（PascalCase）

#### `@generated` マーカー

生成された Layout JSON の冒頭には必ず:

```json
{
  "__@generated": "jui generate project; do not edit by hand",
  "__spec": "docs/screens/json/learn/hello-world.spec.json",
  ...
}
```

不変条件 #3 により、`__@generated` を持つファイルの手編集は禁止。

### 2.5 Strings JSON

```json
{
  "en": {
    "hello_world_title": "Hello, JsonUI",
    "action_save": "Save",
    "form_error_required": "This field is required"
  },
  "ja": {
    "hello_world_title": "こんにちは、JsonUI",
    "action_save": "保存",
    "form_error_required": "この項目は必須です"
  }
}
```

#### キー命名規則

| Prefix | 用途 | 例 |
|---|---|---|
| `<screen-name>_*` | 画面固有の文字列 | `learn_hello_world_title` |
| `<component-name>_*` | コンポーネント固有 | `code_block_copy_tooltip` |
| `action_*` | ボタン・CTA 文言（共通） | `action_save`, `action_cancel` |
| `form_error_*` | フォームエラー | `form_error_required` |
| `common_*` | 汎用（日付フォーマット、曜日等） | `common_month_jan` |

#### 補間（プレースホルダ）

```json
{
  "en": { "welcome_message": "Welcome, {name}!" }
}
```

ViewModel 側で `{name}` を置換した文字列を生成する。プラットフォーム別実装:
- iOS: `StringManager.get("welcome_message", name: "Alice")`
- Android: `R.string.welcome_message` + `String.format()`
- Web: `useTr("welcome_message", { name: "Alice" })`

#### 複数形

```json
{
  "en": {
    "items_count": {
      "one": "1 item",
      "other": "{count} items"
    }
  }
}
```

ICU MessageFormat に準拠。`jsonui-localize` が検証。

### 2.6 Cell JSON（`cells/*.json`）

```json
{
  "type": "View",
  "orientation": "horizontal",
  "paddings": [12, 16, 12, 16],
  "child": [
    { "type": "NetworkImage", "url": "@{item.avatarUrl}", "width": 40, "height": 40 },
    { "type": "Label", "text": "@{item.name}", "weight": 1 },
    { "type": "Label", "text": "@{item.timestamp}", "fontColor": "#9CA3AF" }
  ]
}
```

#### `@{item.*}` スコープ

Cell 内では `@{item.<field>}` が Collection で渡された 1 要素を指す。`item` 以外のバインディング（`@{isLoading}`）は親 ViewModel を参照する。

#### Cell 命名規則

| Path | 用途 |
|---|---|
| `cells/<domain>_<row|card>.json` | ドメイン固有（例: `user_row`, `product_card`） |
| `cells/common/<name>.json` | 汎用（例: `cells/common/empty_state`） |
| `<screen>/cells/<name>.json` | 画面スコープ（例: `learn/installation/cells/install_target_card`） |

### 2.7 JSON Schema 本体

各ファイル型に対応する JSON Schema 定義（draft-07）を公開する。

```
docs/schemas/
├── screen-spec.schema.json
├── component-spec.schema.json
├── layout.schema.json
├── strings.schema.json
└── cell.schema.json
```

各スキーマへのリンクを記事に貼り、ユーザーが IDE 補完（VSCode の JSON schema 関連付け）で活用できるようにする。

**VSCode settings.json 例**:

```json
{
  "json.schemas": [
    {
      "fileMatch": ["**/docs/screens/json/**/*.spec.json"],
      "url": "./docs/schemas/screen-spec.schema.json"
    },
    {
      "fileMatch": ["**/docs/screens/layouts/**/*.json"],
      "url": "./docs/schemas/layout.schema.json"
    }
  ]
}
```

---

## 3. 必要な strings キー

`json_schema_*` prefix:

- `json_schema_intro_title`, `json_schema_intro_body`
- `json_schema_filetype_table_header_*`
- 各ファイル型: `json_schema_section_{spec,component,layout,strings,cell}_{title,body}`
- フィールド表: `json_schema_field_desc_*`（フィールド名別）
- VSCode integration: `json_schema_vscode_title`, `json_schema_vscode_body`

概算 100 キー × 2 言語。

---

## 4. クロスリンク追加先

- `/learn/first-screen`: 「spec と Layout の関係」節 → `/reference/json-schema`
- `/guides/writing-your-first-spec`: 冒頭に「JSON 構造の完全仕様は `/reference/json-schema`」
- `/concepts/why-spec-first`: 末尾「参考」に追加
- 各 `/reference/attributes/*` の関連節にも誘導

---

## 5. 実装チェックリスト

- [ ] `docs/schemas/` の 5 種類 JSON Schema ファイル作成
- [ ] VSCode `settings.json` への schema 関連付けサンプルを本文に含める
- [ ] spec の 5 種類ファイル全てについてサンプル JSON を本文に掲載
- [ ] 各ファイル型のフィールド表を整備（日英）
- [ ] キー命名規則の表
- [ ] クロスリンク追加（4 箇所）
- [ ] `jui build` / `jui verify` / `jsonui-localize`

---

## 6. セッション分割の推奨境界

1 セッションで完結可能（記述密度が高いが量は中程度）。分割する場合:
- **分割 A**: Screen Spec + Component Spec（2 時間）
- **分割 B**: Layout + Strings + Cell + Schema ファイル（2 時間）
