# 02. 技術スタック（jui ワークフローによるクロスプラットフォームドキュメントサイト）

> **本計画書のアーキテクチャ根幹：**
> ドキュメントサイトは「ReactJsonUI (rjui) 単独で Next.js ドキュメントサイトを自作する」のではなく、
> **`jui` を orchestrator とした cross-platform JsonUI プロジェクト**として構築する。
> spec（`docs/screens/json/*.spec.json`）を Single Source of Truth として、
> `jui generate project` で Layout JSON + ViewModel を生成し、`jui build` で
> **Web 向けに配布（必須）、iOS/Android 向けにも配布可能（ショーケース）**する。

## 1. 基本スタンス

本サイトは「JsonUI ドキュメントサイトであると同時に、JsonUI 最大級のドッグフーディング実例」になる。

- **Web は必須**: `jsonui-doc-web`（Next.js + ReactJsonUI + Tailwind）
- **iOS / Android は野心的ショーケース**: `jsonui-doc-ios`（SwiftJsonUI）、`jsonui-doc-android`（KotlinJsonUI）
  - 全ページの完全同等表示は目指さない
  - 「同じ spec / layout JSON が 3 プラットフォームで動く」という事実を示すための
    **サブセット配布**（Overview / Reference 数ページなど）を Phase 5 以降で検討
- **Layout JSON は 1 度だけ書き、3 プラットフォームに自動配布**される事実こそがドッグフーディング価値
- ドキュメントサイト特有の UI（検索モーダル、Redoc 埋め込みなど）はファイル単位 `platforms: ["web"]` で Web に絞る

## 2. スタック一覧

| レイヤ | 採用 | 備考 |
|-------|------|------|
| orchestrator | **`jui` (jui_tools)** | spec → Layout JSON + ViewModel 生成、`jui build` で全プラットフォームに配布 |
| spec | `*.spec.json` | `jsonui-doc` 仕様準拠。`screen_spec` / `screen_parent_spec` |
| Layout JSON 正本 | `docs/screens/layouts/*.json` | 共有ディレクトリ（`layouts_directory`） |
| Web 実装 | Next.js 16 + ReactJsonUI（`rjui`） | `jsonui-doc-web/` |
| iOS 実装（任意） | SwiftJsonUI（`sjui`、SwiftUI モード推奨） | `jsonui-doc-ios/` |
| Android 実装（任意） | KotlinJsonUI（`kjui`、Compose モード推奨） | `jsonui-doc-android/` |
| Web スタイル | Tailwind CSS 4（`use_tailwind: true`） | rjui 前提 |
| 言語 | TypeScript（rjui）/ Swift / Kotlin | 各プラットフォームのネイティブ |
| i18n | `layouts_directory/Resources/strings.json`（jui 正本）＋各プラットフォーム StringManager | 詳細は `03-i18n.md` |
| コードハイライト | **Shiki**（Web ビルド時 SSG） | Swift/Kotlin 側は将来対応 |
| 検索 | FlexSearch（Web 専用、`platforms: ["web"]`） | 詳細は `04-attribute-search.md` |
| OpenAPI 表示 | Redoc（Web 専用） | 詳細は `09-content-plan-mcp-server.md` |
| 本文記述 | **spec + Layout JSON（MDX 不採用）** | ドキュメント本文も JSON で書く＝ドッグフーディング |
| アイコン/画像 | SVG → `docs/screens/images/` | `jui build` が各プラットフォームに変換配布 |
| デプロイ | Vercel（Web）/ TestFlight（iOS）/ Play Console（Android） | iOS/Android はショーケース配布 |

## 3. `jui.config.json`（プロジェクト設定）

```json
{
  "project_name": "jsonui-documentation",
  "spec_directory": "docs/screens/json",
  "layouts_directory": "docs/screens/layouts",
  "styles_directory": "docs/screens/styles",
  "images_directory": "docs/screens/images",
  "strings_file": "docs/screens/layouts/Resources/strings.json",
  "platforms": {
    "web": {
      "root": "jsonui-doc-web",
      "layoutsDir": "src/Layouts",
      "imagesDir": "public/images"
    },
    "ios": {
      "root": "jsonui-doc-ios",
      "layoutsDir": "JsonUIDoc/Layouts",
      "xcassetsDir": "JsonUIDoc/Assets.xcassets"
    },
    "android": {
      "root": "jsonui-doc-android",
      "layoutsDir": "app/src/main/assets/Layouts",
      "drawableDir": "app/src/main/res/drawable"
    }
  }
}
```

