# 17. spec テンプレート集（ページ種別ごとの雛形）

> 本サイトは約 260 ページ。各ページは spec ファイル 1 つに対応する。
> このドキュメントにはページ種別ごとの spec 雛形を掲載。実装時は該当テンプレをコピー → 編集 → `jui g project` を実行する。

## 1. 共通ルール

- spec は `docs/screens/json/` 以下にディレクトリ階層 = URL 階層で配置
- 原則として `metadata.layoutFile` で UI 構造を別ファイル化する
- `metadata.platforms`: デフォルトは `["web", "ios", "android"]`、Web 専用は `["web"]`
- Layout JSON 側では `include` / `Collection + cellClasses` / `platform`（単数） / `platforms`（複数＝ファイル単位）を駆使
- 独自コンポーネント（`CodeBlock` / `TableOfContents` / `SearchModal` / `SearchTrigger` / `OpenApiViewer` / `JsonSchemaViewer`）は **spec-first**：`docs/screens/json/components/{name}.component.json` を先に作成 → `.jsonui-doc-rules.json` に名前登録 → `jui g converter --from <spec>` で生成（`02-tech-stack.md §6.1`）
- ナビゲーション（旧 NavLink）／同ページ内タブ（旧 Tabs/TabPanel）／バッジ（旧 PlatformBadge）／prose ラッパ（旧 Prose）は**標準コンポーネント + ViewModel バインディング + `cells/*`** で表現。カスタム型は作らない（`02-tech-stack.md §6.0`）

## 2. テンプレ一覧

| # | テンプレ | 用途 |
|---|--------|------|
| T1 | 記事型ページ（Learn / Guides / Concepts） | 見出し + 段落 + コード例の本文ページ |
| T2 | 一覧型ページ（Reference index / Tools index） | Collection でカード一覧表示 |
| T3 | リファレンス詳細ページ（コンポーネント / 属性） | 自動生成対象。`14-attribute-reference-generation.md` |
| T4 | CLI コマンドページ | コマンドシグネチャ + パラメータ表 + 例 |
| T5 | MCP ツールページ | ツール仕様 + OpenAPI 部分抜粋 |
| T6 | プラットフォーム別ページ（Swift/Kotlin/React） | セットアップ手順 + コード例 |
| T7 | Web 専用ページ（検索 / OpenAPI ビューア） | `metadata.platforms: ["web"]` |
| T8 | トップ（TabView ルート） | 画面のルートに TabView を置くパターン |

---

## T1. 記事型ページ（Learn / Guides / Concepts）

### spec

```jsonc
// docs/screens/json/learn/hello-world.spec.json
{
  "type": "screen_spec",
  "version": "1.0",
  "metadata": {
    "name": "LearnHelloWorld",
    "displayName": "Hello World",
    "description": "最小コード例で JsonUI の基本を学ぶ",
    "platforms": ["web", "ios", "android"],
    "layoutFile": "learn/hello-world"
  },
  "structure": { "components": [], "layout": {} },
  "stateManagement": {
    "uiVariables": [
      { "name": "currentLanguage", "type": "String",      "initial": "en" },
      { "name": "article",         "type": "DocArticle?", "initial": "null" },
      { "name": "loading",         "type": "Bool",        "initial": "true" }
    ],
    "eventHandlers": [
      { "name": "onAppear" },
      { "name": "onSetLanguage", "params": [{ "name": "lang", "type": "String" }] }
    ],
    "displayLogic": [
      {
        "condition": "loading",
        "effects": [
          { "element": "loading_overlay", "state": "visible", "variableName": "loadingVisibility" }
        ]
      }
    ]
  },
  "dataFlow": {
    "repositories": [
      {
        "name": "DocContentRepository",
        "methods": [
          {
            "name": "fetchArticle",
            "params": [
              { "name": "id",   "type": "String" },
              { "name": "lang", "type": "String" }
            ],
            "returnType": "DocArticle",
            "isAsync": true
          }
        ]
      }
    ],
    "customTypes": [
      {
        "name": "DocSection",
        "properties": [
          { "name": "id",        "type": "String" },
          { "name": "type",      "type": "String" },
          { "name": "level",     "type": "Int?" },
          { "name": "text",      "type": "String?" },
          { "name": "language",  "type": "String?" },
          { "name": "code",      "type": "String?" }
        ]
      },
      {
        "name": "DocArticle",
        "properties": [
          { "name": "id",       "type": "String" },
          { "name": "title",    "type": "String" },
          { "name": "sections", "type": "[DocSection]" }
        ]
      }
    ]
  }
}
```

