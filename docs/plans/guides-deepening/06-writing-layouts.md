# 06 · writing-layouts 新設

作成日: 2026-04-24
ステータス: 提案

## 背景

既存 5 ガイドは全て "spec を起点にした workflow" を説明する内容だった。
layout JSON 自体の書き方（style を共有する、sub-layout を include する、Collection で cell を並べる、`"gone"` と `"invisible"` の差など）は横断的に散らばっており、1 つの参照先が存在しない。

## ゴール

1 つ新しいガイドページ `/guides/writing-layouts` を追加し、**Web (rjui) の layout JSON を書く人が最初に知るべき 5 つのパターン** を網羅する。

- style 定義の作り方と適用方法
- include による sub-layout 再利用
- Collection の基本形（単一 cell type）
- Collection の multi-section 形（異なる cell type を 1 画面に並べる）
- よくあるハマりどころ

## スコープの交渉ポイント（user 判断要）

user の発言は「セクションを一個追加」だった。解釈 2 つ:

- **A. 独立ガイドページ追加** (既定案・この plan の内容) — 5 つのセクションが独立した guides/writing-layouts ページに収まる。
- **B. 既存ガイドの内部セクション追加** — 例: writing-your-first-spec に「step 7: layout tips」を追加。ただし、writing-your-first-spec は既に 10 step + 6 trouble で相当重くなっているし、layout authoring は spec authoring とは別トピック。他 4 ガイドも content-fit しない。

**既定は A**。B を選ぶ場合は plan を書き直す必要がある。

## Non-goals

- 3 platform 差分（Swift / Kotlin）には触れない。Web 主体 docs site なので rjui 挙動に絞る。
- 新 custom component の導入はしない（CodeBlock / Label / View 縛り）。
- Styles フォルダに新 style 定義を増やすことはしない — 記事内では既存の `primary_button` / `hero_section` 等を引用する。

## 共通原則（00-overview から踏襲）

- Spec-first: `docs/screens/json/guides/writing-layouts.spec.json` を先に書く。
- CodeBlock を積極活用。すべてのコード例は実在リポ (JsonUIDocument or rjui_tools) から抜粋。
- `jui build` zero warnings / `jui verify --fail-on-diff` を通過で完了。
- en/ja 両方同時更新。

---

## 実装現実（調査済み事実）

以下は `Explore` agent で rjui_tools と JsonUIDocument を実調査した結果。ガイド本文はここに根拠を置く。

### Topic A — Style 定義

- 置き場所: `docs/screens/styles/*.json`（`jui.config.json` の `styles_directory` で指定）。例: `primary_button.json`, `ghost_button.json`, `card_surface.json`, `section_heading.json`, `hero_section.json`。
- Style ファイルの shape: 通常のコンポーネント JSON と同じ（`type`, `paddings`, `background`, `fontColor` 等がフラットに並ぶ）。
- Layout からの適用: `"style": "primary_button"` を component に追加するだけ。
- 処理: `rjui_tools/lib/react/style_loader.rb` がビルド時に merge。 **Component inline が style を上書きする**（line 31: `merged = deep_merge(style_data_for_merge, component_without_style)`）。
- `type` 衝突: component が `type` を指定していれば style 側の `type` は捨てられる（line 26-28）。
- **継承 / extends 機構は存在しない**。スタイルはフラット。合成したい場合は親 layout で 2 つの View をネストするしかない。
- 実例: `docs/screens/layouts/home.json` line 46, 89, 96, 119, 125 が `"style": "hero_section" / "primary_button" / "ghost_button" / "section_heading" / "section_subheading"` を使用。

### Topic B — Include (sub-layout 再利用)

- 機構は **存在する**。syntax は `"include": "path/to/layout"` （`layouts/` 相対、拡張子無し）。
- 処理: `rjui_tools/lib/react/converters/include_converter.rb`。include path を PascalCase component 名に変換し（`main_menu` → `MainMenu`）、`shared_data` + `data` を props としてマージして React コンポーネントとして emit する。
- Collection cell との違い: Collection cell は **データ配列 × cell テンプレート** で複数行を出す。include は **単体の再利用可能な sub-layout** を 1 回差し込むだけ。
- 再帰 include: include されたファイル内部の `"include"` をさらに辿ることはしない（1 段のみ）。
- **現状 JsonUIDocument 内で `"include"` は未使用**。ガイドで紹介すると同時に「実は使えるのに誰も使ってない機能」という位置づけになる。提案価値が高い。

### Topic C — Collection 完全版 attribute

