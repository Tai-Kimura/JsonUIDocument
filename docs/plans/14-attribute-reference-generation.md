# 14. 属性リファレンスの生成戦略（spec 自動生成ハイブリッド）

> **本計画書の変更点:** 自動生成の出力先は「Layout JSON」ではなく「**spec ファイル**」。
> 一度 spec を生成すれば、あとは `jui g project` が Layout JSON + ViewModel を出す jui の
> 標準ワークフローに乗る。詳細: `02-tech-stack.md` / `02b-jui-workflow.md`。

## 1. 方針

- **ベース**: `jsonui-cli/shared/core/attribute_definitions.json`（3917 行、28 コンポーネント、共通 131 属性、各属性の `type` / `description` / `required` / `aliases` / `binding_direction`）と `jsonui-cli/shared/core/component_metadata.json`（各コンポーネントの description / aliases / platforms / platformSpecific notes / rules）から**ビルド時に自動生成**。旧 `jsonui-mcp-server/specs/` は削除済み
- **補足**: 手書きオーバーライドファイルで「例」「プラットフォーム差分」「よくある誤用」「関連属性」などを追記
- **出力**: spec ファイル（`docs/screens/json/reference/components/*.spec.json` 等）と補足データ（`docs/data/attribute-reference/*.json`）
- **表示**: 生成された spec に対し `jui g project` が Layout JSON + ViewModel を作り、Layout JSON の `Collection + cellClasses` で属性表を描画

## 2. データフロー

```
┌──────────────────────────────────────────────────────┐
│ Input                                                │
│ ─────                                                │
│ 1. attribute_definitions.json                        │
│    (jsonui-cli/shared/core/)                         │
│    - 28 コンポーネント + common 131 属性             │
│    - 各 binding 属性に binding_direction             │
│                                                      │
│ 2. component_metadata.json                           │
│    (jsonui-cli/shared/core/)                         │
│    - description / aliases / platforms               │
│    - platformSpecific / rules                        │
│                                                      │
│ 3. docs/data/attribute-overrides/*.json              │
│    (本サイト・手書き補足)                            │
└──────────┬───────────────────────────────────────────┘
           │
           ▼  jsonui-doc-web/scripts/build-attribute-reference.ts
           │
┌──────────▼───────────────────────────────────────────┐
│ Output A: spec ファイル                              │
│ ────────                                             │
│ docs/screens/json/reference/components/label.spec.json    │
│ docs/screens/json/reference/components/button.spec.json   │
│ ... (28 個)                                          │
│ docs/screens/json/reference/attributes/layout.spec.json   │
│ docs/screens/json/reference/attributes/text.spec.json     │
│ ...                                                  │
│                                                      │
│ Output B: 付随データ                                 │
│ ─────────                                            │
│ docs/data/attribute-reference/                       │
│ └── components/label.json  ← マージ済みの属性データ  │
│                                                      │
│ Output C: 検索インデックスへの追加（04 で利用）      │
└──────────────────────────────────────────────────────┘

                    ↓ jui g project
                    ↓ (spec → Layout + ViewModel)

┌──────────────────────────────────────────────────────┐
│ docs/screens/layouts/reference/components/label.json │
│ jsonui-doc-web/src/viewmodels/RefComponentLabelVM.ts │
│ (ios/android も同様)                                 │
└──────────────────────────────────────────────────────┘
```

## 3. `attribute_definitions.json` の構造（既知）

ルート:
- `common` — 共通属性（131 項目）
- `Label`, `TextField`, `TextView`, `EditText`, `Input`, `Button`, `Image`, `NetworkImage`, `SelectBox`, `Switch`, `Toggle`, `Segment`, `Slider`, `Progress`, `View`, `CircleView`, `ScrollView`, `Collection`, `Radio`, `CheckBox`, `Check`, `Indicator`, `GradientView`, `Blur`, `IconLabel`, `Web`, `SafeAreaView`, `TabView` — 28 コンポーネント

各属性:
```json
{
  "type": ["number", { "enum": [...] }, "binding"],
  "required": true|false,
  "description": "...",
  "aliases": ["..."],
  "binding_direction": "two-way"
}
```

- `type` に `"binding"` が含まれる属性のみ `binding_direction` を持ちうる
- `binding_direction` が `"two-way"` のときだけ明示的に付く。省略時は read-only 扱い
- 旧設計では `component_metadata` 側の `twoWayBindings` リストで管理していたが、Phase C 以降は attribute 側に同居

## 4. 手書きオーバーライドファイル形式

`docs/data/attribute-overrides/label.json`:

