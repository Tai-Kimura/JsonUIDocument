# Embed 機能 — ドキュメントサイト反映計画

**日付**: 2026-05-14
**元レポート**: `jsonui-cli/docs/plans/reports/2026-05-14-embed-feature.md`
**ステータス**: 草案（ユーザ承認待ち）

---

## 1. 背景

ライブラリ側で `Embed` view type が v1 として完了済（SwiftJsonUI 10.1.0 / KotlinJsonUI 2.8.0 / rjui_tools `EmbedContainer.tsx`）。本リポジトリは既に `jui sync_tool` で attribute_definitions / runtime tsx を取得済み、`specification-rules.md` に `(5) Screen with embedded sub-screens` 節（commits `330f827`, `0dc530d`）も反映済。

残作業はこのドキュメントサイト上の**読者向け露出**：

1. Reference の Component reference に `Embed` ページが存在しない
2. Spec トラックの `anatomy` / `layout-file` ページに `structure.embeds[]` と `"type": "Embed"` が登場していない
3. 上記に紐づく strings.json (en/ja)
4. （オプション）Concepts に「Screen composition」記事、Guides > Navigation に pop 境界の追記

ライブラリ側の version 文字列はサイトのどの spec/layout にもハードコードされていない（確認済）ため、bump 反映作業は不要。

---

## 2. 不変条件（JsonUI invariants）

すべての変更は以下を満たす：

- `jui build` zero warnings
- `jui verify --fail-on-diff` no drift
- `@generated` ファイルは手で触らない（spec/overrides/strings 経由のみ）
- `jsonui-localize` を完了させてから commit

---

## 3. スコープ

### P0 — ライブラリ機能と同じ抽象レベルで読める状態にする

| # | 変更 | 出力 | MCP ツール |
|---|---|---|---|
| P0-1 | `docs/data/attribute-overrides/embed.json` を新規作成 | description / usage / examples / 各属性 note (en + ja) | 手動 |
| P0-2 | `npm run build:attrs` を実行 | `docs/screens/json/reference/components/embed.spec.json` + `docs/screens/layouts/reference/components/embed.json` + `jsonui-doc-web/public/data/attribute-reference/components/embed.json` + `jsonui-doc-web/src/app/reference/components/embed/page.tsx` を生成 | npm script |
| P0-3 | `docs/screens/json/spec/anatomy.spec.json` + 対応 layout の `structure` 例 / 用語表に `embeds[]` を追加 | spec + layout 更新 | `mcp__jui-tools__read_spec_file`, `Edit` |
| P0-4 | `docs/screens/json/spec/layout-file.spec.json` + 対応 layout に `"type": "Embed"` を「screen composition primitive」として記載（`include`, `TabView` と並列扱い） | spec + layout 更新 | `Edit` |
| P0-5 | strings.json (en + ja) に上記の新規キーを追加 | string namespace 追記 | `Edit` |
| P0-6 | `jsonui-localize` 実行 → 全 string キー網羅確認 | localize 出力 | jsonui-localize skill |
| P0-7 | `mcp__jui-tools__jui_build` → zero warnings 確認 | build 結果 | MCP |
| P0-8 | `mcp__jui-tools__jui_verify` → no drift 確認 | verify 結果 | MCP |

### P0 (続き) — 採用しやすくする（同じ PR に同梱）

| # | 変更 | 備考 |
|---|---|---|
| P0-9  | Concepts に `screen-composition.spec.json` を新規（include / TabView / Embed の使い分けを 1 ページで腹落ち） | responsive-design.spec.json と同じ構成。spec + layout + VM + hook + route page + `ChromeViewModel.ts` の NAV_CATALOG 追記 + strings。 |
| P0-10 | Guides > navigation に「Embed delegate モードの pop 境界」セクション追加 | 既存 `navigation.spec.json` / 対応 layout の末尾に short note + strings。 |
| P0-11 | Reference > Components 一覧（`components.spec.json` overview）に「Composition」カテゴリ群を追加し、Embed / TabView / include を分類 | hand-authored overview。auto-gen の per-component ページに加えて、overview 側で「Widget」「Layout」「Composition」を分ける。 |

### P1 — ライブラリ側の v1.5 後送り対応待ち（**今回は手を付けない**）

- `navigationMode: "isolated"` の記載（ライブラリ未実装のため）

---

## 3.5 P0-9 / P0-10 / P0-11 詳細

### P0-9 — Concepts: `screen-composition.spec.json`