Attributes:
- `items`: `"@{name}"` binding（CollectionDataSource ベース）
- `cellIdProperty`: stable React key として使う row の property 名（なければ `cellIndex` fallback）
- `sections`: 配列。各要素 `{cell: "cells/..."}`。
- `orientation`: `"vertical"` (default) / `"horizontal"`
- `columnCount`: grid の列数
- `lineSpacing`: 行間（縦方向）
- `itemSpacing`: 列間（横方向）
- `spacing`: lineSpacing/itemSpacing の fallback
- `lazy`: false なら Collection 自身はスクロールせず、親 Scroll に任せる
- `scrollEnabled`: false で overflow 無効
- `contentInset`: `[top, left, bottom, right]`
- `autoChangeTrackingId`: true で cellIdProperty から cellId を自動生成

非対応: `headerCell`, `footerCell`, `emptyCell`, `separator` は未対応（グローバル top-level では）。

### Topic D — Multi-section 的運用

- 1 section = 1 cell type。**動的に per-row で cell を選ぶ機能は無い**。異なる cell type を混ぜる場合は section を複数に分ける。
- 実装: `items_binding?.sections?.[sectionIndex]?.cells?.data ?? []` で各 section を取り出し、その section の `cell: "cells/X"` を全行に適用（collection_converter.rb line 146）。
- 使いどころ: チャットログで user/assistant を別 cell、リファレンスページで featured と index rows を別 cell、等。

### Topic E — cell の `data` block

- `data: [{name, class}]` は cell が親から要求するデータ形状を宣言する。rjui はこれから `{Cell}Data` interface を TypeScript で生成する。
- 例: `cells/agent_row.json` の data block は 3 つ（nameKey / roleKey / whenToUseKey）で、全て `class: "String"`。
- 生成先: `jsonui-doc-web/src/generated/data/AgentRowData.ts`（`@generated`）。

### Topic F — 実行時の contract

- rjui は cell layout から `.tsx` を emit（`src/generated/components/cells/{PascalCaseCell}.tsx`）。
- 生成ファイルは `@generated` — **手で直さない**。style / 挙動を変えたいときは (a) cell layout JSON 自体を編集、(b) custom converter を作る のどちらか。
- developers は ViewModel で `CollectionDataSource.setCells(sectionIndex, rows)` の形で data を流し込む。

### Topic G — Pitfalls（実ソース確認済み）

- **weight vs matchParent**: `height: "matchParent"` を flex-row で使うと `self-stretch` (cross-axis 埋め) になり、`flex-1` (main-axis 伸ばし) にはならない。main-axis を伸ばしたければ `weight: 1` を使う。rjui の base_converter.rb 39 で条件分岐あり。
- **topMargin は orientation と無関係に `mt-X`**。horizontal 並びで `topMargin` を書くと "左右に並ぶ兄弟間のスペース" ではなく "上方向のスペース" になる。兄弟間スペースには `leftMargin`（or 親の `itemSpacing`）を使う。
- **`visibility: "gone"` vs `"invisible"`**: rjui は `"gone"` を条件 render (`{cond !== "gone" && (...)}`) に、`"invisible"` を CSS class (`invisible` = `visibility:hidden`) に変換する。DOM から消したいなら `"gone"`、スペースだけ残して見た目を消すなら `"invisible"`。
- **`_overlay` は internal**: 手書き禁止。rjui が absolute 判定で自動付与する。手書きでオーバーレイ配置したいときは `position: "absolute"` 類の attribute ではなく、通常の配置で記述し、必要なら z-index を `zIndex` 数値で指定する（TailwindMapper が `z-10` / `z-20` 等に変換）。

---

## 新ガイドの構造

### Meta

- `metadata.name`: `"WritingLayouts"` (PascalCase)
- `metadata.displayName`: `"Writing layouts"` / 日本語 `"レイアウトを書く"`
- `metadata.platforms`: `["web"]`
- `metadata.layoutFile`: `"guides/writing-layouts"`
- `metadata.createdAt`: `"2026-04-24"`
- 読了目安: **~18 min read** / 約 18 分

### TOC / sections（7 項目）

1. **Orient yourself (where things live)** — `section_where`
   - `docs/screens/layouts/*.json` / `docs/screens/layouts/cells/*.json` / `docs/screens/styles/*.json` / `docs/screens/layouts/Resources/strings.json` の 4 ファイル系統を最初に示す。
   - CodeBlock (text): project tree excerpt。

2. **Style definitions** — `section_style`
   - Style ファイルの shape と applying 方法。
   - Merge 挙動（component 値が優先、type は特殊）。
   - "継承は無い、構成は flat、合成したければネストで" の一文を明示。
   - CodeBlock 1 (json): `primary_button.json` 抜粋。
   - CodeBlock 2 (json): home.json で `"style": "primary_button"` を使う箇所抜粋。

