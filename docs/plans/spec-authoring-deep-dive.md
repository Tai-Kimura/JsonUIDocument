# Plan — spec 分割 + spec 書き方専用セクション

## ゴール

`screen_spec.json` の**書き方**をドキュメントサイトで体系的に説明する。特に現状触れられていない "**spec 分割**" のメカニクス（parent / sub spec、layoutFile 抽出、component_spec 切り出し、cellClasses、customTypes）を専用セクションで深掘りする。

JsonUIDocument の現在の spec 関連記事は:
- `learn/first-screen` — 初学者向け walkthrough（1 spec を end-to-end）
- `learn/what-is-jsonui` — spec の存在を紹介するコンセプトページ
- `guides/writing-your-first-spec` — タスク特化 10 ステップガイド（単一 screen_spec を書く）
- `reference/json-schema` — 技術リファレンス

いずれも **1 spec = 1 画面 / 1 ファイル** を前提にしており、以下の機能はドキュメント化されていない:

| 機能 | 存在場所 | 読者向けドキュメント |
|---|---|---|
| `screen_parent_spec` + `screen_sub_spec` + `subSpecs` | validator `_validate_sub_specs()` / `_parent_spec_has_layout_file()` | **無し** |
| `metadata.parentSpec` 参照 | validator `_parent_spec_has_layout_file()` | **無し** |
| `metadata.layoutFile` で Layout 抽出 | layout_importer, html_generator | 散在（書き方ではなく結果の記述のみ） |
| `component_spec` の切り出し | docs/components/json/*.component.json | **無し**（`codeblock` などは書いているが書き方の説明無し） |
| `dataFlow.customTypes` / cross-spec 参照 | validator cross-ref | **無し** |
| `structure.collection.cellClasses[]` + `sections[].cell` | html_generator `_expand_collection_refs` | **無し** |
| `structure.collection.{cell,header,footer}.layoutFile` | 同上 | **無し** |

読者は "spec は分けられるらしい" という雰囲気だけで詳細を知らず、結果として一枚岩の巨大 spec を書いて保守が詰む、あるいは分割すべき箇所に気付けない。

## IA（情報設計）

新セクション **`Spec`** を top-level に追加する。既存の Learn / Concepts / Guides / Platforms / Reference / Tools と並列。

```
Learn        初学者 walkthrough（変更なし）
Concepts     設計思想（変更なし）
Guides       タスク特化ガイド（変更なし; writing-your-first-spec は残す）
Spec         ← NEW: spec の書き方専用セクション
  index                 概要 + 記事リスト
  anatomy               spec ファイル全体像（metadata / stateManagement / dataFlow / structure / …）
  split-overview        分割の 5 パターン（全体マップ）
  parent-sub-spec       screen_parent_spec + screen_sub_spec
  layout-file           metadata.layoutFile で Layout を切り出す
  component-spec        component_spec — 再利用 UI を別ファイルに
  custom-types          dataFlow.customTypes — 型を宣言して cross-spec 参照
  cell-classes          structure.collection.cellClasses — Collection セルを切り出す
  validation-and-drift  jui verify --fail-on-diff の動き方 + cross-spec validation
Platforms    （変更なし）
Reference    （変更なし; json-schema 記事は "型の正規リファレンス" 位置）
Tools        （変更なし）
```

**記事ごとの一行概要**:

| slug | title (en) | title (ja) | ~read time |
|---|---|---|---|
| `spec/index` | Spec — how to write them | spec — 書き方 | 1 min |
| `spec/anatomy` | The anatomy of a screen spec | screen spec の全体像 | 10 min |
| `spec/split-overview` | Five ways to split a spec | spec を分割する 5 つの方法 | 7 min |
| `spec/parent-sub-spec` | Parent + sub specs | 親 spec と子 spec | 12 min |
| `spec/layout-file` | Separating the layout file | Layout ファイルの分離 | 8 min |
| `spec/component-spec` | Component specs | コンポーネント spec | 10 min |
| `spec/custom-types` | Custom types and cross-spec references | 独自型と spec 間参照 | 9 min |
| `spec/cell-classes` | Collection cell classes | Collection セルクラス | 7 min |
| `spec/validation-and-drift` | Validation + drift detection | 検証と drift 検出 | 8 min |

## 既存記事との責務分担

- **`learn/first-screen`**: end-to-end "最初の 1 画面"。1 spec + 1 layout + 1 VM。**変更なし**
- **`guides/writing-your-first-spec`**: spec 1 枚だけで書く基本 10 ステップ。**変更なし**（split には触れず、"次は /spec/ を読め" pointer を 1 つ足す程度）
- **NEW `spec/*`**: 上記 2 つを読了した読者向けの **深掘り専用セクション**。「単一 spec から分割に進む」道筋を示す
- **`reference/json-schema`**: 正規の型 / フィールドリファレンス。**変更なし**（`spec/*` が書き手向け、こちらは lookup 用）

## スコープ外（本 Plan に含めない）

- Component spec ページの UI 化（`/reference/components/*` 拡充）: 別
- Markdown export 形式（jsonui-doc `--format markdown`）の詳述: 別
- `spec_sub_spec` の実在コードサンプルを同時追加: 実在しないので concept-only に留める（将来、実際にサイト内で分割した spec が生まれたら実例で置き換える）

---

## Phase 0 — 方針確定（user 確認待ち）

実装前に以下を確定する。

### Q1. 新セクション `Spec` の挿入位置

- **A.** Learn / Concepts / **Spec** / Guides / Platforms / Reference / Tools
  - 書き方の流れ（入門 → 概念 → 仕様書 → 応用ガイド）に沿う
- **B.** Learn / Concepts / Guides / **Spec** / Platforms / Reference / Tools
  - Guides の "how to do X" の延長扱い
- **C.** Spec は Guides の直下（`guides/spec/*` サブツリー）
  - 既存 IA に影響を与えない最小変更

**推奨**: **A**。spec は設計思想と具体作業の間に位置する根幹なので top-level に置く。user が "専用セクション" と明言している意図にも合う。

### Q2. `guides/writing-your-first-spec` とのリンク

- **A.** `writing-your-first-spec` の next_reads に `spec/index` を追加するだけ
- **B.** `writing-your-first-spec` を `spec/writing-your-first-spec` に移動（記事自体が spec 入門になる）
- **C.** `writing-your-first-spec` を `spec/anatomy` に吸収

**推奨**: **A**。既存の Guides の並びと URL を維持したいので、単純に pointer を足すだけ。`spec/anatomy` は「全セクションの辞書的俯瞰」で、`writing-your-first-spec` は「プロセス順 10 ステップ」なので担当が違う。

### Q3. 執筆順序と Phase 分割

`spec/*` の 9 記事を一気に書くか分けるか。

- **A.** 全 9 記事を 1 つの Plan / 1 セッションで着地させる
- **B.** Phase 分け:
  1. 基盤（`index` / `anatomy` / `split-overview`）— IA / 全体俯瞰
  2. 分割詳細 3 本（`parent-sub-spec` / `layout-file` / `component-spec`）
  3. 発展 3 本（`custom-types` / `cell-classes` / `validation-and-drift`）
- **C.** Phase 1 だけ先に着手して感触を見て Phase 2 / 3 判断

**推奨**: **B**。記事数が 9 と多く、かつ分割 3 本は spec 1 枚当たりの文量が多くなる。Phase 1 で骨格を見せてから 2 / 3 に進むほうが reader experience を評価しながら進められる。

→ Q1-Q3（推奨でよければ「推奨で OK」だけで可）を教えてください。

---

## Phase 1 — 基盤 3 本

### 1a. `spec/index`（1 min read）

- **役割**: セクション目次 + "この順番で読め" の案内
- **構成**:
  - 1 段落: spec は 1 枚で完結もできるし、分けることもできる。本セクションは後者を専門に扱う
  - 記事リスト（anatomy / split-overview / 詳細 3 本 / 発展 3 本）と each の読了時間
  - 前提記事の pointer（Learn トラックと `writing-your-first-spec` を読んでから来い）
- **編集対象**:
  - 新規: `docs/screens/json/spec/index.spec.json`
  - 新規: `docs/screens/layouts/spec/index.json`
  - 新規: `jsonui-doc-web/src/viewmodels/spec/IndexViewModel.ts`（list の hydration は Index パターン踏襲）
  - `Chrome` の `Spec` タブエントリ追加（chrome.json + ChromeViewModel.ts）
  - `Home` の Learn / Concepts / Guides タイル横に Spec タイルを追加（任意、user 判断）

### 1b. `spec/anatomy`（10 min read）

- **役割**: screen_spec.json の**全セクション辞書**。各フィールドの目的と位置を 1 枚で俯瞰
- **構成**: 5 セクション
  1. **Top-level shape** — `type` / `version` / `metadata` / `structure` / `stateManagement` / `dataFlow` / `userActions` / `validation` / `transitions` / `relatedFiles` / `notes`
  2. **metadata** — `name` (PascalCase), `displayName`, `description`, `platforms`, `layoutFile`, `parentSpec`, `createdAt` / `updatedAt`
  3. **stateManagement** — `states`, `uiVariables`, `eventHandlers`, `displayLogic` の役割分担
  4. **dataFlow** — `diagram` (Mermaid), `viewModel` (methods + vars), `customTypes`, `repositories`, `useCases`, `apiEndpoints`
  5. **structure** — `components`, `layout`, `collection`, `tabView`, `decorativeElements`, `wrapperViews`, `customComponents`
- **各セクションで扱うこと**:
  - 必須 / 任意の区別
  - 他セクションとの参照関係（例: `structure.components[].id` が `stateManagement.displayLogic[].effects[].element` から参照される）
  - 実在 spec の引用（hello-world.spec.json の該当ブロック）
- **NOT 扱う**: 分割の詳細（それは後続 3 本に）

### 1c. `spec/split-overview`（7 min read）

- **役割**: 分割の 5 パターンの**マップ**。「どんなとき何を使うか」の分岐表
- **構成**:
  - 冒頭: "なぜ分割するか" — 1 画面 spec でも 500 行、2 画面共通化で肥大、カスタム UI を複数画面で使う、など
  - **5 パターン**の比較表:

    | # | パターン | 何を分ける | いつ使う | 関連記事 |
    |---|---|---|---|---|
    | 1 | layoutFile 抽出 | Layout JSON を別ファイルに | Layout が 200 行超える、複数画面で共通 chrome を使う | `spec/layout-file` |
    | 2 | parent + sub spec | 同一画面の機能単位を別 spec に | 状態・イベントが 20+ になる、領域ごとにレビュー分担したい | `spec/parent-sub-spec` |
    | 3 | component_spec | 再利用カスタム UI を別ファイルに | CodeBlock / Chart / TableOfContents のような横断コンポーネント | `spec/component-spec` |
    | 4 | customTypes | 型を dataFlow に宣言して他 spec から参照 | 同じ行モデル（ActivityRow / Entry / 等）を複数画面で使う | `spec/custom-types` |
    | 5 | cellClasses | Collection のセルレイアウトを別ファイル | 同じセルを 2+ 箇所の Collection が使う | `spec/cell-classes` |

  - 分岐フロー図（Mermaid）で「これが該当するならこの記事」
- **編集対象**: 上記と同様の 3 ファイル

---

## Phase 2 — 分割詳細 3 本

### 2a. `spec/parent-sub-spec`（12 min read）

- **扱う機能**: `type: "screen_parent_spec"` + `subSpecs: [{file, name}]` + sub 側 `type: "screen_sub_spec"` + `metadata.parentSpec`
- **構成**:
  1. なぜ分けるか — 例: 親が全体のレイアウト / データフロー、sub がタブごとの stateManagement のみ
  2. 親 spec の書き方（`subSpecs` 配列、各 entry の `{file, name}`）
  3. sub spec の書き方（`parentSpec` 参照、`metadata.description` 必須、他は parent から継承）
  4. 親側 vs sub 側に何を置くか（`metadata.layoutFile` は親、`stateManagement.uiVariables` は sub で OK、`dataFlow.customTypes` は parent に集約、…）
  5. validator の挙動 — parent に layoutFile があれば sub は `structure.components` を省略できる（`_parent_spec_has_layout_file()`）
  6. `jui build` / `jui verify` の挙動 — parent + sub を merge してから生成・drift 判定
  7. アンチパターン — sub を過剰分割（5 sub 以上はレビュー地獄）
- **ソース参考**: validator.py の spec_type 分岐

### 2b. `spec/layout-file`（8 min read）

- **扱う機能**: `metadata.layoutFile`
- **構成**:
  1. なぜ分けるか — Layout が肥大化、複数 spec で同じ Layout を共有、デザイナー / フロントエンド担当を分離
  2. spec 側の書き方 — `"layoutFile": "learn/hello-world"` など（`.json` は省略、`docs/screens/layouts/` からの相対パス）
  3. Layout JSON 側の書き方 — 独立した Layout ファイルとして成立すること
  4. spec の `structure.components` / `structure.layout` を**空にする** — layout_importer が自動投入する
  5. `jsonui-doc generate spec` での扱い — `layouts_dir` auto-detect が効けば structure セクションは Layout から populate（報告書 `doc-structure-and-rjui-flex-min-w-0.md` の修正で復旧済み）
  6. ディレクトリ規約 — `docs/screens/layouts/<category>/<name>.json`
  7. 同じ Layout を複数 spec から参照する例（言語違い / 季節違いで同じ Layout + 別コンテンツ）
- **ソース参考**: layout_importer.py

### 2c. `spec/component-spec`（10 min read）

- **扱う機能**: `type: "component_spec"`（`docs/components/json/*.component.json`）
- **構成**:
  1. コンポーネント spec とは何か — 再利用 UI の契約。画面 spec が custom component を参照する
  2. spec ファイルの構造 — `type: component_spec`, `metadata`, `props`, `slots`, `events`, `platformMapping`
  3. 配置規約 — `docs/components/json/<kebab-name>.component.json`（JsonUIDocument 現在 6 件）
  4. 画面 spec からの参照 — `structure.customComponents[]` に `{name, ref, platformMapping}` を書く
  5. ジェネレータの emit — rjui は extensions/ に React component を出す（JsonUIDocument の CodeBlock / DocSamplePreview が実例）
  6. props の型と validator — `required` / `default` / `optional` の扱い
  7. 実在例を 2 つ読む — `codeblock.component.json`（複雑）と `doc-sample-preview.component.json`（最小、子無し）
  8. いつ component_spec にすべきでないか — 1 画面でしか使わないなら inline が OK
- **ソース参考**: validator.py の `_validate_component` と `docs/components/html/*.html`

---

## Phase 3 — 発展 3 本

### 3a. `spec/custom-types`（9 min read）

- **扱う機能**: `dataFlow.customTypes: [{name, properties}]`
- **構成**:
  1. 用途 — 独自の Row / Entry / Item 型を定義し、uiVariables / VM vars の type に `[ActivityRow]` のように書ける
  2. 型参照のパターン — 単純型（`String`, `Int`）/ 配列（`[T]`）/ optional（`T?`）/ customType 名
  3. 他 spec から参照する方法 — 同プロジェクト内の customTypes は type-mapper に載せれば cross-reference できる（`.jsonui-type-map.json` の役割）
  4. プラットフォーム別型マッピング — `_example_swift_package_type` の読み解き
  5. アンチパターン — 1 spec でしか使わないなら inline の方が読みやすい
- **ソース参考**: jui_cli core/type_mapper.py

### 3b. `spec/cell-classes`（7 min read）

- **扱う機能**: `structure.collection.cellClasses[]` + `sections[].{cell, header, footer}`
- **構成**:
  1. Collection の構成 — `items` (binding), `sections[]` (sectionCount x {cell, header, footer})
  2. 単一 cell パターン（現状の ActivityRow など） vs 多 cell パターン（ホーム画面のフィードなど）
  3. `cellClasses` 配列で複数のセルレイアウトを宣言、`sections[].cell: "cells/activity_row"` のようにパス参照
  4. セルレイアウトファイルの規約 — `docs/screens/layouts/cells/*.json`
  5. `jui build` での展開 — html_generator の `_expand_collection_refs` で cellClasses が inline される
  6. `cell.layoutFile` vs `cell: "cells/..."` の使い分け（後者は cellClasses 経由、前者は直接ファイル参照）
- **ソース参考**: layout_importer `_expand_collection_refs`

### 3c. `spec/validation-and-drift`（8 min read）

- **扱う機能**: `jui verify --fail-on-diff` + `jsonui-doc validate spec`
- **構成**:
  1. 2 つの違い — `jui verify` は **spec ↔ generated** の drift、`jsonui-doc validate` は **spec 単体の型 / schema** 検証
  2. `jui verify --fail-on-diff` は内部で両方走る（`verify_cmd.py` が `spec_validator` を import）
  3. drift とは何か — spec の uiVariable を追加したのに Layout の binding が追従していない、など
  4. cross-reference validation — parent ↔ sub spec、customTypes の循環参照
  5. エラーメッセージの読み方（path + message）
  6. CI での組み込み例 — `/tools/test-runner` 記事の CI 例を再掲
- **ソース参考**: validator.py の cross_reference check

---

## Phase 4 — 通し検証

1. `jui_build` MCP — 新規 9 記事すべて 0 warning
2. `jui_verify --fail-on-diff` — drift 0
3. `jsonui-localize` skill — 新 namespace (`spec_*`) の string 漏れなし
4. `doc_validate_spec` MCP — 9 新規 spec 全て validator pass
5. ブラウザ目視 — `/spec/` と各記事が HTTP 200、runtime error 0
6. 既存記事の next_reads / related pointers 更新: `learn/first-screen` と `guides/writing-your-first-spec` の最後に `/spec/index` への pointer

---

## ブロッカー / 前提

- **なし**（検証した library bug 2 件は fix 済み）
- Phase 2a の `parent-sub-spec` 記事は実在コードサンプルが無い（JsonUIDocument / whisky-find-agent どちらも screen_sub_spec 未使用）ので、**合成 example** を書く必要あり。仮想の `docs/screens/json/_examples/` に「教材専用のお手本 spec 分割セット」を置いて引用する案

## 実装時の参考ファイル（library 側 — 修正ではなく読解対象）

- `/Users/like-a-rolling_stone/resource/jsonui-cli/document_tools/jsonui_doc_cli/spec_doc/validator.py` — spec type 分岐、metadata 検証、cross-ref
- `/Users/like-a-rolling_stone/resource/jsonui-cli/document_tools/jsonui_doc_cli/spec_doc/layout_importer.py` — layoutFile 展開、cellClasses 展開
- `/Users/like-a-rolling_stone/resource/jsonui-cli/document_tools/jsonui_doc_cli/spec_doc/html_generator.py` — structure セクション描画
- `/Users/like-a-rolling_stone/resource/jsonui-cli/jui_tools/jui_cli/commands/verify_cmd.py` — drift 判定の実装

## 順序

1. ~~Phase 0（Q1-Q3 の user 確認）~~ ← 着手前確認
2. Phase 1（index + anatomy + split-overview）→ build & verify → 中間レビュー
3. Phase 2（分割詳細 3 本）→ build & verify
4. Phase 3（発展 3 本）→ build & verify
5. Phase 4（通し検証 + 既存記事への pointer）

Phase 1-3 は独立 commit 可能。1 Phase = 1 PR を推奨。

## 期待される diff 概要

| 編集対象 | 規模 |
|---|---|
| `docs/screens/json/spec/*.spec.json` | 新規 9 件 |
| `docs/screens/layouts/spec/*.json` | 新規 9 件 |
| `jsonui-doc-web/src/viewmodels/spec/*.ts` | 新規 9 件（index は ViewModelBase 生成、他は hand-written の直接 class パターン） |
| `docs/screens/layouts/chrome.json` | Spec タブ 1 行追加 |
| `jsonui-doc-web/src/viewmodels/ChromeViewModel.ts` | Spec タブ entry 1 行 |
| `docs/screens/layouts/Resources/strings.json` | `spec_*` namespace × 9 記事分（各 ~20-40 keys × 9 ≈ 200-400 new keys） |
| `docs/screens/layouts/learn/first-screen.json` | next_reads に `/spec/index` pointer 1 行 |
| `docs/screens/layouts/guides/writing-your-first-spec.json` | 同上 |
| （任意）`docs/screens/json/_examples/split-example/` | 合成 example の parent + sub specs |
