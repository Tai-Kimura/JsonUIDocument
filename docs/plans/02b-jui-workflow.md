# 02b. jui ワークフロー完全サンプル（1 ページ分の spec → Layout → build）

本ドキュメントは `02-tech-stack.md` の補足。
**Label コンポーネントのリファレンスページ**を題材に、spec → Layout → `jui build` の流れを完全コードで示す。

> この例を 1 つ熟読すれば、残りのページは同じパターンを繰り返せばよい。

---

## 1. ゴール

URL: `/reference/components/label`

作るもの:
- 画面タイトル、プラットフォーム対応マトリクス、最小コード例、属性テーブル、関連コンポーネント
- Web では検索モーダル（`⌘K`）と右カラム TOC を表示
- iOS / Android では同じ Layout をモバイル UI として表示（TOC と検索モーダルは非表示）

---

## 2. spec ファイル

```jsonc
// docs/screens/json/reference/components/label.spec.json
{
  "type": "screen_spec",
  "version": "1.0",
  "metadata": {
    "name": "RefComponentLabel",
    "displayName": "Label コンポーネントリファレンス",
    "description": "Label コンポーネントの属性・プラットフォーム対応・例を示すリファレンスページ",
    "platforms": ["web", "ios", "android"],
    "layoutFile": "reference/components/label"
  },
  "structure": {
    "components": [],
    "layout": {}
  },
  "stateManagement": {
    "uiVariables": [
      { "name": "currentLanguage",  "type": "String",  "initial": "en" },
      { "name": "attributes",       "type": "[AttributeRow]", "initial": "[]" },
      { "name": "relatedComponents", "type": "[String]", "initial": "[]" },
      { "name": "loading",          "type": "Bool",    "initial": "true" }
    ],
    "eventHandlers": [
      { "name": "onAppear", "description": "表示時に属性データを読み込む" },
      { "name": "onSelectAttribute", "params": [{ "name": "attributeId", "type": "String" }] }
    ],
    "displayLogic": [
      {
        "condition": "loading",
        "effects": [
          { "element": "loading_overlay",   "state": "visible",   "variableName": "loadingVisibility" },
          { "element": "attribute_section", "state": "invisible" }
        ]
      }
    ]
  },
  "dataFlow": {
    "repositories": [
      {
        "name": "AttributeReferenceRepository",
        "description": "属性リファレンスのデータアクセス",
        "methods": [
          {
            "name": "fetchAttributes",
            "params": [{ "name": "componentName", "type": "String" }],
            "returnType": "[AttributeRow]",
            "isAsync": true
          },
          {
            "name": "fetchRelated",
            "params": [{ "name": "componentName", "type": "String" }],
            "returnType": "[String]",
            "isAsync": true
          }
        ]
      }
    ],
    "customTypes": [
      {
        "name": "AttributeRow",
        "properties": [
          { "name": "id",          "type": "String" },
          { "name": "name",        "type": "String" },
          { "name": "type",        "type": "String" },
          { "name": "required",    "type": "Bool" },
          { "name": "description", "type": "String" },
          { "name": "bindingDirection", "type": "String?" }
        ]
      }
    ]
  }
}
```

**要点:**
- `metadata.layoutFile` で UI 構造は別ファイル化 → spec の `structure` は空
- `dataFlow.repositories.AttributeReferenceRepository` が属性データの取得を担当
- `customTypes` で `AttributeRow` を定義（`jui g project` 時に Swift/Kotlin/TypeScript それぞれの型に変換）
- `platforms: ["web", "ios", "android"]` で全プラットフォーム対象

---

## 3. Layout JSON（正本）