3. **Include (sub-layout reuse)** — `section_include`
   - syntax `"include": "path/to/layout"`。
   - `shared_data` / `data` props mapping を 1 行で解説。
   - Collection cell との違いを 1 パラで。
   - CodeBlock 1 (json): `"include"` の使用例（仮想的な `common/back_button` などをインクルード）。
   - CodeBlock 2 (json): 被 include 側 layout の skeleton。
   - **重要な現状注記**: JsonUIDocument 本体では現在未使用。利用開始する際は base_converter のコメントアウト領域などを念のため確認する旨（あるいは proactive に導入を推奨する旨）を書く。

4. **Collection basics (single cell type)** — `section_collection_basic`
   - 最小形: `items` + `cellIdProperty` + `sections[{cell}]`。
   - Layout attrs の一覧: orientation / columnCount / lineSpacing / itemSpacing / lazy / scrollEnabled の使い分け。
   - cellIdProperty の役割（React key）。
   - cell side の `data: [{name, class}]` block の意味。
   - CodeBlock 1 (json): home.json から Collection の 1 つを抜粋。
   - CodeBlock 2 (json): 対応する cell layout（例: `cells/agent_row.json`）の `data` block 抜粋。
   - CodeBlock 3 (typescript): 生成された `AgentRowData.ts` interface 抜粋（@generated を示す）。

5. **Collection multi-section (mixed cell types)** — `section_collection_multi`
   - rjui の「section 単位で cell type が固定」の制約を明示。
   - 2 種類以上の cell を並べたい場合は `sections: [{cell:A}, {cell:B}]` のように section 分割 + VM 側でデータを section に振り分ける。
   - CodeBlock (json): 2 section Collection の skeleton（例: featured card section + regular row section）。
   - ViewModel 側は別ガイドへ誘導（writing-your-first-spec / concepts/data-binding）。

6. **Binding and visibility tricks** — `section_binding`
   - `@{propertyName}` の基本 syntax。
   - visibility 3 値 (`"visible"` / `"invisible"` / `"gone"`) の挙動差を bullet で。
   - conditional emit vs DOM 保持の違い。
   - CodeBlock (json): 可視性 binding の典型パターン（`"visibility": "@{errorVisibility}"` 等）。

7. **Common pitfalls** — `section_pitfalls`
   - bullet 4 本:
     - `weight: 1` vs `height: "matchParent"` in flex-row（main-axis vs cross-axis）
     - `topMargin` は orientation 非依存 → horizontal では `leftMargin` or `itemSpacing`
     - `visibility: "gone"` (DOM 消失) vs `"invisible"` (CSS visibility:hidden)
     - `_overlay` は internal — 手書き禁止、通常 attributes + `zIndex` で同等のことはできる
   - どれも実挙動は rjui ソースで確認済みなので "観測された挙動" として書く。

### next-reads（2 card）

- `/guides/custom-components` → "Wrapping layout patterns into a custom component"
- `/guides/writing-your-first-spec` → "Reading the state a layout binds to"

### 既存ガイドからの相互リンク（運用）

既存 5 ガイドは現状 `nextReadLinks` が 2 個固定。相互リンクしたい場合は:
- `custom-components` の next に `writing-layouts` を追加 → VM と strings を書き換え（次イテレーションで）
- `writing-your-first-spec` の trouble_* や step の本文から `writing-layouts` を参照する一文を足す（任意）

この plan では **新ガイドを追加するだけ**に留め、既存ガイドの next-reads 差し替えは後続イテレーションで扱う。

---

## 変更対象ファイル

**新規作成:**
- `docs/screens/json/guides/writing-layouts.spec.json`
- `docs/screens/layouts/guides/writing-layouts.json`（source of truth、hand-edit）
- `jsonui-doc-web/src/viewmodels/guides/WritingLayoutsViewModel.ts`
- `jsonui-doc-web/src/app/guides/writing-layouts/page.tsx`

**編集:**
- `docs/screens/layouts/Resources/strings.json` — `guides_writing_layouts` namespace を追加（60+ keys × en/ja）
- Guides index (`docs/screens/layouts/guides_index.json` or 対応する VM 側 `GUIDES_ENTRIES`) — 新エントリの行を `upcoming` → `live` 状態で追加

**触らない:**
- `.jsonui-doc-rules.json` — 新 custom component を追加しないので変更不要
- `jui.config.json` — 設定変更なし
- 他 5 ガイドの spec / layout / strings — 別イテレーションで相互リンク