既存 6 本（data-binding / hot-reload / one-layout-json / responsive-design / viewmodel-owned-state / why-spec-first）と並ぶ 7 本目。構成は responsive-design に倣う：

- spec: `docs/screens/json/concepts/screen-composition.spec.json`
- layout: `docs/screens/layouts/concepts/screen-composition.json`
- VM: `jsonui-doc-web/src/viewmodels/concepts/ScreenCompositionViewModel.ts`（`getDefaultString` パターン）
- hook: `jsonui-doc-web/src/hooks/concepts/useScreenCompositionViewModel.ts`（`mountLanguage` + `jsonui:languagechange`）
- route: `jsonui-doc-web/src/app/concepts/screen-composition/page.tsx`
- `ChromeViewModel.ts` NAV_CATALOG の concepts entries に `{ id: "screen-composition", titleKey: "concepts_screen_composition_title", labelEn: "Screen composition", url: "/concepts/screen-composition" }` を追加
- strings: `concepts_screen_composition_*` namespace（en + ja）

本文セクション案：

1. **なぜ 3 つあるのか** — シナリオ別の最小選択基準
2. **`include` — codegen 展開・VM 共有** — 静的に再利用したいだけのとき
3. **`TabView.tabs[].include` — VM 1 個・タブ複数** — タブ切替で state を保持
4. **`Embed` — 子が独立 VM を所有** — master/detail・ダッシュボードパネル
5. **比較表** — VM 所有 / params / events / navigation 境界
6. **Embed 詳細** — `regionId` / `params` / `events` / `navigationMode: "delegate"` の挙動
7. **Next read** — `/spec/anatomy`（structure.embeds[]）と `/reference/components/embed`

### P0-10 — Guides > navigation：pop 境界 note

`docs/screens/json/guides/navigation.spec.json` / 対応 layout の末尾に追記：

> **Embed と pop 境界**
> `Embed` で `navigationMode: "delegate"` のとき、埋め込まれた子 screen の `push` は親の NavController/Router に bubble する。一方で `pop` / `dismiss` / `navigateBack` は embed 境界で stop する（embed 自身を閉じない）。これは「子が誤って親 stack を巻き戻す」事故を防ぐための明示的な仕様。詳細は [/concepts/screen-composition](/concepts/screen-composition) と [/reference/components/embed](/reference/components/embed)。

### P0-11 — Components overview：Composition カテゴリ

`docs/screens/json/reference/components.spec.json` overview / 対応 layout を編集：

- 既存セクションに加えて「**Composition**」群を新設
- 群の要素：`TabView`, `Embed`, （`include` は view type ではないため pseudo entry として配置 or 別パラグラフで言及）
- 既存の widget 群（Button / Label / Image / ...）から TabView を Composition 群に移動する場合は、移動先 URL は変えず（`/reference/components/tab-view`）見出しだけ分離

strings: `reference_components_section_composition_title` / `reference_components_section_composition_description`（en + ja）。

---

## 4. P0-1 `embed.json` 設計

