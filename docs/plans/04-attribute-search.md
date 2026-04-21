# 04. 属性検索機能の設計（spec + Layout で構築）

> **本機能は Web 専用**。検索 UI 自体も spec + Layout JSON で記述し、`platforms: ["web"]` で Web のみに配布する。

## 1. 目的

- 28 コンポーネント × 共通 131 属性 + コンポーネント固有属性すべてを対象に**インクリメンタル検索**
- キーワードで「どのコンポーネントの」「どの属性か」を即座に特定
- 初心者（A 層）と乗り換え組（C 層）の最重要リファレンス体験
- ライブプレビュー等は実装しない（ユーザー回答 5）

## 2. 検索対象データ

### 2.1 一次ソース

| ソース | 場所 | 内容 |
|-------|------|------|
| 全コンポーネント属性定義 | `jsonui-cli/shared/core/attribute_definitions.json` | 28 コンポーネント、各属性の `type` / `description` / `required` / `aliases` / `binding_direction`（`"two-way"` のときのみ付与、無ければ read-only）。`common` セクションに共通属性も含む |
| コンポーネント presentation metadata | `jsonui-cli/shared/core/component_metadata.json` | 各コンポーネントの description / aliases / platforms（swift_generated / swift_dynamic / kotlin_generated / kotlin_dynamic / react）/ platformSpecific notes / rules |
| modifier 順序・binding 構文・platform mapping | `jsonui-mcp-server/src/data/derived.ts` | MCP サーバーがコード内に保持する固定コンベンション（`get_modifier_order` / `get_binding_rules` / `get_platform_mapping` ツールの出力と同じ。ビルド時に参照する場合はこのファイルを import するか、MCP を呼んで JSON でダンプする） |
| **本サイトの spec** | `docs/screens/json/**/*.spec.json` | ページ自体も検索対象に（Learn / Guides など） |

> 旧 `jsonui-mcp-server/specs/` は Phase D で削除済み。MCP は `attribute_definitions.json` + `component_metadata.json` を 4 層 fallback（`JSONUI_CLI_PATH` env / `./.jsonui-cli/` / `~/.jsonui-cli/` / bundled snapshot）で runtime 読み込みする。本サイトのビルド時スクリプトも jsonui-cli の 2 ファイルを直接参照すること。

### 2.2 派生インデックス

ビルド時に `jsonui-doc-web/scripts/build-search-index.ts` が生成:

```
jsonui-doc-web/public/search/
├── index.json           # FlexSearch にロードするフラットな配列
├── attribute-map.json   # 属性名 → コンポーネントの逆引き
└── meta.json            # メタ情報
```

レコード形式（TypeScript 型、`.jsonui-type-map.json` にも登録）:

```ts
type SearchRecord = {
  id: string;                 // e.g. "label.fontSize"
  kind: "component" | "attribute" | "page" | "concept";
  name: string;
  component?: string;
  aliases?: string[];
  description_en: string;
  description_ja: string;
  type?: string;
  required?: boolean;
  bindingDirection?: "read-only" | "two-way" | null;  // `attribute_definitions.json` の `binding_direction`（省略時は read-only）
  platforms?: string[];       // ["swift", "kotlin", "react"]
  url: string;
};
```

## 3. 検索 UI の spec（Web 専用）

### 3.1 検索モーダル呼び出しコンポーネント（全画面のヘッダー内）

`docs/screens/layouts/common/header.json` 内に `SearchTrigger`:

```json
{
  "type": "SearchTrigger",
  "target": "global_search",
  "icon": "search",
  "hotkey": "mod+k",
  "platforms": ["web"]
}
```

`platforms: ["web"]` により iOS/Android には配布されない。

### 3.2 検索モーダル本体

`docs/screens/layouts/common/search_modal.json`（Web 専用）:

```json
{
  "platforms": ["web"],
  "type": "SearchModal",
  "id": "global_search",
  "indexSrc": "/search/index.json",
  "placeholder": "@string/search_placeholder",
  "child": [
    {
      "type": "Collection",
      "id": "search_results",
      "items": "@{results}",
      "cellClasses": ["cells/search_result_row"],
      "sections": [
        { "header": "cells/search_group_header" },
        { "cell": "cells/search_result_row" }
      ]
    }
  ]
}
```