```json
{
  "component": "Label",
  "description": {
    "en": "Text display component that renders a single or multi-line text string.",
    "ja": "テキスト表示コンポーネント。単一行または複数行のテキストを描画します。"
  },
  "usage": {
    "en": "Use Label for any static or dynamic text display. For user input, use TextField instead.",
    "ja": "静的または動的なテキスト表示に使います。ユーザー入力には TextField を使ってください。"
  },
  "examples": [
    {
      "title": { "en": "Minimum example", "ja": "最小例" },
      "language": "json",
      "code": "{\n  \"type\": \"Label\",\n  \"text\": \"Hello, JsonUI\",\n  \"fontSize\": 16,\n  \"fontColor\": \"#111827\"\n}"
    },
    {
      "title": { "en": "With binding", "ja": "Binding を使う" },
      "language": "json",
      "code": "{\n  \"type\": \"Label\",\n  \"text\": \"@{greeting}\",\n  \"fontSize\": 18\n}",
      "note": {
        "en": "`greeting` must be declared in the ViewModel.",
        "ja": "`greeting` は ViewModel で宣言が必要です。"
      }
    }
  ],
  "attributes": {
    "fontColor": {
      "note": {
        "en": "Accepts hex (#RRGGBB), named colors, or @color/token.",
        "ja": "16 進（#RRGGBB）、色名、または @color/token を受け付けます。"
      }
    },
    "lineHeight": {
      "platformDiff": {
        "swift_uikit":   "UIKit では NSAttributedString で設定",
        "swift_swiftui": "SwiftUI では .lineSpacing(...) modifier を適用",
        "kotlin_compose": "Compose では LineHeightStyle を使用",
        "kotlin_xml":    "TextView の lineSpacingExtra にマップ",
        "react":         "Tailwind の leading-* クラスへマップ"
      }
    }
  },
  "relatedComponents": ["TextView", "Button", "IconLabel"]
}
```

## 5. 生成スクリプト

`jsonui-doc-web/scripts/build-attribute-reference.ts`:

```ts
import fs from "fs/promises";
import path from "path";

const CLI_ROOT      = path.resolve("../../jsonui-cli");
const OVERRIDE_DIR  = path.resolve("../docs/data/attribute-overrides");
const SPEC_OUT_DIR  = path.resolve("../docs/screens/json/reference/components");
const DATA_OUT_DIR  = path.resolve("../docs/data/attribute-reference/components");

async function main() {
  const attrDefs = JSON.parse(await fs.readFile(
    path.join(CLI_ROOT, "shared/core/attribute_definitions.json"),
    "utf8"
  ));
  const metadata = JSON.parse(await fs.readFile(
    path.join(CLI_ROOT, "shared/core/component_metadata.json"),
    "utf8"
  ));

  const componentNames = Object.keys(attrDefs).filter(
    k => k !== "common" && !k.startsWith("_")
  );

  for (const compName of componentNames) {
    const meta = metadata[compName];  // description / aliases / platforms / platformSpecific / rules
    const override = await loadOptional(
      path.join(OVERRIDE_DIR, `${compName.toLowerCase()}.json`)
    );

    const merged = mergeComponent({
      name: compName,
      defAttrs: attrDefs[compName],
      commonAttrs: attrDefs.common,
      metadata: meta,
      overrides: override,
    });

    // A. マージ済み属性データ（Repository が読む）
    await write(
      path.join(DATA_OUT_DIR, `${slug(compName)}.json`),
      JSON.stringify(merged, null, 2)
    );

    // B. spec ファイル（jui g project の入力）
    await write(
      path.join(SPEC_OUT_DIR, `${slug(compName)}.spec.json`),
      JSON.stringify(generateSpec(merged), null, 2)
    );
  }
}

function generateSpec(merged) {
  return {
    type: "screen_spec",
    version: "1.0",
    metadata: {
      name: `RefComponent${pascal(merged.name)}`,
      displayName: `${merged.name} コンポーネントリファレンス`,
      description: merged.description?.en ?? "",
      platforms: ["web", "ios", "android"],
      layoutFile: `reference/components/${slug(merged.name)}`,
    },
    structure: { components: [], layout: {} },
    stateManagement: {
      uiVariables: [
        { name: "currentLanguage",    type: "String",          initial: "en" },
        { name: "attributes",         type: "[AttributeRow]",  initial: "[]" },
        { name: "examples",           type: "[CodeExample]",   initial: "[]" },
        { name: "relatedComponents",  type: "[String]",        initial: "[]" },
        { name: "loading",            type: "Bool",            initial: "true" },
      ],
      eventHandlers: [
        { name: "onAppear" },
        { name: "onSelectAttribute", params: [{ name: "id", type: "String" }] },
      ],
      displayLogic: [
        {
          condition: "loading",
          effects: [
            { element: "loading_overlay", state: "visible", variableName: "loadingVisibility" },
            { element: "attribute_section", state: "invisible" },
          ],
        },
      ],
    },
    dataFlow: {
      repositories: [
        {
          name: "AttributeReferenceRepository",
          description: "属性リファレンスデータの取得",
          methods: [
            {
              name: "fetchData",
              params: [{ name: "componentName", type: "String" }],
              returnType: "RefComponentData",
              isAsync: true,
            },
          ],
        },
      ],
      customTypes: [
        {
          name: "AttributeRow",
          properties: [
            { name: "id",                type: "String" },
            { name: "name",              type: "String" },
            { name: "type",              type: "String" },
            { name: "required",          type: "Bool" },
            { name: "description",       type: "String" },
            { name: "bindingDirection",  type: "String?" },
            { name: "platformNote",      type: "String?" },
          ],
        },
        {
          name: "CodeExample",
          properties: [
            { name: "id",       type: "String" },
            { name: "title",    type: "String" },
            { name: "language", type: "String" },
            { name: "code",     type: "String" },
            { name: "note",     type: "String?" },
          ],
        },
        {
          name: "RefComponentData",
          properties: [
            { name: "attributes",         type: "[AttributeRow]" },
            { name: "examples",           type: "[CodeExample]" },
            { name: "relatedComponents",  type: "[String]" },
          ],
        },
      ],
    },
  };
}
```

