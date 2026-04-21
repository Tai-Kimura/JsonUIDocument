# 01. インフォメーションアーキテクチャ（IA）

> **本計画書の IA は「URL」ではなく「spec ファイル」単位で定義する**点が従来の WebIA と異なる。
> 各 URL は `docs/screens/json/**/*.spec.json` の spec 1 つに対応し、`jui g project` で
> Layout JSON と ViewModel が生成される（詳細: `02-tech-stack.md` / `02b-jui-workflow.md`）。

## 1. ゴール

- 初心者（A 層）が「何から始めればいいか」で迷わない構造
- AI エージェント連携（E 層）を前面に出し、差別化ポイントを明示
- 既存フレームワーク経験者（C 層）が「自分のプラットフォーム」にすぐ辿り着ける構造
- コントリビューター（D 層）が内部設計を辿れる構造
- **Web / iOS / Android で同じ spec を使う**ため、IA は URL ではなくプラットフォーム非依存の画面単位で考える

## 2. トップレベル TabView 構成

サイト全体のトップレベル切替は `docs/screens/layouts/home.json` の **TabView** で表現:

```
TabView (home.json)
├── Learn      → view: "learn/index"
├── Guides     → view: "guides/index"
├── Reference  → view: "reference/index"
├── Platforms  → view: "platforms/index"
├── Tools      → view: "tools/index"
└── Concepts   → view: "concepts/index"
```

Web ではヘッダータブ、iOS / Android では下部タブ UI として converter 側でマップ。

## 3. URL（Web）と spec ファイルのマッピング

Web 側の URL は `jsonui-doc-web/src/app/**/page.tsx`（App Router）で定義するが、**各ページは spec を 1 つ読み込むだけ**のシンプルなラッパになる。

以下は URL → spec ファイルの一覧（抜粋、全量は Phase 2 で CSV 化して `docs/plans/url-spec-map.csv` に保存）。

| URL | spec ファイル | メモ |
|-----|-------------|------|
| `/` | `docs/screens/json/home.spec.json` | トップ（Hero + 主要機能 + プラットフォームカード）、TabView がルート |
| `/learn` | `docs/screens/json/learn/index.spec.json` | Learn インデックス |
| `/learn/what-is-jsonui` | `docs/screens/json/learn/what-is-jsonui.spec.json` | |
| `/learn/installation` | `docs/screens/json/learn/installation.spec.json` | |
| `/learn/hello-world` | `docs/screens/json/learn/hello-world.spec.json` | |
| `/learn/first-screen` | `docs/screens/json/learn/first-screen.spec.json` | |
| `/learn/data-binding-basics` | `docs/screens/json/learn/data-binding-basics.spec.json` | |
| `/learn/next-steps` | `docs/screens/json/learn/next-steps.spec.json` | |
| `/guides` | `docs/screens/json/guides/index.spec.json` | |
| `/guides/list-with-collection` | `docs/screens/json/guides/list-with-collection.spec.json` | |
| `/guides/...` | 同様 | |
| `/reference` | `docs/screens/json/reference/index.spec.json` | Reference インデックス（Collection でコンポーネント一覧表示） |
| `/reference/components/{slug}` | `docs/screens/json/reference/components/{slug}.spec.json` | 動的ルート。**28 spec ファイルは `scripts/build-attribute-reference.ts` で自動生成** |
| `/reference/attributes/{category}` | `docs/screens/json/reference/attributes/{category}.spec.json` | カテゴリ別共通属性 |
| `/reference/data-binding` | `docs/screens/json/reference/data-binding.spec.json` | |
| `/reference/modifier-order` | `docs/screens/json/reference/modifier-order.spec.json` | |
| `/reference/platform-mapping` | `docs/screens/json/reference/platform-mapping.spec.json` | |
| `/reference/json-schema` | `docs/screens/json/reference/json-schema.spec.json` | |
| `/platforms` | `docs/screens/json/platforms/index.spec.json` | |
| `/platforms/swift/**` | `docs/screens/json/platforms/swift/*.spec.json` | 18 spec |
| `/platforms/kotlin/**` | `docs/screens/json/platforms/kotlin/*.spec.json` | 18 spec |
| `/platforms/react/**` | `docs/screens/json/platforms/react/*.spec.json` | 19 spec |
| `/tools` | `docs/screens/json/tools/index.spec.json` | |
| `/tools/cli/**` | `docs/screens/json/tools/cli/*.spec.json` | 55 spec |
| `/tools/mcp/**` | `docs/screens/json/tools/mcp/*.spec.json` | 42 spec |
| `/tools/test-runner/**` | `docs/screens/json/tools/test-runner/*.spec.json` | 20 spec |
| `/tools/agents/**` | `docs/screens/json/tools/agents/*.spec.json` | 45 spec |
| `/tools/helper/**` | `docs/screens/json/tools/helper/*.spec.json` | 11 spec |
| `/concepts/**` | `docs/screens/json/concepts/*.spec.json` | 6 spec |
| `/search` | `docs/screens/json/search.spec.json` | **Web 専用**。`metadata.platforms: ["web"]` |
| `/community` | `docs/screens/json/community.spec.json` | |
| `/releases` | `docs/screens/json/releases.spec.json` | |
| `/404` | `docs/screens/json/not-found.spec.json` | |