`SearchModal` / `SearchTrigger` は独自 Converter（`.jsonui-doc-rules.json` に登録済）。

### 3.3 `/search` フルページ

```jsonc
// docs/screens/json/search.spec.json
{
  "type": "screen_spec",
  "metadata": {
    "name": "Search",
    "displayName": "検索",
    "platforms": ["web"],
    "layoutFile": "search"
  },
  "stateManagement": {
    "uiVariables": [
      { "name": "query",   "type": "String",         "initial": "" },
      { "name": "results", "type": "[SearchRecord]", "initial": "[]" },
      { "name": "filterKinds",     "type": "[String]", "initial": "['attribute','component','page']" },
      { "name": "filterPlatforms", "type": "[String]", "initial": "['swift','kotlin','react']" }
    ],
    "eventHandlers": [
      { "name": "onQueryChange", "params": [{ "name": "value", "type": "String" }] },
      { "name": "onToggleKindFilter",     "params": [{ "name": "kind",     "type": "String" }] },
      { "name": "onToggleplatformFilter", "params": [{ "name": "platform", "type": "String" }] }
    ]
  },
  "dataFlow": {
    "repositories": [
      {
        "name": "SearchRepository",
        "methods": [
          {
            "name": "search",
            "params": [
              { "name": "query",  "type": "String" },
              { "name": "kinds",  "type": "[String]" },
              { "name": "platforms","type": "[String]" }
            ],
            "returnType": "[SearchRecord]",
            "isAsync": true
          }
        ]
      }
    ]
  }
}
```

Layout JSON（`docs/screens/layouts/search.json`）は検索入力 + フィルタ Tabs + Collection リスト。`02b-jui-workflow.md` のパターンに従う。

## 4. 検索ライブラリ

- **FlexSearch**（`flexsearch` パッケージ）
- `tokenize: "forward"` + 日本語は `tokenize: "full"` 併用
- 形態素解析は初期不要

## 5. 検索ロジック

`jsonui-doc-web/src/components/extensions/SearchModal.tsx`:

```tsx
"use client";
import FlexSearch from "flexsearch";
import { useEffect, useRef, useState } from "react";

export function SearchModal({ indexSrc, placeholder, children }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchRecord[]>([]);
  const indexRef = useRef<FlexSearch.Document<SearchRecord, true> | null>(null);

  useEffect(() => {
    const index = new FlexSearch.Document<SearchRecord, true>({
      document: {
        id: "id",
        index: [
          { field: "name",            tokenize: "forward" },
          { field: "description_en",  tokenize: "forward" },
          { field: "description_ja",  tokenize: "full" },
          { field: "aliases",         tokenize: "forward" },
        ],
        store: true,
      },
    });

    fetch(indexSrc)
      .then(r => r.json())
      .then((records: SearchRecord[]) => {
        records.forEach(r => index.add(r));
        indexRef.current = index;
      });
  }, [indexSrc]);

  useEffect(() => {
    if (!indexRef.current || !query) return setResults([]);
    const raw = indexRef.current.search(query, { limit: 50, enrich: true });
    // 結果を平坦化して state 更新
    setResults(flatten(raw));
  }, [query]);

  return /* JSX ... */;
}
```

rjui の Converter 側（`search_modal_converter.rb`）は spec の `items="@{results}"` / `onQueryChange` を適切に繋ぐだけで、核心のロジックは React 実装に持つ。

## 6. インデックス生成スクリプト

`jsonui-doc-web/scripts/build-search-index.ts`:

```ts
import fs from "fs/promises";
import path from "path";
import fg from "fast-glob";

const CLI_ROOT = "../../jsonui-cli"; // 相対パスで外部リポ参照
const MCP_ROOT = "../../jsonui-mcp-server";
const SPEC_ROOT = "../docs/screens/json";

async function main() {
  const records: SearchRecord[] = [];

  // 1. attribute_definitions.json から attribute / component レコード
  const attrDefs = JSON.parse(await fs.readFile(
    path.join(CLI_ROOT, "shared/core/attribute_definitions.json"), "utf8"));
  records.push(...extractFromAttrDefs(attrDefs));

  // 2. mcp specs
  const mcpFiles = await fg(path.join(MCP_ROOT, "specs/components/*.json"));
  for (const file of mcpFiles) {
    const spec = JSON.parse(await fs.readFile(file, "utf8"));
    records.push(...extractFromMcpSpec(spec));
  }

  // 3. 本サイトの spec 群を走査して page レコード
  const siteSpecs = await fg(path.join(SPEC_ROOT, "**/*.spec.json"));
  for (const file of siteSpecs) {
    const spec = JSON.parse(await fs.readFile(file, "utf8"));
    records.push(specToPageRecord(file, spec));
  }

  await fs.writeFile("public/search/index.json", JSON.stringify(records));
  await fs.writeFile("public/search/meta.json", JSON.stringify({
    componentCount: records.filter(r => r.kind === "component").length,
    attributeCount: records.filter(r => r.kind === "attribute").length,
    pageCount:      records.filter(r => r.kind === "page").length,
    generatedAt:    new Date().toISOString(),
  }));
}
```

補助:
- `ja_overrides` / `ja_component_descriptions` は `docs/data/i18n/attribute-ja.json` で管理（`14` と共通）
- spec → page 変換は `metadata.displayName` / `metadata.description` を使う

## 7. 日本語対応

- `description_ja` は `tokenize: "full"` で N-gram 分割
- ひらがな／カタカナ／漢字の差分吸収は初期は無視（エンハンス候補）

## 8. パフォーマンス要件

- `index.json` は gzip 前で 500 KB 以下（属性 1000 × 各 300 bytes）
- 初回 fetch 300 ms 以内（CDN キャッシュ前提）
- タイプごとの遅延 50 ms 以下
- モーダル開閉 100 ms 以下

500 KB を超える場合:
- `description_ja` を別ファイル `index.ja.json` に分離し、言語切替時のみロード
- FlexSearch Worker モード

## 9. アクセシビリティ

- `<dialog>` タグで実装（focus trap 自動）
- `aria-activedescendant` で選択項目アナウンス
- `role="listbox"` + `role="option"`

## 10. モバイル

- 画面幅 < 768 px では `SearchModal` がフルスクリーン
- `⌘K` / `Ctrl+K` キーは PC のみ

## 11. iOS / Android 側の扱い

本機能は Web 専用。`SearchModal` / `SearchTrigger` の spec / Layout は `platforms: ["web"]` で iOS/Android に配布されないため、モバイル側に影響しない。

将来 iOS / Android にも検索機能を持たせたい場合、SearchModal Converter の各プラットフォーム実装を追加すればよい（別スコープ）。

## 12. 実装チェックリスト

- [ ] `jsonui-doc-web/scripts/build-search-index.ts` 作成（属性 + 本サイト spec 対応）
- [ ] `docs/data/i18n/attribute-ja.json` 整備（優先 100 属性）
- [ ] 独自 component_spec: `docs/screens/json/components/search_modal.component.json` / `search_trigger.component.json`（spec-first。`02-tech-stack.md §6.1`）、`.jsonui-doc-rules.json` に名前登録（Web 専用）
- [ ] Converter 生成: `jui g converter --from docs/screens/json/components/search_modal.component.json` / `--from .../search_trigger.component.json`（`--attributes` は使わない）
- [ ] React 実装: `jsonui-doc-web/src/components/extensions/SearchModal.tsx` / `SearchTrigger.tsx`
- [ ] `docs/screens/layouts/common/header.json` に `SearchTrigger`（`platforms: ["web"]`）
- [ ] `docs/screens/layouts/common/search_modal.json`（`platforms: ["web"]`）
- [ ] `docs/screens/json/search.spec.json`（フルページ版、`metadata.platforms: ["web"]`）
- [ ] ビルド統合: `jsonui-doc-web/package.json` の `prebuild` に `build:search` を追加
- [ ] `cells/search_result_row.json` / `cells/search_group_header.json`