```jsonc
// docs/screens/layouts/reference/components/label.json
{
  "type": "SafeAreaView",
  "id": "root",
  "child": [
    { "include": "common/header" },
    {
      "type": "View",
      "orientation": "horizontal",
      "widthWeight": 1,
      "child": [
        {
          "include": "common/sidebar_reference",
          "platforms": ["web"]
        },
        {
          "type": "ScrollView",
          "id": "main_scroll",
          "widthWeight": 1,
          "paddings": [24, 24, 24, 24],
          "child": [
            { "include": "common/breadcrumb" },
            {
              "type": "Label",
              "text": "@string/ref_label_title",
              "style": "heading_1"
            },
            {
              "type": "Label",
              "text": "@string/ref_label_summary",
              "style": "prose_paragraph"
            },
            {
              "type": "View",
              "id": "platform_matrix",
              "style": "doc_card",
              "child": [
                { "type": "Label", "text": "@string/ref_platform_support", "style": "heading_3" },
                {
                  "type": "View",
                  "orientation": "horizontal",
                  "child": [
                    { "type": "PlatformBadge", "platform": "uikit",   "supported": true },
                    { "type": "PlatformBadge", "platform": "swiftui", "supported": true },
                    { "type": "PlatformBadge", "platform": "compose", "supported": true },
                    { "type": "PlatformBadge", "platform": "xml",     "supported": true },
                    { "type": "PlatformBadge", "platform": "web",     "supported": true }
                  ]
                }
              ]
            },
            { "type": "Label", "text": "@string/ref_min_example", "style": "heading_2" },
            {
              "type": "CodeBlock",
              "language": "json",
              "code": "{\n  \"type\": \"Label\",\n  \"text\": \"Hello JsonUI\",\n  \"fontSize\": 16\n}",
              "showLineNumbers": true
            },
            { "type": "Label", "text": "@string/ref_attributes", "style": "heading_2" },
            {
              "type": "View",
              "id": "attribute_section",
              "child": [
                {
                  "type": "Collection",
                  "id": "attributes_collection",
                  "items": "@{attributes}",
                  "cellIdProperty": "id",
                  "cellClasses": ["cells/attribute_row"],
                  "sections": [{ "cell": "cells/attribute_row" }]
                }
              ]
            },
            { "type": "Label", "text": "@string/ref_related", "style": "heading_2" },
            {
              "type": "Collection",
              "id": "related_collection",
              "items": "@{relatedComponents}",
              "orientation": "horizontal",
              "cellClasses": ["cells/component_pill"]
            }
          ]
        },
        {
          "include": "common/toc",
          "platforms": ["web"]
        }
      ]
    },
    { "include": "common/footer" },
    {
      "type": "View",
      "id": "loading_overlay",
      "style": "loading_overlay",
      "child": [{ "type": "Indicator" }]
    }
  ],
  "data": [
    { "name": "attributes",         "class": "[AttributeRow]" },
    { "name": "relatedComponents",  "class": "[String]" },
    { "name": "loadingVisibility",  "class": "Visibility" }
  ]
}
```

**要点:**
- `include "common/header"` / `"common/footer"` で全ページ共通の部品を挿入
- `include "common/sidebar_reference"` に `platforms: ["web"]` → iOS/Android には配布されない
- `include "common/toc"` も `platforms: ["web"]` で Web 限定
- `Collection` で属性一覧を表示。`cellClasses` と `sections` で `docs/screens/layouts/cells/attribute_row.json` を参照
- `style: "heading_1"` 等は `docs/screens/styles/heading_1.json` を参照（`jui build` 配布時に各プラットフォームの Styles に展開）
- `CodeBlock` / `PlatformBadge` は独自コンポーネント（`.jsonui-doc-rules.json` に登録済）

---

## 4. 共通部品（include）

### 4.1 ヘッダー

```jsonc
// docs/screens/layouts/common/header.json
{
  "type": "View",
  "id": "site_header",
  "orientation": "horizontal",
  "height": 56,
  "style": "site_header",
  "child": [
    {
      "type": "NavLink",
      "href": "/",
      "child": [{ "type": "Image", "src": "logo", "width": 32, "height": 32 }],
      "platforms": ["web"]
    },
    { "type": "Label", "text": "JsonUI", "style": "brand_title" },
    { "type": "View", "widthWeight": 1 },
    {
      "type": "SearchTrigger",
      "target": "global_search",
      "platforms": ["web"]
    },
    {
      "type": "Label",
      "text": "@{currentLanguage}",
      "onClick": "onToggleLanguage"
    }
  ]
}
```

### 4.2 サイドバー（Web 専用）

```jsonc
// docs/screens/layouts/common/sidebar_reference.json
{
  "platforms": ["web"],
  "type": "ScrollView",
  "width": 260,
  "child": [
    { "type": "Label", "text": "@string/ref_containers", "style": "sidebar_group" },
    { "type": "NavLink", "href": "/reference/components/view",       "text": "View" },
    { "type": "NavLink", "href": "/reference/components/safe-area-view", "text": "SafeAreaView" },
    { "type": "NavLink", "href": "/reference/components/scroll-view", "text": "ScrollView" },

    { "type": "Label", "text": "@string/ref_text", "style": "sidebar_group" },
    { "type": "NavLink", "href": "/reference/components/label",       "text": "Label",       "activeClass": "is-active" },
    { "type": "NavLink", "href": "/reference/components/text-view",   "text": "TextView" }
  ]
}
```