初期リリースは `web` のみ実体実装。`ios` / `android` はディレクトリを空作成（`jui init` の対象外にしてもよい）→ Phase 5 以降で `sjui init` / `kjui init` を追加する。

## 4. ディレクトリ構成（全体）

```
JsonUIDocument/
├── jui.config.json                # jui 設定
├── .jsonui-type-map.json          # 型マッピング（dataFlow で使用）
├── .jsonui-doc-rules.json         # カスタムコンポーネントの名前ホワイトリスト（CodeBlock 等）。仕様は `docs/screens/json/components/*.component.json`
├── docs/
│   ├── plans/                     # 本計画書（実装物ではない）
│   └── screens/
│       ├── json/                  # spec（Single Source of Truth）
│       │   ├── home.spec.json
│       │   ├── learn/
│       │   │   ├── what-is-jsonui.spec.json
│       │   │   └── hello-world.spec.json
│       │   ├── reference/
│       │   │   ├── components/
│       │   │   │   ├── label.spec.json
│       │   │   │   └── ...(28 components)
│       │   │   └── attributes/
│       │   │       ├── layout.spec.json
│       │   │       └── ...
│       │   ├── platforms/
│       │   ├── tools/
│       │   │   ├── cli/
│       │   │   ├── mcp/
│       │   │   ├── test-runner/
│       │   │   ├── agents/
│       │   │   └── helper/
│       │   ├── concepts/
│       │   └── search.spec.json   # platforms: ["web"] で Web 限定
│       ├── layouts/               # Layout JSON 正本（jui g project の出力）
│       │   ├── home.json
│       │   ├── learn/
│       │   ├── reference/
│       │   ├── common/            # Header/Footer/Sidebar など include 用
│       │   │   ├── header.json
│       │   │   ├── footer.json
│       │   │   └── sidebar_reference.json
│       │   ├── cells/             # Collection 用セル
│       │   │   ├── component_card.json
│       │   │   └── api_endpoint_row.json
│       │   ├── Styles/            # 共有スタイル
│       │   │   ├── doc_card.json
│       │   │   ├── code_block.json
│       │   │   └── prose.json
│       │   └── Resources/
│       │       └── strings.json   # 多言語文字列（全プラットフォーム共通）
│       └── images/                # SVG（jui build で各プラットフォームに変換）
│           ├── logo.svg
│           ├── ic_search.svg
│           └── platform_*.svg
├── jsonui-doc-web/                # Web 実装（必須）
│   ├── rjui.config.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── eslint.config.mjs
│   ├── public/
│   │   ├── openapi/mcp.yaml
│   │   ├── search/index.json
│   │   ├── schemas/
│   │   └── images/                # jui build の出力
│   ├── scripts/
│   │   ├── build-attribute-reference.ts  # spec 自動生成（14）
│   │   ├── build-search-index.ts          # 04
│   │   └── validate-strings.ts            # 03
│   └── src/
│       ├── Layouts/               # jui build で配布される（正本は docs/screens/layouts/）
│       ├── Styles/                # jui build で配布される
│       ├── Strings/               # jui build で strings.json から分配される
│       ├── app/                   # Next.js App Router
│       ├── components/
│       │   └── extensions/        # Web 専用 React 拡張（CodeBlock, SearchModal, OpenApiViewer 等）
│       ├── viewmodels/            # jui g project で生成
│       ├── data/                  # 属性リファレンス等のビルド時データ
│       └── generated/             # rjui build 出力（.gitignore）
├── jsonui-doc-ios/                # iOS ショーケース（任意・Phase 5+）
│   ├── JsonUIDoc.xcodeproj
│   └── JsonUIDoc/
│       ├── Layouts/               # jui build で配布
│       ├── Assets.xcassets/       # jui build で変換配布
│       ├── ViewModels/            # jui g project で生成
│       └── AppDelegate.swift
└── jsonui-doc-android/            # Android ショーケース（任意・Phase 5+）
    ├── app/
    │   └── src/main/
    │       ├── assets/Layouts/    # jui build で配布
    │       ├── res/drawable/      # jui build で変換配布
    │       ├── java/              # ViewModel は jui g project で生成
    │       └── AndroidManifest.xml
    └── build.gradle.kts
```

## 5. 「ドキュメント本文もすべて spec で書く」方針

MDX / Markdown ではなく、**spec + Layout JSON で記述**する。これがドッグフーディングの核心。

### 5.1 ページ単位の spec（簡易版）

```jsonc
// docs/screens/json/learn/what-is-jsonui.spec.json
{
  "type": "screen_spec",
  "version": "1.0",
  "metadata": {
    "name": "LearnWhatIsJsonUI",
    "displayName": "JsonUI とは",
    "description": "JsonUI の概要と設計思想を紹介する入門ページ",
    "platforms": ["web", "ios", "android"],
    "layoutFile": "learn/what-is-jsonui"
  },
  "structure": { "components": [], "layout": {} },
  "stateManagement": {
    "uiVariables": [
      { "name": "currentLanguage", "type": "String", "initial": "en" }
    ]
  },
  "dataFlow": {
    "repositories": [
      {
        "name": "DocContentRepository",
        "methods": [
          {
            "name": "fetchArticle",
            "params": [{ "name": "id", "type": "String" }],
            "returnType": "DocArticle",
            "isAsync": true
          }
        ]
      }
    ]
  }
}
```

### 5.2 Layout JSON は `include` / `cellClasses` / `TabView` を駆使

```jsonc
// docs/screens/layouts/learn/what-is-jsonui.json
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
          "child": [
            { "include": "common/breadcrumb" },
            { "type": "Label", "text": "@string/learn_what_title", "style": "heading_1" },
            { "type": "Label", "text": "@string/learn_what_para1", "style": "prose_paragraph" },
            {
              "type": "CodeBlock",
              "language": "json",
              "code": "{\n  \"type\": \"Label\",\n  \"text\": \"Hello JsonUI\"\n}",
              "platform": {
                "ios": { "showLineNumbers": false }
              }
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

ポイント:

- `include` で `common/header`, `common/sidebar_learn`, `common/footer`, `common/breadcrumb`, `common/toc` を共通化
- サイドバーと TOC は `platforms: ["web"]` で Web 限定（モバイルアプリでは別 UI）
- `style: "heading_1"` は `docs/screens/styles/heading_1.json` を参照
- `CodeBlock` は独自コンポーネント。`docs/screens/json/components/codeblock.component.json` で `props.items[]` / `slots.items[]` を定義した上で `.jsonui-doc-rules.json` に名前登録する（spec-first。`6.1` 参照）

### 5.3 トップレベル TabView でセクション切替

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

TabView はモバイルで自然に下タブ UI、Web では上部タブ UI に converter 側でマップ。

## 6. 独自コンポーネント（doc-web 拡張）

ドキュメントサイト特化コンポーネントは、**`component_spec` で契約を定義** → **`.jsonui-doc-rules.json` に名前登録** → **`jui g converter --from <spec>` で Converter 生成** の順で導入する（spec-first。順序を守らないと props 契約と生成物が食い違い、レンダリングが壊れる）。

**判定基準**: その挙動が Layout の `View + onClick` / `style binding` / `Collection + cells/*` / ViewModel 公開状態だけで表現できるなら、**カスタムは作らない**。ライブラリ依存（Shiki / Redoc / FlexSearch / DOM スキャン等）が本当に必要なときだけカスタム化する。

```json
{
  "rules": {
    "componentTypes": {
      "screen": [
        "CodeBlock",
        "TableOfContents",
        "SearchModal",
        "SearchTrigger",
        "OpenApiViewer",
        "JsonSchemaViewer"
      ]
    }
  }
}
```

| コンポーネント | 対応プラットフォーム | 実装方針 |
|----|----|----|
| `CodeBlock` | web / ios / android | Web: Shiki で SSG、iOS/Android: シンタックスハイライトライブラリまたは単色表示 |
| `TableOfContents` | web 専用 | h1/h2 抽出、スクロール追従 |
| `SearchModal` / `SearchTrigger` | web 専用 | `⌘K` キャプチャ、FlexSearch |
| `OpenApiViewer` | web 専用 | Redoc 埋め込み |
| `JsonSchemaViewer` | web 専用 | jsonui-test-runner のスキーマ表示 |

Web 専用コンポーネントは spec / Layout JSON で `platforms: ["web"]`（ファイル単位ホワイトリスト）を付け、iOS/Android ビルドへは配布されない。

### 6.0 カスタム化しないもの（標準パターンで表現）

| 要素 | 実装パターン |
|----|----|
| ナビゲーションリンク | `View onClick="onNavigate"` +（データ駆動なら）`Collection + cellClasses: ["cells/sidebar_link"]`。アクティブ判定は ViewModel が `currentPath` を公開し、Layout 側の `className`/`style` バインディングで切替 |
| 同ページ内タブ切替 | ViewModel の `activeTab` + `displayLogic` / `visibility` バインディング（タブヘッダは `Collection + cells/tab_header`） |
| リッチテキストラッパ | `View style="prose"`（`docs/screens/styles/prose.json` で Tailwind `prose` クラスを割当） |
| プラットフォーム対応マトリクス | `Collection + cells/platform_badge`。セルは `Label` にスタイル条件バインディング |

### 6.1 Converter の追加手順（spec-first）

1. **`component_spec` を作成**: `mcp__jui-tools__doc_init_component` で `docs/screens/json/components/{name}.component.json` を生成し、`props.items[]`（camelCase name / spec type）と `slots.items[]`（非空 = container）を埋める
2. **validate**: `mcp__jui-tools__doc_validate_component` でエラーを潰す
3. **名前登録**: `.jsonui-doc-rules.json` の `rules.componentTypes.screen` に追加
4. **Converter 生成**: `jui g converter --from docs/screens/json/components/{name}.component.json`（`--all` で全 spec を一括生成）。`props.items[]` が `--attributes` に、`slots.items[]` 非空が `--container` に自動マップされる
5. **手実装**: 生成された Converter 本体（Web は `rjui_tools/lib/react/converters/extensions/*.rb`、iOS/Android も同様）にライブラリ連携コードを書く
6. **配布方針**: 短期は本サイト内の拡張として保持／中期は ReactJsonUI / SwiftJsonUI / KotlinJsonUI 本体へコントリビュート

> **`jui g converter --attributes a,b,c` のような手書き引数は使わない。** spec-driven path が `props.items[]` から自動生成するため、手書き引数はスペックと converter の二重管理になり破綻する（既知の事故経路）。

## 7. spec → Layout → build のコマンドフロー

```bash
# 1. 初期化（最初の 1 回のみ）
cd JsonUIDocument
jui init

# 2. 新規ページの spec テンプレ生成
jui g screen LearnHelloWorld

# 3. spec を編集（UI 構造・データフロー・イベント）
$EDITOR docs/screens/json/learn_hello_world.spec.json

# 4. Layout JSON + ViewModel を生成
jui g project --file learn_hello_world.spec.json

# 5. 必要に応じて Layout JSON を手編集（include/style/platform など細部）
$EDITOR docs/screens/layouts/learn_hello_world.json

# 6. 全プラットフォームに配布 + ビルド
jui build

# 7. Web 開発サーバー起動
cd jsonui-doc-web && npm run dev
```

`jui build` は内部で以下を実行:

1. Layout JSON を各プラットフォームの `layoutsDir` にコピー（`platform` キー解決 + `platforms` ホワイトリスト適用）
2. `docs/screens/styles/*.json` を各プラットフォームの `Styles/` にコピー
3. `docs/screens/images/*.svg` を各プラットフォーム向けに変換（iOS: PDF + Contents.json / Android: Vector Drawable XML / Web: SVG そのまま）
4. 各プラットフォームの build コマンドを呼ぶ（`rjui build` → `next build` / `sjui build` / `kjui build`）

## 8. 不足機能と対応（ReactJsonUI 側）

ドキュメントサイト要件のうち、rjui 標準 Converter で賄えないものは本サイト内 `jsonui-doc-web/src/components/extensions/` に React 実装を置き、`jui g converter` で全プラットフォーム対応の Converter を追加する。

| 要件 | 現状 | 対応方針 |
|------|------|----------------|
| コードブロック + ハイライト | 未対応（Shiki が必要） | 追加 Converter `CodeBlock` |
| TOC 自動生成 | 未対応（DOM スキャンが必要） | 追加 Converter `TableOfContents`（Web 専用） |
| 検索 UI | 未対応（⌘K + FlexSearch が必要） | 追加 Converter `SearchModal` / `SearchTrigger`（Web 専用） |
| OpenAPI | 未対応（Redoc が必要） | 追加 Converter `OpenApiViewer`（Web 専用） |
| JSON Schema 表示 | 未対応（スキーマレンダラが必要） | 追加 Converter `JsonSchemaViewer`（Web 専用） |
| ルーティング連動ナビ（active highlight） | 弱い | **標準 `View + onClick` + ViewModel `currentPath` + `className` バインディング**（§6.0）。カスタム Converter は作らない |
| タブ切替（同ページ内） | `TabView` が画面ルート用途 | **ViewModel `activeTab` + `visibility` バインディング**（§6.0）。タブヘッダは `Collection + cells/tab_header`。カスタム Converter は作らない |
| リッチテキストラッパ | Label 中心 | **`View style="prose"`** でスタイルを割り当てる（`docs/screens/styles/prose.json`）。カスタム Converter は作らない |
| プラットフォーム対応マトリクス | 標準で表現可能 | **`Collection + cells/platform_badge`**。カスタム Converter は作らない |

中期的には上記 Converter を ReactJsonUI / SwiftJsonUI / KotlinJsonUI 本体にコントリビュートする。

## 9. `rjui.config.json`（Web 側）

`jsonui-doc-web/rjui.config.json` は rjui 固有の設定のみ保持。`jui.config.json` の `platforms.web.layoutsDir` 等は `jui build` が配布時に参照する。

```json
{
  "layouts_directory": "src/Layouts",
  "generated_directory": "src/generated",
  "components_directory": "src/generated/components",
  "styles_directory": "src/Styles",
  "strings_directory": "src/Strings",
  "languages": ["en", "ja"],
  "default_language": "en",
  "use_tailwind": true,
  "typescript": true
}
```

`src/Layouts/` と `src/Styles/` は `jui build` が生成するため `.gitignore` に含める（Single Source of Truth は `docs/screens/layouts/`）。

## 10. Web ビルドフロー（最終）

```
┌───────────────────────────────────────────────────────────┐
│ A. docs/screens/json/**/*.spec.json（編集）                │
│       │                                                   │
│       ▼ jui g project                                     │
│ B. docs/screens/layouts/**/*.json（正本、編集可）           │
│       │                                                   │
│       ▼ jui build                                         │
│ C. jsonui-doc-web/src/Layouts/**/*.json（配布物）          │
│    jsonui-doc-ios/JsonUIDoc/Layouts/**/*.json             │
│    jsonui-doc-android/app/src/main/assets/Layouts/...     │
│       │                                                   │
│       ▼ rjui build（Web のみ）                            │
│ D. jsonui-doc-web/src/generated/components/**/*.tsx       │
│       │                                                   │
│       ▼ next build                                        │
│ E. jsonui-doc-web/.next/（Vercel deploy）                  │
└───────────────────────────────────────────────────────────┘