### Layout（骨格）

```jsonc
// docs/screens/layouts/learn/hello-world.json
{
  "type": "SafeAreaView",
  "child": [
    { "include": "common/header" },
    {
      "type": "View",
      "orientation": "horizontal",
      "child": [
        { "include": "common/sidebar_learn", "platforms": ["web"] },
        {
          "type": "ScrollView",
          "widthWeight": 1,
          "paddings": [24, 24, 24, 24],
          "child": [
            { "include": "common/breadcrumb" },
            { "type": "Label", "text": "@{article.title}", "style": "heading_1" },
            {
              "type": "View",
              "style": "prose",
              "child": [
                {
                  "type": "Collection",
                  "items": "@{article.sections}",
                  "cellIdProperty": "id",
                  "cellClasses": ["cells/prose_section"]
                }
              ]
            }
          ]
        },
        { "include": "common/toc", "platforms": ["web"] }
      ]
    },
    { "include": "common/footer" },
    {
      "type": "View", "id": "loading_overlay", "style": "loading_overlay",
      "child": [{ "type": "Indicator" }]
    }
  ]
}
```

---

## T2. 一覧型ページ（Reference index / Tools index）

### spec

```jsonc
// docs/screens/json/reference/index.spec.json
{
  "type": "screen_spec",
  "metadata": {
    "name": "ReferenceIndex",
    "displayName": "リファレンス",
    "platforms": ["web", "ios", "android"],
    "layoutFile": "reference/index"
  },
  "structure": { "components": [], "layout": {} },
  "stateManagement": {
    "uiVariables": [
      { "name": "componentCards", "type": "[ComponentCard]", "initial": "[]" }
    ],
    "eventHandlers": [{ "name": "onAppear" }]
  },
  "dataFlow": {
    "repositories": [
      {
        "name": "ReferenceIndexRepository",
        "methods": [
          {
            "name": "fetchComponents",
            "params": [],
            "returnType": "[ComponentCard]",
            "isAsync": true
          }
        ]
      }
    ],
    "customTypes": [
      {
        "name": "ComponentCard",
        "properties": [
          { "name": "id",          "type": "String" },
          { "name": "name",        "type": "String" },
          { "name": "description", "type": "String" },
          { "name": "url",         "type": "String" },
          { "name": "category",    "type": "String" }
        ]
      }
    ]
  }
}
```

### Layout

```jsonc
// docs/screens/layouts/reference/index.json
{
  "type": "SafeAreaView",
  "child": [
    { "include": "common/header" },
    {
      "type": "ScrollView",
      "paddings": [24, 24, 24, 24],
      "child": [
        { "type": "Label", "text": "@string/ref_title", "style": "heading_1" },
        {
          "type": "Collection",
          "items": "@{componentCards}",
          "cellIdProperty": "id",
          "cellClasses": ["cells/component_card"],
          "sections": [
            { "header": "cells/reference_group_header" },
            { "cell": "cells/component_card" }
          ]
        }
      ]
    },
    { "include": "common/footer" }
  ]
}
```

---

## T3. リファレンス詳細ページ（コンポーネント）

`14-attribute-reference-generation.md` で自動生成されるため、このテンプレは参照のみ。完全版は `02b-jui-workflow.md` を参照。

---

## T4. CLI コマンドページ

### spec