`platforms: ["web"]` により、このファイル自体が `jui build` 時に iOS/Android にコピーされない。

### 4.3 Collection セル

```jsonc
// docs/screens/layouts/cells/attribute_row.json
{
  "type": "View",
  "id": "attribute_row",
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

---

## 5. Style ファイル

```jsonc
// docs/screens/styles/heading_1.json
{
  "fontSize": 32,
  "fontWeight": "bold",
  "fontColor": "#111827",
  "topMargin": 24,
  "bottomMargin": 12,
  "platform": {
    "ios":     { "fontSize": 28 },
    "android": { "fontSize": 28 },
    "web":     { "fontSize": 36 }
  }
}
```

`platform` オーバーライドで iOS/Android/Web の見出しサイズを調整。`jui build` 配布時にプラットフォームごとに解決され、ランタイム不要。

```jsonc
// docs/screens/styles/doc_card.json
{
  "backgroundColor": "#FFFFFF",
  "cornerRadius": 8,
  "paddings": [16, 16, 16, 16],
  "borderColor": "#E5E7EB",
  "borderWidth": 1
}
```

---

## 6. Strings（多言語）

```jsonc
// docs/screens/layouts/Resources/strings.json
{
  "ref_label_title":    { "en": "Label",                      "ja": "Label" },
  "ref_label_summary":  { "en": "Displays a single or multi-line text string.",
                          "ja": "単一行または複数行のテキストを表示するコンポーネント。" },
  "ref_platform_support": { "en": "Platform support",         "ja": "プラットフォーム対応" },
  "ref_min_example":    { "en": "Minimum example",            "ja": "最小例" },
  "ref_attributes":     { "en": "Attributes",                 "ja": "属性" },
  "ref_related":        { "en": "Related components",         "ja": "関連コンポーネント" },
  "ref_containers":     { "en": "Containers",                 "ja": "コンテナ" },
  "ref_text":           { "en": "Text",                       "ja": "テキスト" }
}
```

`jui build` 配布時に、Web は `jsonui-doc-web/src/Strings/{en,ja}.json` に、iOS は `JsonUIDoc/Resources/strings.json` に、Android は `app/src/main/res/values/strings.xml` に変換して配置される（`jui_tools` の strings converter）。

---

## 7. ViewModel（自動生成）

`jui g project --file reference/components/label.spec.json` を実行すると、以下が生成される（**宣言のみ、実装は空スタブ**）:

### 7.1 Web (TypeScript)

```ts
// jsonui-doc-web/src/viewmodels/RefComponentLabelViewModel.ts
export class RefComponentLabelViewModel {
  // UI state
  currentLanguage: string = "en";
  attributes: AttributeRow[] = [];
  relatedComponents: string[] = [];
  loading: boolean = true;

  // Repositories
  attributeReferenceRepository: AttributeReferenceRepository;

  constructor(repo: AttributeReferenceRepository) {
    this.attributeReferenceRepository = repo;
  }

  async onAppear(): Promise<void> {
    // TODO: 手実装
  }

  async onSelectAttribute(attributeId: string): Promise<void> {
    // TODO: 手実装
  }
}
```

### 7.2 iOS (Swift)

```swift
// jsonui-doc-ios/JsonUIDoc/ViewModels/RefComponentLabelViewModel.swift
@MainActor
class RefComponentLabelViewModel: ObservableObject {
    @Published var currentLanguage: String = "en"
    @Published var attributes: [AttributeRow] = []
    @Published var relatedComponents: [String] = []
    @Published var loading: Bool = true

    let attributeReferenceRepository: AttributeReferenceRepository

    init(repo: AttributeReferenceRepository) {
        self.attributeReferenceRepository = repo
    }