並列:
- scripts/build-attribute-reference.ts  → docs/screens/json/reference/components/*.spec.json
- scripts/build-search-index.ts          → public/search/index.json
```

`scripts/build-attribute-reference.ts` は **spec ファイルを生成**する点に注意（従来の「Layout JSON を直接生成」ではない）。spec を作れば `jui g project` が Layout JSON + ViewModel を出す、という流れに乗る。

詳細は `14-attribute-reference-generation.md` を参照。

## 11. 「ドッグフーディングが成立する証拠」

1. **Single Source of Truth（spec）に基づく生成物が 3 プラットフォームで動く**
   - 同じ spec から ios / android / web すべての Layout JSON + ViewModel が生成される
   - ドキュメントサイトの「Learn」「Reference」の一部が iOS / Android アプリとしても動く事実を提示できる
2. **JsonUI の全機能をサイト実装で使う**
   - `include`（ヘッダー/フッター/サイドバー）
   - `cellClasses` / `sections`（コンポーネントカード一覧、API エンドポイント一覧）
   - `TabView`（トップレベル切替）
   - `layoutFile`（UI と spec の分離）
   - Styles（共通スタイル切り出し）
   - `platforms`（Web 専用 UI の限定配布）
   - `platform` キー（プラットフォーム別フォントサイズ等）
   - `dataFlow` / Repository（検索インデックス、ドキュメントメタデータ）
3. **不足機能が明確化される**
   - `CodeBlock`, `OpenApiViewer`, `TableOfContents`, `SearchModal`/`SearchTrigger`, `JsonSchemaViewer` 等を追加することで、JsonUI 本体にコントリビュートする価値が生まれる

## 12. 未確定事項（実装時に決める）

- iOS / Android 実装の範囲（Overview + Reference 先頭ページ程度か、全ページか）
- iOS / Android 版にも検索を持たせるか（`SearchModal` を各プラットフォーム対応に拡張）
- `jsonui-doc-web` / `-ios` / `-android` を monorepo にするか別リポジトリにするか
- Dark Mode の採否（初期は無効）
- `prebuild` を CI のみに絞るか（ローカルでは重いため）

詳細サンプル（1 ページ分の spec → Layout → build の完全な例）は `02b-jui-workflow.md` を参照。