**合計 約 260 spec** を Phase 1 の冒頭で `jui g screen` により一括生成する。

### 3.1 動的ルートの実装

`/reference/components/[slug]` のような動的ルート:

```tsx
// jsonui-doc-web/src/app/reference/components/[slug]/page.tsx
import dynamic from "next/dynamic";

export function generateStaticParams() {
  // docs/screens/json/reference/components/*.spec.json をスキャンして slug 配列を生成
  return [
    { slug: "label" }, { slug: "button" }, /* ... 28 components */
  ];
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const Component = dynamic(
    () => import(`@/generated/components/reference/components/${slug}`)
  );
  return <Component />;
}
```

`@/generated/components/reference/components/{slug}.tsx` は `rjui build` が生成した TSX。

### 3.2 iOS / Android のルーティング

- iOS: `DynamicView("reference/components/label", viewModel: vm)` のように layout name で直接指定
- Android: `SafeDynamicView(layoutName = "reference/components/label", ...)`
- ディープリンク（Universal Links / App Links）は Phase 5 以降で検討

## 4. サイドバー設計（Web 専用）

サイドバーは Web UI のため、`docs/screens/layouts/common/sidebar_*.json` に **`platforms: ["web"]` 付き**で配置 → `jui build` 時に iOS/Android へ配布されない。

### 4.1 グローバルヘッダー（全プラットフォーム共通）

```
[Logo JsonUI]   [TabView: Learn / Guides / Reference / Platforms / Tools / Concepts]   [🔍 Search]  [🌐 JA/EN]  [GitHub]
```

- Web: 上部タブとして TabView を描画
- iOS / Android: 下部タブとして TabView を描画（converter 側で自動）
- `🔍 Search` は `platforms: ["web"]` で Web 限定
- `🌐 JA/EN` は全プラットフォーム（StringManager の言語切替）
- `GitHub` リンクも全プラットフォーム

### 4.2 セクション別サイドバー（Web 専用）

各トップレベルセクションが独立したサイドバー spec を持つ:

- `docs/screens/layouts/common/sidebar_learn.json`（Learn 配下）
- `docs/screens/layouts/common/sidebar_guides.json`
- `docs/screens/layouts/common/sidebar_reference.json`
- `docs/screens/layouts/common/sidebar_platforms_{swift,kotlin,react}.json`
- `docs/screens/layouts/common/sidebar_tools_{cli,mcp,test_runner,agents,helper}.json`
- `docs/screens/layouts/common/sidebar_concepts.json`

各ページ layout からは `include` で取り込む:

```json
{
  "type": "View",
  "orientation": "horizontal",
  "child": [
    { "include": "common/sidebar_reference", "platforms": ["web"] },
    { "type": "ScrollView", "widthWeight": 1, "child": [ /* 本文 */ ] },
    { "include": "common/toc", "platforms": ["web"] }
  ]
}
```

モバイルでは include が除外されて `ScrollView` だけが残る。

#### サイドバー内の「コンポーネント一覧」は Collection で

```json
{
  "type": "Collection",
  "items": "@{sidebarItems}",
  "cellClasses": ["cells/sidebar_nav_row"],
  "sections": [
    { "header": "cells/sidebar_group_header" },
    { "cell": "cells/sidebar_nav_row" }
  ]
}
```

各セクションの sidebar は ViewModel の `sidebarItems`（配列）をリポジトリから取得するだけなので、Strings を含む静的データでも OK。

### 4.3 右カラム TOC（Web 専用）

`docs/screens/layouts/common/toc.json`:

```json
{
  "platforms": ["web"],
  "type": "TableOfContents",
  "selector": "h2, h3"
}
```

`TableOfContents` は独自 Converter（Web 実装は見出し抽出 + スクロール連動ハイライト）。

### 4.4 パンくず（全プラットフォーム）

`docs/screens/layouts/common/breadcrumb.json`:

```json
{
  "type": "View",
  "orientation": "horizontal",
  "child": [
    { "type": "Collection", "items": "@{breadcrumbItems}", "orientation": "horizontal", "cellClasses": ["cells/breadcrumb_item"] }
  ]
}
```

`breadcrumbItems` は ViewModel が URL からパース（Web）、または spec metadata に手書き（iOS/Android）。

## 5. ページ雛形（spec テンプレート）

1 ページ分の spec 基本テンプレは `17-spec-templates.md` に収録。要素:

| 要素 | 記述先 |
|------|--------|
| 画面の目的・説明 | spec `metadata.description` |
| UI コンポーネント・階層 | Layout JSON（`metadata.layoutFile` で参照） |
| 状態管理（言語、loading など） | spec `stateManagement.uiVariables` |
| イベント | spec `stateManagement.eventHandlers` |
| データ取得 | spec `dataFlow.repositories` |
| Web 専用 UI | Layout JSON 内 `platforms: ["web"]` |
| 多言語文字列 | `docs/screens/layouts/Resources/strings.json` + `@string/...` 参照 |