---

## strings.json 新設キー（`guides_writing_layouts` namespace）

大きな塊だけ列挙（全部で ~70 entries × 2 lang）:

- 共通: `breadcrumb`, `title`, `lead`, `read_time`, `next_heading`, `footer_copyright`, `toc_title`
- Section 1 (where): `section_where_heading`, `section_where_body` (+ CodeBlock literal embedded in layout)
- Section 2 (style): `section_style_heading`, `section_style_body`, `section_style_note_no_inheritance`
- Section 3 (include): `section_include_heading`, `section_include_body`, `section_include_vs_collection`, `section_include_current_usage_note`
- Section 4 (collection basic): `section_collection_basic_heading`, `section_collection_basic_body`, `section_collection_basic_attrs_heading`, 7〜8 個の attribute 説明 bullet (`section_collection_basic_bullet_items` / `_bullet_cellIdProperty` / `_bullet_orientation` / `_bullet_columnCount` / `_bullet_spacing` / `_bullet_lazy` / `_bullet_scrollEnabled`)
- Section 5 (collection multi): `section_collection_multi_heading`, `section_collection_multi_body`, `section_collection_multi_tip`
- Section 6 (binding): `section_binding_heading`, `section_binding_body`, `section_binding_bullet_visible`, `section_binding_bullet_invisible`, `section_binding_bullet_gone`
- Section 7 (pitfalls): `section_pitfalls_heading`, `section_pitfalls_body`, `section_pitfalls_bullet_weight`, `_bullet_topMargin`, `_bullet_visibility`, `_bullet_overlay`
- next-reads: `next_custom_components_title/description`, `next_first_spec_title/description`
- TOC: 7 × `toc_row_*`

CodeBlock 内容は strings.json 外、layout JSON 内に直接 literal で埋める（既存 5 ガイドと同じ運用）。

---

## 実装順

1. `jui doc init spec --name WritingLayouts` で spec skeleton
2. spec を編集し `jui doc validate spec` pass
3. strings.json に `guides_writing_layouts` namespace を追加（en/ja 両方）
4. layout JSON を `docs/screens/layouts/guides/writing-layouts.json` に書き下ろす
   - 既存 guide (例 custom-components.json) を template にコピー → section を 7 個に書き換え
   - CodeBlock を 6〜7 本埋め込み
5. ViewModel (`WritingLayoutsViewModel.ts`) 作成 — nextReadLinks の catalog を定義（既存 guide VM のコピーベース）
6. page.tsx を `src/app/guides/writing-layouts/page.tsx` に作成
7. Guides index への追加（`guides_index.json` or VM に 1 行増やす）
8. `jui build` → zero warnings 確認
9. `jui verify --fail-on-diff` → no drift 確認
10. `/guides/writing-layouts` をブラウザで目視確認

各ステップ間で git diff を確認し、他セッションが触っている範囲（learn-track 周辺）に干渉しないこと。

---

## 検証ゲート

- `jui doc validate spec --file docs/screens/json/guides/writing-layouts.spec.json` → is_valid true
- `jui build` → zero warnings（他セッション由来 warning は既知なので区別して報告）
- `jui verify --fail-on-diff` → no drift
- Browser で 7 section + TOC + next-reads が正しく表示
- 日本語 / 英語の切替で両方表示される（`StringManager.setLanguage('ja')` で確認）

---

## 作業見積り

- spec + VM + page.tsx: 0.5h
- layout JSON + CodeBlock 埋め込み: 1.5h
- strings.json: 70 keys × 2 lang = 140 entries ≒ 2.5h
- Guides index 追加: 0.3h
- build / verify / ブラウザ確認 + fix loop: 1.5h
- 計 **~6h**

---

## オープン質問

1. **ガイド名**: `writing-layouts` / `layout-patterns` / `authoring-layouts` / `layout-tips` — どれが user 好み？既存命名（writing-your-first-spec）との整合を意識すると `writing-layouts` が一番馴染む。
2. **"セクション一個" という user 指示の解釈**: 独立ガイド (A) で OK か？B（既存ガイド内のサブセクション）希望なら re-plan 要。
3. **Include セクションの温度**: JsonUIDocument 未使用機能なので「紹介するが使い慣れたパターンではない」と書くのが誠実か？それとも「推奨パターン」として強く書くか？個人的には誠実路線 (「使えるのは知っておいて、必要な時に」) を推奨。
4. **既存 5 ガイドの next-reads に新ガイドを差し込むか**: 別 iteration でやる前提でこの plan では触らない。触るなら custom-components の next を `writing-your-first-spec` + `writing-layouts` にするのが自然。