    func onAppear() async { /* TODO */ }
    func onSelectAttribute(attributeId: String) async { /* TODO */ }
}
```

### 7.3 Android (Kotlin)

```kotlin
// jsonui-doc-android/app/.../RefComponentLabelViewModel.kt
class RefComponentLabelViewModel(
    private val attributeReferenceRepository: AttributeReferenceRepository,
) : ViewModel() {
    var currentLanguage by mutableStateOf("en")
    var attributes by mutableStateOf<List<AttributeRow>>(emptyList())
    var relatedComponents by mutableStateOf<List<String>>(emptyList())
    var loading by mutableStateOf(true)

    fun onAppear() { /* TODO */ }
    fun onSelectAttribute(attributeId: String) { /* TODO */ }
}
```

型変換は `.jsonui-type-map.json` に従う:

```json
{
  "types": {
    "[$T]": {
      "class": "[$T]",
      "android": { "class": "List<$T>" },
      "web":     { "class": "$T[]" }
    },
    "AttributeRow": {
      "class": "AttributeRow",
      "android": { "class": "AttributeRow" },
      "web":     { "class": "AttributeRow" }
    }
  }
}
```

---

## 8. `jui build` の配布結果

```bash
$ jui build
[jui build] distributing layouts...
  → jsonui-doc-web/src/Layouts/reference/components/label.json
  → jsonui-doc-ios/JsonUIDoc/Layouts/reference/components/label.json
  → jsonui-doc-android/app/src/main/assets/Layouts/reference/components/label.json

[jui build] distributing include:common/sidebar_reference (platforms=[web])
  ✓ jsonui-doc-web/src/Layouts/common/sidebar_reference.json
  ✗ iOS   (skipped: platforms filter)
  ✗ Android (skipped: platforms filter)

[jui build] resolving platform overrides in styles...
  → jsonui-doc-web/src/Styles/heading_1.json   (fontSize: 36)
  → jsonui-doc-ios/JsonUIDoc/Styles/heading_1.json    (fontSize: 28)
  → jsonui-doc-android/app/.../heading_1.json         (fontSize: 28)

[jui build] converting SVG images...
  → jsonui-doc-web/public/images/logo.svg
  → jsonui-doc-ios/JsonUIDoc/Assets.xcassets/logo.imageset/{logo.pdf, Contents.json}
  → jsonui-doc-android/app/src/main/res/drawable/logo.xml

[jui build] running platform builds...
  $ rjui build           (jsonui-doc-web/)
  $ sjui build           (jsonui-doc-ios/)   [optional]
  $ kjui build           (jsonui-doc-android/) [optional]
```

**結果の確認:**
- Web: `next dev` で `http://localhost:3000/reference/components/label` を開くと表示
- iOS: Xcode で `jsonui-doc-ios` を開き、シミュレータで該当画面を確認
- Android: Android Studio で `jsonui-doc-android` を開き、エミュレータで確認

---

## 9. Web 側 App Router のページルート

```tsx
// jsonui-doc-web/src/app/reference/components/[slug]/page.tsx
import dynamic from "next/dynamic";

export function generateStaticParams() {
  return [
    { slug: "label" },
    { slug: "button" },
    // ... 28 components
  ];
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const Component = dynamic(
    () => import(`@/generated/components/reference/components/${slug}`)
  );
  return <Component />;
}
```

`@/generated/components/reference/components/label.tsx` は `rjui build` が生成した TSX。

---

## 10. 開発フロー（実運用）

```bash
# ターミナル 1: Layout 編集を watch
cd JsonUIDocument
jui build --watch

# ターミナル 2: Web 開発サーバー
cd jsonui-doc-web
npm run dev
```

Layout JSON を編集すると `jui build --watch` が各プラットフォームに配布 → `rjui watch` が TSX を再生成 → Next.js Fast Refresh で画面更新、という流れで**数秒で反映**される。

---

## 11. チェックリスト（このサンプルで学んだこと）

- [ ] spec は `layoutFile` で UI を別ファイル化できる
- [ ] Layout JSON では `include` で共通部品、`Collection + cellClasses` でリスト、`style` で見た目を分離
- [ ] `platforms: ["web"]` でファイル単位、`platform: {...}` で属性単位の差異を表現
- [ ] Style ファイルは `docs/screens/styles/` に置くと `jui build` で配布
- [ ] Strings は全プラットフォーム共通の `docs/screens/layouts/Resources/strings.json` に書く
- [ ] Repository は `dataFlow.repositories` に定義、ViewModel は `jui g project` が生成
- [ ] `jui build` が配布・プラットフォーム変換を全部やる