## 6. コンポーネントリファレンスページ（`/reference/components/{slug}`）

完全サンプルは `02b-jui-workflow.md` を参照。要点:

- spec は **`scripts/build-attribute-reference.ts` が自動生成**（`14-attribute-reference-generation.md`）
- `jui g project` で Layout JSON + ViewModel スタブ生成
- Layout は `common/header` / `common/sidebar_reference` / `common/toc` を include
- 属性一覧は `Collection` + `cellClasses: ["cells/attribute_row"]`
- 関連コンポーネントは `Collection`（横並び pill）
- プラットフォーム対応マトリクスは `Collection + cells/platform_badge`（items は ViewModel が `[PlatformSupport]` として 5 件公開。カスタム `PlatformBadge` 型は作らない。`02-tech-stack.md §6.0`）

## 7. 主要導線

| 導線 | 起点 | 終点 |
|------|------|------|
| 初心者の 5 分ルート | `/` Hero CTA | `/learn/hello-world` |
| AI エージェント押し | `/` 特徴セクション | `/tools/agents/overview` → `/tools/mcp` |
| プラットフォーム別最短 | `/` プラットフォームカード | `/platforms/{swift\|kotlin\|react}/setup` |
| 属性調査 | ヘッダー検索（Web） | `/reference/components/{name}` |

導線は **TabView + include されたサイドバー + `View onClick="onNavigate"`** で構成。サイドバー各項目は `Collection + cells/sidebar_link` の標準パターンで、セル内は `View onClick` + `Label` + アクティブ判定は ViewModel 公開の `currentPath` に対する `className` バインディング（`02-tech-stack.md §6.0`）。

## 8. URL ルール

- すべて小文字、ハイフン区切り
- `/reference/components/text-field`（`textField` ではなく）
- 言語切替は URL では行わない（`StringManager` で切替、URL は同一）
- 404 時は `/404` へ。検索サジェスト付き（Web 専用）

## 9. spec ファイル命名規則

- `docs/screens/json/learn/what-is-jsonui.spec.json`（URL から一意にマップ）
- ディレクトリ階層 = URL 階層
- `index.spec.json` = セクションルート

大規模画面（`/tools/cli/overview` など全 CLI を統括するランディング）には `screen_parent_spec` を使って sub-spec 分割も可能:

```json
{
  "type": "screen_parent_spec",
  "subSpecs": [
    { "file": "tools/cli/overview/header.spec.json",      "name": "Header" },
    { "file": "tools/cli/overview/command-table.spec.json", "name": "CommandTable" },
    { "file": "tools/cli/overview/hello-world.spec.json", "name": "HelloWorld" }
  ]
}
```

## 10. Layout ファイル分離（`layoutFile`）の活用指針

spec の `structure.components` に全 UI を書くと可読性が落ちるため、**原則すべての spec で `metadata.layoutFile` を指定**し、Layout JSON に UI を書く。

```json
{
  "metadata": {
    "name": "LearnWhatIsJsonUI",
    "layoutFile": "learn/what-is-jsonui"
  },
  "structure": { "components": [], "layout": {} }
}
```

例外: 1 ページだけに閉じる独立コンポーネントが少ない「シンプルなフォーム画面」等。ただし本サイトではほぼ全ページで Layout 分離を使う想定。

## 11. ナビゲーションの実装指針

- **ヘッダー / フッター / サイドバー / TOC**: `docs/screens/layouts/common/*.json` の include
- **TabView**: `docs/screens/layouts/home.json` ルート。Learn / Guides / Reference / Platforms / Tools / Concepts
- **アクティブ判定**（Web）: ViewModel が `currentPath`（Next.js `usePathname` の値を購読）を公開し、Layout の `className` / `style` バインディングでアクティブ状態に分岐。カスタム Converter を作らない（`02-tech-stack.md §6.0`）
- **言語切替**: ヘッダー右上のトグル → `StringManager.setLanguage(...)` → 全プラットフォーム

## 12. iOS / Android のナビゲーション差分

iOS / Android は「タブバー + Stack 遷移」が自然。Phase 5 のショーケース実装時、以下を検討:

- TabView の各タブ内で Stack を持たせる
- サイドバーは iOS ではドロワー（haml menu）、Android では Navigation Drawer に相当
- ただし初期ショーケースは **「ReferenceとLearnの一部ページを表示できる」** レベルで十分

## 13. 実装チェックリスト

- [ ] `docs/plans/url-spec-map.csv`（URL → spec ファイル対応表）を Phase 2 で生成
- [ ] `docs/screens/json/**/*.spec.json` を 約 260 個、Phase 2 冒頭で `jui g screen` 一括生成
- [ ] `docs/screens/layouts/common/` に Header / Footer / Breadcrumb / TOC / Sidebar 群の Layout JSON
- [ ] `docs/screens/layouts/home.json` に TabView ルート
- [ ] Web 専用 Layout には `platforms: ["web"]` を付与
- [ ] Reference コンポーネントページは spec を自動生成（`scripts/build-attribute-reference.ts`）