補助関数:
- `mergeComponent`: def / metadata / override を 1 オブジェクトに結合、属性を並び替え
- `slug`: CamelCase → kebab-case
- `pascal`: kebab → PascalCase
- `loadOptional`: ファイル非存在なら null

## 6. spec → Layout JSON（`jui g project`）

生成された spec に対して:

```bash
jui g project --file docs/screens/json/reference/components/label.spec.json
```

これで:

- `docs/screens/layouts/reference/components/label.json`（骨格のみ、`layoutFile` 指定済なので空近い）
- `jsonui-doc-web/src/viewmodels/RefComponentLabelViewModel.ts`
- `jsonui-doc-ios/.../RefComponentLabelViewModel.swift`（iOS 有効時）
- `jsonui-doc-android/.../RefComponentLabelViewModel.kt`（Android 有効時）

## 7. Layout JSON の手動調整

`scripts/build-attribute-reference.ts` は **spec のみ生成**する。Layout JSON 本体は **Phase 2 で作成する統一テンプレ**をコピーして各コンポーネントに使う（属性データは Repository 経由で動的に流し込むため、28 ページで Layout はほぼ同じ形）。

共通 Layout テンプレ `docs/screens/layouts/reference/components/_template.json`（実際には各 slug で同じ構造）:

```jsonc
{
  "type": "SafeAreaView",
  "child": [
    { "include": "common/header" },
    {
      "type": "View",
      "orientation": "horizontal",
      "child": [
        { "include": "common/sidebar_reference", "platforms": ["web"] },
        {
          "type": "ScrollView",
          "widthWeight": 1,
          "paddings": [24, 24, 24, 24],
          "child": [
            { "include": "common/breadcrumb" },
            { "type": "Label", "text": "@{componentName}", "style": "heading_1" },
            { "type": "Label", "text": "@{componentDescription}", "style": "prose_paragraph" },
            {
              "type": "View", "id": "platform_matrix", "style": "doc_card",
              "child": [
                {
                  "type": "Collection",
                  "items": "@{platformSupport}",
                  "orientation": "horizontal",
                  "cellClasses": ["cells/platform_badge"]
                }
              ]
            },
            { "type": "Label", "text": "@string/ref_examples", "style": "heading_2" },
            {
              "type": "Collection",
              "items": "@{examples}",
              "cellClasses": ["cells/code_example"]
            },
            { "type": "Label", "text": "@string/ref_attributes", "style": "heading_2" },
            {
              "type": "Collection", "id": "attribute_section",
              "items": "@{attributes}",
              "cellClasses": ["cells/attribute_row"]
            },
            { "type": "Label", "text": "@string/ref_related", "style": "heading_2" },
            {
              "type": "Collection",
              "items": "@{relatedComponents}",
              "orientation": "horizontal",
              "cellClasses": ["cells/component_pill"]
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

生成スクリプトは最終的にこの Layout テンプレを 28 個の slug でコピーするだけ（Phase 5b の作業）。

## 8. Repository 実装

`AttributeReferenceRepository` は `docs/data/attribute-reference/components/{slug}.json` を fetch するだけ:

```ts
// jsonui-doc-web/src/repositories/AttributeReferenceRepository.ts
export class AttributeReferenceRepository {
  async fetchData(componentName: string): Promise<RefComponentData> {
    const res = await fetch(`/data/attribute-reference/${slug(componentName)}.json`);
    return res.json();
  }
}
```

`docs/data/attribute-reference/` は Web の `public/data/attribute-reference/` にコピーするか、Next.js の `import` 解決で `@/data/...` にしてビルド時解決。

iOS / Android も同じ JSON ファイルを bundle に含めて Repository が読む（`03-i18n.md` 5.4 節と同じ仕組み）。

## 9. 表示要素の詳細

各コンポーネントページは以下を含む:

### 9.1 プラットフォーム対応マトリクス
MCP spec の `platforms` から機械的に生成し、ViewModel が `platformSupport: [PlatformSupport(name, supported)]`（5 件）を公開。Layout は `Collection + cells/platform_badge` で描画する。カスタム `PlatformBadge` 型は作らない（`02-tech-stack.md §6.0`）。

### 9.2 説明
自動生成の description + override の `description` / `usage`。

### 9.3 属性テーブル
`Collection` + `cells/attribute_row.json`。

属性の並び順:
1. `required: true`
2. 頻出順（text, fontSize, fontColor など UI 系）
3. レイアウト系（width, height, padding）
4. 状態系（enabled, visible）
5. イベント系（onClick）
6. その他

並び順は `docs/data/attribute-order.json` に手動定義し、生成スクリプトで参照。

### 9.4 プラットフォーム差分（override）
`cells/attribute_row.json` 内で `platformNote` を表示。

### 9.5 関連コンポーネント（override）
`Collection`（horizontal pills）。

### 9.6 コード例（override）
`Collection` + `cells/code_example.json`（内部で `CodeBlock` Converter）。

## 10. 共通属性ページ `/reference/attributes/{category}`

`common` 131 属性はカテゴリ別に分割:

- `/reference/attributes/layout` — width, height, padding, margin, weight, ...
- `/reference/attributes/spacing` — margins, paddings, spacing, ...
- `/reference/attributes/text` — fontSize, fontColor, fontWeight, ...
- `/reference/attributes/state` — visible, enabled, hidden, ...
- `/reference/attributes/binding` — binding 関連
- `/reference/attributes/event` — onClick, onLongClick, ...
- `/reference/attributes/responsive` — responsive 設定
- `/reference/attributes/common`（その他）

カテゴリ割り当ては `docs/data/attribute-categories.json` に手動定義。

生成スクリプトは各カテゴリ 1 spec を出す:

```
docs/screens/json/reference/attributes/layout.spec.json
docs/screens/json/reference/attributes/spacing.spec.json
...
```

## 11. 更新フロー

1. `jsonui-cli/shared/core/attribute_definitions.json` が更新される（上流リポジトリ）
2. 本サイトの CI で `npm run prebuild` → `build-attribute-reference.ts` 実行 → spec 再生成
3. `jui g project` で Layout + ViewModel 再生成
4. `jui build` で各プラットフォームに配布
5. `docs/data/attribute-overrides/` を必要に応じて更新（本サイトの PR）

## 12. 整合性チェック

ビルド時に以下を検証:

- override の属性名がマージ後に存在するか（タイポ検出）
- override の言語キー（`en` / `ja`）が両方揃っているか
- 属性並び順に列挙されたものがマージ後に存在するか
- `docs/screens/json/reference/components/*.spec.json` のすべてに対応する `docs/data/attribute-reference/components/*.json` が存在するか

不整合があれば**ビルド失敗**。

## 13. 実装チェックリスト

- [ ] `jsonui-doc-web/scripts/build-attribute-reference.ts` 実装
- [ ] `docs/data/attribute-overrides/*.json` を段階的に整備（Label, Button, TextField, View, ScrollView, Collection から）
- [ ] `docs/data/attribute-order.json`（属性並び順）
- [ ] `docs/data/attribute-categories.json`（共通属性カテゴリ）
- [ ] `docs/data/attribute-reference/` は `.gitignore` 推奨（CI 生成）
- [ ] 共通 Layout テンプレ `docs/screens/layouts/reference/components/` パターンの Layout を 28 個用意
- [ ] `cells/attribute_row.json` / `cells/code_example.json` / `cells/component_pill.json` の Layout
- [ ] `AttributeReferenceRepository` の Web / iOS / Android 実装
- [ ] `jsonui-doc-web/package.json` の `prebuild` に統合
- [ ] 検証ロジック（override タイポなど）