```jsonc
{
  "component": "Embed",
  "description": {
    "en": "Embeds another screen as a region of this layout. The embedded screen owns its own ViewModel — independent from the parent. Use for tablet master/detail or dashboard panels.",
    "ja": "別の screen を親レイアウトの一領域として埋め込む view type。埋め込まれた screen は親とは独立した ViewModel を所有する。タブレット master/detail やダッシュボードのパネル用途。"
  },
  "usage": {
    "en": "Three composition primitives exist: `include` (codegen inlines, child shares parent VM), `TabView.tabs[].include` (one VM, multiple tab layouts), and `Embed` (child owns its own VM). Pick Embed when the inner screen has its own data flow.",
    "ja": "レイアウト合成には 3 つの手段がある: `include`（codegen で展開、VM は親と共有）、`TabView.tabs[].include`（VM 1 個、タブごとに別レイアウト）、`Embed`（子が独立した VM を所有）。子画面が独自のデータフローを持つときに Embed を選ぶ。"
  },
  "examples": [
    {
      "title": { "en": "Tablet master/detail", "ja": "タブレット master/detail" },
      "language": "json",
      "code": "{\n  \"type\": \"Embed\",\n  \"id\": \"detailPane\",\n  \"screen\": \"order_detail\",\n  \"params\": { \"orderId\": \"@{selectedOrderId}\" },\n  \"events\": { \"onOrderUpdated\": \"handleOrderUpdated\" },\n  \"navigationMode\": \"delegate\",\n  \"weight\": 1\n}"
    },
    {
      "title": { "en": "Dashboard panel (no params)", "ja": "ダッシュボードパネル (params なし)" },
      "language": "json",
      "code": "{\n  \"type\": \"Embed\",\n  \"id\": \"activityPane\",\n  \"screen\": \"recent_activity\",\n  \"navigationMode\": \"delegate\"\n}"
    },
    {
      "title": { "en": "Parent spec — structure.embeds[]", "ja": "親 spec — structure.embeds[]" },
      "language": "json",
      "code": "\"structure\": {\n  \"embeds\": [\n    {\n      \"regionId\": \"detailPane\",\n      \"screen\": \"order_detail\",\n      \"params\": { \"orderId\": \"@{selectedOrderId}\" },\n      \"events\": { \"onOrderUpdated\": \"handleOrderUpdated\" },\n      \"navigationMode\": \"delegate\"\n    }\n  ]\n}"
    }
  ],
  "attributes": {
    "screen": {
      "note": {
        "en": "Layout JSON filename in snake_case (no extension). Codegen converts to PascalCase for the generated View class; dynamic mode loads the JSON as-is.",
        "ja": "Layout JSON のファイル名 (snake_case、拡張子なし)。codegen は PascalCase に変換して生成 View クラス名にする。dynamic mode はそのままロード。"
      }
    },
    "params": {
      "note": {
        "en": "Flat dict (no nesting in v1). Keys must be camelCase. Values may be literals or `@{varName}` bindings. Child VMs that implement `applyInitParams(_:)` receive them — others silently ignore.",
        "ja": "フラット dict（v1 はネスト不可）。キーは camelCase 必須。値はリテラルか `@{varName}` バインディング。子 VM が `applyInitParams(_:)` を実装していれば受け取れる、しなければ無視。"
      }
    },
    "events": {
      "note": {
        "en": "Map of `on[A-Z]...` event name → parent VM handler name. Embedded VMs emit via the lib-provided `emit(name, payload)` helper — no spec declaration needed on the child side.",
        "ja": "`on[A-Z]...` イベント名 → 親 VM ハンドラ名のマップ。埋め込まれた VM は lib 提供の `emit(name, payload)` ヘルパで発行（子側 spec への宣言不要）。"
      }
    },
    "navigationMode": {
      "note": {
        "en": "v1 supports `\"delegate\"` only: child shares the parent's NavController/Router. `push` bubbles to the parent; `pop`/`dismiss`/`navigateBack` are bounded at the embed (cannot close the embed itself). `\"isolated\"` (private nav stack) is deferred to v1.5.",
        "ja": "v1 は `\"delegate\"` のみ。子は親の NavController/Router を共有する。`push` は親に bubble、`pop`/`dismiss`/`navigateBack` は embed 境界で stop（embed 自身は閉じない）。`\"isolated\"`（独立 nav stack）は v1.5 で対応予定。"
      }
    }
  },
  "relatedComponents": ["TabView", "View"]
}
```

属性順序は `docs/data/attribute-order.json` の `Embed` キー追加で制御可能（必要なら）。

---

## 5. P0-3 anatomy 更新の方針

`docs/screens/layouts/spec/anatomy.json` の `structure` を示すコード例（line 177 付近）に `embeds: []` を追加：

```diff
   "structure": {
     "components":         [],
     "layout":             {},
     "collection":         null,
     "tabView":            null,
+    "embeds":             [],     // Pattern 5 — Embed sub-screens (child owns its own VM)
     "decorativeElements": [],
     "wrapperViews":       [],
     "customComponents":   [ ... ]
   }