```jsonc
// docs/screens/json/tools/cli/jui/init.spec.json
{
  "type": "screen_spec",
  "metadata": {
    "name": "CliJuiInit",
    "displayName": "jui init",
    "description": "プロジェクト初期化コマンド",
    "platforms": ["web", "ios", "android"],
    "layoutFile": "tools/cli/jui/init"
  },
  "structure": { "components": [], "layout": {} },
  "stateManagement": {
    "uiVariables": [
      { "name": "parameters", "type": "[CliParameter]", "initial": "[]" },
      { "name": "examples",   "type": "[CodeExample]",  "initial": "[]" }
    ],
    "eventHandlers": [{ "name": "onAppear" }]
  },
  "dataFlow": {
    "repositories": [
      {
        "name": "CliCommandRepository",
        "methods": [
          {
            "name": "fetchCommand",
            "params": [{ "name": "id", "type": "String" }],
            "returnType": "CliCommand",
            "isAsync": true
          }
        ]
      }
    ],
    "customTypes": [
      {
        "name": "CliParameter",
        "properties": [
          { "name": "id",          "type": "String" },
          { "name": "flag",        "type": "String" },
          { "name": "type",        "type": "String" },
          { "name": "required",    "type": "Bool" },
          { "name": "description", "type": "String" }
        ]
      },
      {
        "name": "CodeExample",
        "properties": [
          { "name": "id",        "type": "String" },
          { "name": "title",     "type": "String" },
          { "name": "language",  "type": "String" },
          { "name": "code",      "type": "String" }
        ]
      },
      {
        "name": "CliCommand",
        "properties": [
          { "name": "name",       "type": "String" },
          { "name": "signature",  "type": "String" },
          { "name": "parameters", "type": "[CliParameter]" },
          { "name": "examples",   "type": "[CodeExample]" }
        ]
      }
    ]
  }
}
```

### Layout

```jsonc
// docs/screens/layouts/tools/cli/jui/init.json
{
  "type": "SafeAreaView",
  "child": [
    { "include": "common/header" },
    {
      "type": "View",
      "orientation": "horizontal",
      "child": [
        { "include": "common/sidebar_tools_cli", "platforms": ["web"] },
        {
          "type": "ScrollView",
          "widthWeight": 1,
          "paddings": [24, 24, 24, 24],
          "child": [
            { "include": "common/breadcrumb" },
            { "type": "Label", "text": "jui init", "style": "heading_1" },
            {
              "type": "CodeBlock",
              "language": "bash",
              "code": "jui init"
            },
            { "type": "Label", "text": "@string/tools_cli_parameters", "style": "heading_2" },
            {
              "type": "Collection",
              "items": "@{parameters}",
              "cellClasses": ["cells/cli_parameter_row"]
            },
            { "type": "Label", "text": "@string/tools_cli_examples", "style": "heading_2" },
            {
              "type": "Collection",
              "items": "@{examples}",
              "cellClasses": ["cells/code_example"]
            }
          ]
        },
        { "include": "common/toc", "platforms": ["web"] }
      ]
    },
    { "include": "common/footer" }
  ]
}
```

---

## T5. MCP ツールページ

spec は T4 と類似。Layout に `OpenApiViewer`（Web 専用）を含められるのが特徴:

```jsonc
{
  "type": "OpenApiViewer",
  "specUrl": "/openapi/mcp.yaml",
  "operationId": "lookup_component",
  "platforms": ["web"]
}
```

`platforms: ["web"]` で iOS / Android ではこのコンポーネントが配布されず、モバイルでは別途 `Prose` + 静的テキストで代替する。

---

## T6. プラットフォーム別ページ（同ページ内タブ切替）

`T1` 記事型と同じ。差分:

- `metadata.name`: `PlatformSwiftOverview` など
- `metadata.description`: プラットフォーム特化の説明
- ViewModel に `activeTab: String`（`uikit` / `swiftui` / `compose` / `xml`）を持たせ、`visibility` バインディングで本文を切替
- タブヘッダは `Collection + cells/tab_header`（データ駆動）。カスタム `Tabs`/`TabPanel` Converter は作らない（`02-tech-stack.md §6.0`）

spec 側の抜粋:

```jsonc
{
  "stateManagement": {
    "uiVariables": [
      { "name": "tabs",      "type": "[TabEntry]", "initial": "[]" },
      { "name": "activeTab", "type": "String",    "initial": "uikit" }
    ],
    "eventHandlers": [
      { "name": "onSelectTab", "params": [{ "name": "id", "type": "String" }] }
    ]
  }
}
```

Layout 側の抜粋:

```jsonc
{
  "type": "View",
  "child": [
    {
      "type": "Collection",
      "items": "@{tabs}",
      "orientation": "horizontal",
      "cellClasses": ["cells/tab_header"]
    },
    {
      "type": "View",
      "visibility": "@{activeTab == 'uikit'}",
      "child": [ /* UIKit 解説 */ ]
    },
    {
      "type": "View",
      "visibility": "@{activeTab == 'swiftui'}",
      "child": [ /* SwiftUI 解説 */ ]
    }
  ]
}
```

`cells/tab_header.json`（タブ1つ分のセル）:

```jsonc
{
  "type": "View",
  "onClick": "onSelectTab",
  "child": [
    {
      "type": "Label",
      "text": "@{label}",
      "style": "@{id == activeTab ? 'tab_active' : 'tab'}"
    }
  ]
}
```

（`onSelectTab` は bound された `item.id` を受け取る前提。ViewModel 側で `activeTab` を更新。）

---

## T7. Web 専用ページ

### spec

```jsonc
// docs/screens/json/search.spec.json
{
  "type": "screen_spec",
  "metadata": {
    "name": "Search",
    "displayName": "検索",
    "description": "属性・コンポーネント・ページの統合検索",
    "platforms": ["web"],
    "layoutFile": "search"
  },
  "structure": { "components": [], "layout": {} },
  "stateManagement": {
    "uiVariables": [
      { "name": "query",   "type": "String",         "initial": "" },
      { "name": "results", "type": "[SearchRecord]", "initial": "[]" }
    ],
    "eventHandlers": [
      { "name": "onQueryChange", "params": [{ "name": "value", "type": "String" }] }
    ]
  },
  "dataFlow": {
    "repositories": [
      {
        "name": "SearchRepository",
        "methods": [
          {
            "name": "search",
            "params": [{ "name": "query", "type": "String" }],
            "returnType": "[SearchRecord]",
            "isAsync": true
          }
        ]
      }
    ]
  }
}
```

`metadata.platforms: ["web"]` 指定により、**spec 自体も iOS/Android では処理されない**（`jui g project` が iOS/Android のターゲットでは ViewModel を生成しない）。

### Layout

```jsonc
// docs/screens/layouts/search.json
{
  "platforms": ["web"],
  "type": "SafeAreaView",
  "child": [
    { "include": "common/header" },
    {
      "type": "ScrollView",
      "paddings": [24, 24, 24, 24],
      "child": [
        {
          "type": "TextField",
          "id": "search_input",
          "text": "@{query}",
          "onTextChange": "onQueryChange",
          "placeholder": "@string/search_placeholder"
        },
        {
          "type": "Collection",
          "items": "@{results}",
          "cellClasses": ["cells/search_result_row"]
        }
      ]
    }
  ]
}
```

---

## T8. トップ（TabView ルート）

### spec

```jsonc
// docs/screens/json/home.spec.json
{
  "type": "screen_spec",
  "metadata": {
    "name": "Home",
    "displayName": "JsonUI",
    "platforms": ["web", "ios", "android"],
    "layoutFile": "home"
  },
  "structure": { "components": [], "layout": {} },
  "stateManagement": {
    "uiVariables": [
      { "name": "currentLanguage", "type": "String", "initial": "en" }
    ]
  }
}
```

### Layout

```jsonc
// docs/screens/layouts/home.json
{
  "type": "TabView",
  "tabs": [
    { "title": "@string/nav_learn",      "icon": "book",       "view": "learn/index" },
    { "title": "@string/nav_guides",     "icon": "map",        "view": "guides/index" },
    { "title": "@string/nav_reference",  "icon": "list",       "view": "reference/index" },
    { "title": "@string/nav_platforms",  "icon": "layers",     "view": "platforms/index" },
    { "title": "@string/nav_tools",      "icon": "wrench",     "view": "tools/index" },
    { "title": "@string/nav_concepts",   "icon": "lightbulb",  "view": "concepts/index" }
  ]
}
```

TabView は画面のルートに置き、他のビューの子にはしない（`jui_tools_README.md` §「TabView の view 参照」参照）。各タブの `view` は他の Layout JSON を参照する。

---

## 3. 共通の include テンプレ

### 3.1 `common/breadcrumb.json`

```jsonc
{
  "type": "View",
  "orientation": "horizontal",
  "paddings": [0, 0, 12, 0],
  "child": [
    {
      "type": "Collection",
      "items": "@{breadcrumbItems}",
      "orientation": "horizontal",
      "cellClasses": ["cells/breadcrumb_item"]
    }
  ]
}
```

### 3.2 `common/toc.json`（Web 専用）

```jsonc
{
  "platforms": ["web"],
  "type": "View",
  "width": 240,
  "paddings": [16, 16, 16, 16],
  "child": [
    { "type": "Label", "text": "@string/toc_title", "style": "sidebar_group" },
    { "type": "TableOfContents", "selector": "h2, h3" }
  ]
}
```

### 3.3 `common/footer.json`