```

加えて、structure の field-by-field 説明セクションに `embeds[]` 行を 1 行追加：

> `embeds[]` — Screens to embed as regions of this layout. Each entry: `{ regionId, screen, params?, events?, navigationMode? }`. Layout JSON places the embed via `{ "type": "Embed", "id": <regionId>, ... }`. Cross-reference: Layout reuse patterns (5).

---

## 6. P0-4 layout-file 更新の方針

`docs/screens/json/spec/layout-file.spec.json` / 対応 layout で「Layout reuse / composition」のセクションに `Embed` を `include` / `TabView.tabs[].include` の隣に追記：

> **Three composition primitives**
>
> | Primitive | VM ownership | When to use |
> |---|---|---|
> | `include` | Shared with parent (codegen inlines) | Reuse a sub-layout that has no independent state. |
> | `TabView.tabs[].include` | Single parent VM drives all tabs | Persistent tab bar where tabs share state. |
> | `Embed` | Child owns its own VM | Master/detail panes, dashboard panels with independent data flow. |

---

## 7. P0-5 strings.json 追加キー（最小）

```jsonc
{
  "en": {
    // 自動生成ページ用の "displayName" / "description" は build:attrs が
    // 埋めるため strings 追加は不要（既存 component 群と同じ流れ）。
    //
    // anatomy / layout-file 側だけ追記:
    "spec_anatomy_structure_embeds_label": "embeds[]",
    "spec_anatomy_structure_embeds_desc": "Screens to embed as regions; each child owns its own ViewModel.",
    "spec_layout_file_composition_heading": "Three composition primitives",
    "spec_layout_file_composition_include": "include (codegen inlines, shared VM)",
    "spec_layout_file_composition_tabview": "TabView.tabs[].include (single VM, multiple tabs)",
    "spec_layout_file_composition_embed": "Embed (child owns its own VM)"
  },
  "ja": {
    "spec_anatomy_structure_embeds_label": "embeds[]",
    "spec_anatomy_structure_embeds_desc": "埋め込む screen の一覧。子は独立した ViewModel を所有する。",
    "spec_layout_file_composition_heading": "3 種類のレイアウト合成プリミティブ",
    "spec_layout_file_composition_include": "include（codegen 展開・VM 共有）",
    "spec_layout_file_composition_tabview": "TabView.tabs[].include（VM 1 個・タブ複数）",
    "spec_layout_file_composition_embed": "Embed（子が独立 VM を所有）"
  }
}
```

実際のキー名は spec/layout 側を編集しながら確定。`jsonui-localize` で漏れチェック。

---

## 8. 実行順序

1. P0-1: `docs/data/attribute-overrides/embed.json` を Write
2. P0-2: `cd jsonui-doc-web && npm run build:attrs`（既存 components の spec が並び替わる可能性 → diff 確認）
3. P0-3 → P0-4: spec/anatomy + spec/layout-file の Edit
4. P0-9: Concepts `screen-composition` 一式（spec / layout / VM / hook / route / ChromeViewModel NAV_CATALOG）
5. P0-10: Guides > navigation 末尾に Embed pop 境界 note
6. P0-11: Reference > Components overview の Composition カテゴリ追加
7. P0-5: 上記すべての追加キーを strings.json に反映
8. P0-6: `jsonui-localize` 実行（strings 漏れ確認）
9. P0-7: `mcp__jui-tools__jui_build`（warning=0）
10. P0-8: `mcp__jui-tools__jui_verify --fail-on-diff`（drift なし）
11. 開発サーバ起動 → 以下を目視確認（en/ja 切替・hydration 警告なし）:
    - `/reference/components/embed`
    - `/spec/anatomy`
    - `/spec/layout-file`
    - `/concepts/screen-composition`
    - `/guides/navigation`
    - `/reference/components`
12. commit 1 本にまとめる：`docs(embed): reflect library v1 (component reference + concepts + spec + navigation guide)`
13. push

---

## 9. リスク・要確認事項

| 項目 | 内容 | 対処 |
|---|---|---|
| build:attrs の副作用 | `attribute_definitions.json` が更新されていれば既存 component spec も再生成され diff が出る | 事前に `git status` 取得 → Embed 以外の diff があれば内容確認 |
| Embed の Reference 露出 | Embed は widget でなく composition primitive。components 一覧に並べる是非 | v1 は並べる（既に attribute_definitions に top-level として入っているため）。components.spec.json overview に「Composition」セクションを切るかは P1-3 で判断 |
| 言語切替 SSR | 直近の hydration バグ修正で `getDefaultString` パターンへ統一済。新規 page も auto-gen で同じテンプレに乗るため追加対応不要（auto-gen の VM template は library 側責任） | 開発サーバで `/reference/components/embed` の SSR HTML を確認、Japanese 文字列がサーバ出力に混入していないこと |

---

## 10. 完了条件（DoD）

- [ ] `/reference/components/embed` が en/ja 両方で表示される
- [ ] `/spec/anatomy` に `embeds[]` の説明が表示される
- [ ] `/spec/layout-file` に 3 composition primitives 表が表示される
- [ ] `/concepts/screen-composition` が表示され、サイドバー Concepts に項目が出る
- [ ] `/guides/navigation` 末尾に Embed pop 境界 note が表示される
- [ ] `/reference/components` overview に Composition カテゴリが表示され、Embed/TabView が分類されている
- [ ] `jui build`：warnings 0
- [ ] `jui verify --fail-on-diff`：drift 0
- [ ] 開発サーバで該当ページに hydration 警告が出ない
- [ ] commit / push 完了