```jsonc
{
  "type": "View",
  "orientation": "horizontal",
  "paddings": [24, 24, 24, 24],
  "style": "site_footer",
  "child": [
    { "type": "Label", "text": "@string/footer_copyright" },
    { "type": "View", "widthWeight": 1 },
    {
      "type": "Collection",
      "items": "@{footerLinks}",
      "orientation": "horizontal",
      "cellClasses": ["cells/footer_link"]
    }
  ]
}
```

---

## 4. cells テンプレ

### 4.1 `cells/component_card.json`

```jsonc
{
  "type": "View",
  "style": "doc_card",
  "onClick": "onSelectComponent",
  "child": [
    { "type": "Label", "text": "@{name}",        "style": "heading_3" },
    { "type": "Label", "text": "@{description}", "style": "prose_paragraph" }
  ]
}
```

### 4.2 `cells/attribute_row.json`

```jsonc
{
  "type": "View",
  "orientation": "horizontal",
  "paddings": [12, 16, 12, 16],
  "style": "doc_row",
  "child": [
    { "type": "Label", "text": "@{name}",        "style": "code_inline", "width": 180 },
    { "type": "Label", "text": "@{type}",        "style": "code_inline", "width": 220 },
    { "type": "Label", "text": "@{description}", "style": "prose_paragraph", "widthWeight": 1 }
  ]
}
```

### 4.3 `cells/code_example.json`

```jsonc
{
  "type": "View",
  "child": [
    { "type": "Label", "text": "@{title}", "style": "heading_3" },
    {
      "type": "CodeBlock",
      "language": "@{language}",
      "code": "@{code}"
    },
    { "type": "Label", "text": "@{note}", "style": "prose_caption" }
  ]
}
```

### 4.4 `cells/prose_section.json`（type フィールドで分岐表示）

```jsonc
{
  "type": "View",
  "child": [
    {
      "type": "Label",
      "text": "@{text}",
      "style": "heading_2",
      "visibility": "@{type == 'heading' && level == 2}"
    },
    {
      "type": "Label",
      "text": "@{text}",
      "style": "heading_3",
      "visibility": "@{type == 'heading' && level == 3}"
    },
    {
      "type": "Label",
      "text": "@{text}",
      "style": "prose_paragraph",
      "visibility": "@{type == 'paragraph'}"
    },
    {
      "type": "CodeBlock",
      "language": "@{language}",
      "code": "@{code}",
      "visibility": "@{type == 'code'}"
    }
  ]
}
```

`visibility` は `displayLogic` で展開される仕組み（本サイト独自の表現が必要なら `displayLogic` を spec 側に持つ）。Converter 側の実装で適宜対応。

---

## 5. 新規ページ作成の手順（チェックリスト）

1. [ ] URL を決める（例: `/learn/hello-world`）
2. [ ] spec ファイル名を決める（`docs/screens/json/learn/hello-world.spec.json`）
3. [ ] 該当テンプレをこのドキュメントからコピー
4. [ ] `metadata.name` / `displayName` / `description` / `platforms` を埋める
5. [ ] `stateManagement` / `dataFlow` をカスタマイズ
6. [ ] `jui g project --file docs/screens/json/learn/hello-world.spec.json` 実行
7. [ ] 生成された `docs/screens/layouts/learn/hello-world.json` を編集（include / Collection を活用）
8. [ ] Strings キーを `docs/screens/layouts/Resources/strings.json` に追加（en / ja）
9. [ ] 必要なら `docs/content/{en,ja}/learn/hello-world.json`（本文データ）を追加
10. [ ] `jui build` で配布
11. [ ] `cd jsonui-doc-web && npm run dev` で表示確認
12. [ ] `jsonui-doc-web/src/app/learn/hello-world/page.tsx`（dynamic import ラッパ）を追加

---

## 6. 大規模ページの分割（parent_spec）

単一 spec が肥大化する場合（/tools/cli/overview のようなハブページ等）、`screen_parent_spec` で分割:

```jsonc
// docs/screens/json/tools/cli/overview.spec.json
{
  "type": "screen_parent_spec",
  "subSpecs": [
    { "file": "tools/cli/overview/intro.spec.json",        "name": "Intro" },
    { "file": "tools/cli/overview/command-table.spec.json", "name": "CommandTable" },
    { "file": "tools/cli/overview/hello-world.spec.json",  "name": "HelloWorld" }
  ]
}
```

`jui g project` 実行時に自動マージ。sub-spec は個別にはビルドされない。
