# Swagger 駆動 Data Model 機能 — ドキュメント追加計画

**日付**: 2026-05-27
**ステータス**: ドラフト v3（MCP + Agents integration plan `2026-05-27-mcp-agents-api-model-integration.md` を反映）
**対象**: 読者向けに **新規追加 / 既存改訂** するドキュメントページ全部
**前提**: 上流の 3 つの計画
- `jsonui-cli/docs/plans/2026-05-27-swagger-data-model-generation.md` v3（DTO + Domain 二層 codegen 本体）
- `jsonui-cli/docs/plans/2026-05-27-swagger-codegen-path-filter.md` v2（path / schema filter）
- `jsonui-cli/docs/plans/2026-05-27-mcp-agents-api-model-integration.md`（MCP Group E + agents/rules 更新）

**スコープ外**: サイト本体のコード / 設定変更（→ `2026-05-27-swagger-models-site-modifications.md` を参照）

---

## 0. 何を読者に伝えたいか — 1 段落

`jui build` が OpenAPI ファイルを読んで、3 platform 同型で **DTO（毎ビルド全文再生成、wire shape 1:1）** と **Domain scaffold（初回のみ生成、user 領域）** を吐くようになった。これにより 3 platform で同じ schema を 3 回書く drift が消える。Domain は薄いラッパで proxy / computed property を使うぶんだけ書き足す形式。共有 swagger を複数 app で消費する場合は **`api.schemas.include_paths` 等で「実際に呼ぶ endpoint から到達する schema だけ」に絞れる**（残り schema は dead code として吐かれない）。MCP には **Group E: API Model Discovery** (`list_api_specs` / `list_api_models` / `preview_api_model_sync`) が追加され、agent が swagger 状況を把握 / filter を dry-run できる。v1 では format-aware mapping / oneOf / multi-file `$ref` / YAML / クライアント関数生成は未対応で、該当パターンは ERROR halt する（silent fallback なし）。

---

## 1. 新規ページ A — Concept article

### 1.1 spec / layout

- `docs/screens/json/concepts/data-models-from-openapi.spec.json`
- `docs/screens/layouts/concepts/data-models-from-openapi.json`

### 1.2 章立て（H2 単位、~9-min read）

| # | H2 | 中身 |
|---|---|---|
| 1 | The drift problem | 3 platform で同じ schema を 3 回書く現状を絵 + 短い説明で |
| 2 | DTO + Domain — two layers, one boundary | 役割表（オーナー / 生成タイミング / 中身）を 3 列で。**ファイル境界 = codegen / user 境界**が肝 |
| 3 | What the DTO looks like | Swift / Kotlin / TS の `UserDto` を 3 タブで（Tabs view か並列 CodeBlock） |
| 4 | What the Domain scaffold looks like | 同じく 3 platform、初回 scaffold の 5-7 行コード |
| 5 | The customization zone | user が proxy / computed / stored property / Date 変換を書き足す例（Swift で 1 つ完全例） |
| 6 | Scope what gets generated — path filter | "shared swagger は 1 つでも、app ごとに使う endpoint だけ codegen" の概念を 1 段落 + `include_paths` の最短例 1 つ。詳細はガイド B に委譲 |
| 7 | Discovery from your agent — MCP Group E | **新規** — `list_api_specs` / `list_api_models` / `preview_api_model_sync` 3 tool の役割を 1 段落ずつ。filter 変更前に preview で kept/excluded を JSON で見られる旨を強調 |
| 8 | Lifecycle — what happens on every build | DTO 再生成 / Domain skip / filter 適用 / orphan handling / drift check の 5 つを箇条書き |
| 9 | What v1 does NOT support | format-aware mapping / oneOf / discriminator / multi-file `$ref` / YAML / クライアント関数 / 直接自己参照 — すべて **ERROR halt** であることを明記 |
| 10 | Where to go next | NextRead cards: ガイド B / 既存 `concepts/why-spec-first` / 既存 `concepts/one-layout-json` |

### 1.3 cross-link 元

新ページを各所からリンクする:

- `concepts/why-spec-first` — "spec が source-of-truth" の話の延長線として 1 段落追加
- `concepts/one-layout-json` — "...そして API schema も 1 つの真実から" 1 段落追加
- 既存 `home` の "featured" カードに含めるか検討（既存 3 枚に押し込まず、"What's new" ribbon の方が自然）

### 1.4 strings

namespace: `concepts_data_models_from_openapi_*`（推定 95-120 キー、en + ja）

主要ブロック:

- セクション見出し × 10（path filter + MCP discovery 節を含む）
- セクション本文 × 10
- 表の見出し / 行（DTO vs Domain 表、ERROR halt 一覧表、filter 評価順表、Group E tool 一覧表）
- code block ラベル（Swift / Kotlin / TS、`include_paths` の最短例、`preview_api_model_sync` JSON 出力 example）
- NextRead カード × 3

---

## 2. 新規ページ B — Guide article

### 2.1 spec / layout

- `docs/screens/json/guides/api-data-models.spec.json`
- `docs/screens/layouts/guides/api-data-models.json`

### 2.2 章立て — Cookbook 形式

| # | H2 | 内容 |
|---|---|---|
| 1 | Set up `docs/api/` | swagger ファイルを置く場所 + `jui.config.json` の `api_directory` 設定。共有 swagger を上向きパス (`../docs/api`) で参照する例も |
| 2 | Add a new schema → run build → write proxies | end-to-end 例（User schema を 1 件追加、build を回し、Domain で `displayName` proxy を書く） |
| 3 | Scope what gets generated — path / schema filter | **新規** — `api.schemas.{include_paths, exclude_paths, include_schemas, exclude_schemas}` の使い分け。共有 swagger を複数 app で消費する典型例（汎用 path `/api/auth/*` / `/api/users/*` / `/api/admin/*` で示す。**memory rule に従い実 consumer 名は使わない**）。glob `*` は `/` を含む、case-sensitive、`**` 無し。filter で 0 schema になったときの WARNING + orphan prune 挙動 |
| 4 | Two levels of `skip_domain` | **新規** — schema 側 `x-jui-skip-domain: true` (全 consumer 共通) と app 側 `api.schemas.skip_domain: [...]` (per-app overlay) の OR 評価。どちらを使うかの選び方 |
| 5 | Preview filter changes from your IDE — MCP `preview_api_model_sync` | **新規** — `mcp__jui-tools__preview_api_model_sync` を agent から呼ぶと `kept_schemas` / `filtered_out` / `skip_domain_matches` / `halts` が JSON で返る。CLI 等価は `jui g api --dry-run`。filter 設定を agent に提案させる時のループを 1 段落 |
| 6 | Inspecting current state — `list_api_specs` / `list_api_models` | **新規** — 「今 swagger は何件？生成された DTO は？orphan は？」を agent / CLI から確認する 2 tool。`list_api_models` の orphans 配列が `jui lint-generated --fail-on-orphan` と同じ情報を返す旨 |
| 7 | DTO vs Domain — which return type to use from a Repository | **新規** — Repository method の `returnType` が swagger schema 名のとき、自動的に Domain 型に解決される。raw DTO を返したい場合は明示的に `"UserDto"` と書く必要がある。コード例 1 つ（Swift） |
| 8 | Customize Domain — proxies, computed, Date conversion | Swift の 4 パターン例（単純 proxy / 型変換 / 派生 / stored property） |
| 9 | Choose the Android serializer | `moshi` (default) / `kotlinx` / `none` の比較表 + 採用基準 + Moshi 採用時の ksp プラグイン追加手順 |
| 10 | Choose the Web case convention | `snake_case` (default ゼロコスト) vs `camelCase` (runtime 変換) の選び方 |
| 11 | Migrating hand-written models | 1 schema ずつ段階的に。`x-jui-skip-domain` / `api.schemas.skip_domain` で除外する方法（§4 の選択肢を逆引きで再掲） |
| 12 | Reserved word collisions | `public` / `private` / `class` などが enum / property 名に出てきた時の挙動（自動 escape） |
| 13 | Cycles — what fails, what's allowed | direct self-ref は ERROR halt / collection 経由 (`children: [Self]`) は OK の対比 |
| 14 | Drift detection in CI | `jui verify --fail-on-diff` を CI に挟む例。filter を変えた CI と build 側の semantic が対称であることに 1 段落 |
| 15 | When the build halts — error table | v1 で halt する 6 ケース + 推奨対処（filter は halt しないので別表扱い、これは「filter は lenient、parser は strict」の非対称を読者にも伝える） |

### 2.3 strings

namespace: `guides_api_data_models_*`（推定 140-180 キー、en + ja、§3 / §4 / §5 / §6 / §7 新章の分が増えた）

サブ namespace:

- `guides_api_data_models_filter_*` — §3 path/schema filter 章（評価順表 / glob 記法 / 0 schema 時の挙動 / 汎用 path 例 2-3 件）
- `guides_api_data_models_skip_domain_*` — §4 二層 skip_domain 章（比較表 / OR 評価の擬似コード 1 行）
- `guides_api_data_models_mcp_preview_*` — §5 preview_api_model_sync 章（呼び出し例 / JSON 出力の各フィールド説明 / agent ループ例）
- `guides_api_data_models_mcp_discovery_*` — §6 list_api_specs / list_api_models 章（2 tool の入力 / 出力 / orphan 検出例）
- `guides_api_data_models_return_type_*` — §7 Repository return type 章（auto-resolve ルール / explicit DTO 指定の書き方 / Swift code 例）

### 2.4 cross-link

- `learn/installation` から「Android で Moshi を使う場合は §9 参照」リンク
- `learn/first-screen` の Repository 例から「return type が `User` の Domain 型だった場合」のリンクは §7 へ
- `reference/cli-commands` の `jui g api` 行から本ガイド §5 (preview) へ
- `reference/mcp-tools` の Group E 各 tool 詳細から本ガイド §5 / §6 へ
- `tools/agents` から「conductor が起動時に list_api_specs を呼ぶ」リンクで §6 へ

---

## 3. Reference 追記

### 3.1 `docs/screens/json/reference/cli-commands.spec.json`

- `jui g api` 行追加（→ site-modifications plan §4.1 で詳細）
- `jui ls api-specs` / `jui ls api-models` 新 `ls` group として追加（→ site-mod §4.1）
- `jui lint-generated --fail-on-orphan` 追加
- `jui verify --fail-on-diff` の DTO byte-equal 比較を追記

### 3.1.5 `docs/screens/json/reference/mcp-tools.spec.json` — Group E 追加

site-mod plan §3 と整合。3 件のセクションを既存 D の後ろに追加:

- `list_api_specs` — 入力（`project_dir?`）/ 出力（`{ api_directory, files: [...]}` ）/ use case 1 行
- `list_api_models` — 入力（`platform?`, `project_dir?`）/ 出力（per-platform `dto_files` / `domain_scaffolds` / `orphans`）/ use case 1 行
- `preview_api_model_sync` — 入力 / 出力（`kept_schemas` / `filtered_out` / `skip_domain_matches` / `halts`）/ use case 1 行

各 tool の "params" CodeBlock は実際の zod schema / JSON schema を貼る（agent が機械読みする想定）。

### 3.2 新規 reference page — OpenAPI ↔ native 型マッピング表（任意、P2）

- spec: `docs/screens/json/reference/openapi-type-mapping.spec.json`
- 中身: 上流計画 v3 §4 の表を 3 platform 列で 1 枚に
- 加えて vendor extension namespace (`x-jui-skip-domain` / `x-jui-name` / `x-jui-deprecated-reason`) の一覧
- 加えて conformance 動的決定ルール（v3 §2.4）
- 加えて `jui.config.json` `api.schemas.*` の **設定 reference 表**（5 キー × type / default / glob 可否 / 説明）
- 必要性は中。本機能を実装する読者が type 変換 / 設定キーを頻繁に参照する想定。

P0 着地後の延長 PR でも可。判断: P0 ページの該当節で簡易表を埋めれば 1 ページとしては不要。**reference は省略してガイド側に簡易表を埋め込む方針を推奨**（DRY、メンテ点 1 つ）。ただし `api.schemas.*` の設定 5 キーは consumer が探しに来る対象なので、ガイド B §3 の冒頭に表形式で必ず置く。

### 3.3 MCP tool reference

site-modifications plan §3 の通り **v1 では更新不要**（上流が MCP に乗せない方針のため）。

---

## 4. 既存ページの軽微な改訂

| ページ | 変更 |
|---|---|
| `tools/cli.spec.json` | generate 群の本文に `api` サブコマンド追加 1 文。新 `ls` group の説明を 1 文。「`api.schemas.*` filter を honor」と 1 行追記 |
| `tools/mcp.spec.json` | Group E 追加に伴い groups 数 4 → 5、tool 数 30 → 33。section_groups_body / section_catalog_body / section_what_body を更新 |
| `tools/agents.spec.json` | 各 agent (conductor / define / implement / debug / ground) が新 MCP tool / 新ルールに従う旨を 1 行ずつ追記。実 agent 内部の改修は `JsonUI-Agents-for-claude` 側で本サイトの責務外、ただし読者には「conductor が起動時に API 状況を把握する」「implement が DTO vs Domain 規約を持つ」が見える状態にする |
| `tools/doc.spec.json` | 「`document_tools/.../swagger.py` のロジックが core に移植され `jui g api` が継承」1 文 |
| `learn/installation.spec.json` | "Android で Moshi serializer を使う場合は ksp プラグイン必要" の参考 1 行 + ガイド B §9 リンク |
| `concepts/why-spec-first.spec.json` | "spec の射程に API schema も含まれ、さらに consumer ごとに使う endpoint だけ絞れる" 1 段落（concept A へのリンク付き） |
| `concepts/one-layout-json.spec.json` | 同上、1 段落追加 |
| `home.spec.json` ("What's new" ribbon) | "May 2026" エントリ 3 件追加: (1) DTO + Domain 本体 → concept A、(2) path filter → ガイド B §3、(3) MCP Group E discovery → concept A §7。3 件まとめにせず分けて出すことで discovery 機能の存在感を担保 |
| `ChromeViewModel.ts NAV_CATALOG` | concepts セクション + guides セクションに新エントリ |

---

## 5. 既存 stale 表現の修正（本機能と同時に整理）

`tools_mcp_section_catalog_body` の "live Swagger / tool manifests" は現行挙動を表していない（MCP catalog は手書きで、live swagger からは生成していない）。本機能ランディングを機に訂正:

- en: 旧 "Rendered from the live Swagger / tool manifests." → 新 "Hand-authored catalog kept in sync with the MCP server's 5-group tool list (33 tools, currently — A:8 / B:6 / C:7 / D:9 / E:3)." の系統に書き換え（実数値は site-mod plan §6 の audit で確定）
- ja: 同様に "実行時の Swagger / manifest から生成" を訂正

**注意**: この訂正は新機能とは独立だが、Swagger に言及するこのタイミングで誤解を残すべきでない。site-mod plan §6 と数値・group 数を必ず揃える。

---

## 6. コードサンプル — 単一情報源化

3 platform DTO / Domain のコードブロックは concept A §3 + §4 で 1 度だけ書き、guide B からはリンクで参照。重複させない（更新時の drift 防止）。

filter config (`jui.config.json` の `api.schemas` ブロック) のサンプルも同様: ガイド B §3 で **1 度だけ完全例を書き**、それ以降の章は差分 hunk だけ示す。これも drift 防止。

ファイル化:

- `docs/screens/styles/code-samples/swagger-user-dto-swift.swift`（コードだけの ref 用、必要なら）
- 同様に kotlin / ts

ただし既存サイトでは code block を直接 spec / strings に書く慣習なので、新規ファイル化は **しない方針を推奨**。spec 内 `CodeBlock` cell に直接埋める。

---

## 7. テスト

新規 spec ページ 2 件分に対して:

- screen test（visibility / セクション数 / NextRead カード数）
- 既存 chrome sidebar test に新エントリ追加チェック（NAV_CATALOG count assertion）
- jsonui-localize green
- jui build 0 warnings
- jui verify 0 drift

詳細は `jsonui-test` agent に委譲。

---

## 8. ローカライズ

- en と ja を必ず同時に書く（jsonui-localize はキーの存在 / 一致を検証するが、文意は人間レビュー）
- ja は概念用語を `concepts/screen-composition` の既存表現と揃える（"派生 schema" / "wire shape" / "DTO" / "Domain" など）
- 「Domain scaffold」は ja でも "Domain scaffold" のまま（"足場" は誤誘導）
- 「path filter」「include_paths」は ja でも英表記のまま（jui.config.json のキー名と一致する必要があるため）
- 「transitive resolve」「reachable」は ja で "推移的解決" "到達可能" を使う（数学用語側に倒す）
- "drift" は ja でも "drift" のまま既存ページが揃えてある

---

## 9. 着地順序

1. **上流ランディング待ち**: 3 計画書すべて (v3 本体 / path-filter v2 / MCP+Agents integration) が `jsonui-cli` + `jsonui-mcp-server` + `JsonUI-Agents-for-claude` の各 main に着地。一部だけだと文章と挙動がずれる
2. consumer 側に配信完了確認（site-mod plan §1 の 10 step チェックリスト）
3. site-modifications plan §3 〜 §6 を先行 PR で消化（MCP catalog Group E / CLI ref / strings の正確性を先に整える）
4. concept A spec → layout → VM → hook → page.tsx（MCP discovery 章 §7 を含む）
5. guide B spec → layout → VM → hook → page.tsx（filter §3 / skip_domain §4 / MCP preview §5 / MCP discovery §6 / return type §7 を含む）
6. `ChromeViewModel.NAV_CATALOG` 更新（site-mod plan §7）
7. 既存ページの軽微改訂（§4）— `tools/agents.spec.json` の改訂を含む
8. home "What's new" ribbon に新エントリ追加（DTO + Domain / path filter / MCP discovery の 3 件）
9. jsonui-localize → 全 strings 完成
10. jui build → 0 warnings / jui verify → 0 drift
11. screen test 追加 → CI 緑 → merge

---

## 10. やらないこと

- demo 用 swagger ファイルを `docs/api/` に置く → サイト本体が消費しないのにあるとノイズ。code-block で代替（concept A / guide B 内）
- 特定 consumer プロジェクト（sampleapp / otta / mobile-app 等）の実際の path / schema 名を例に使う → memory rule（`feedback_no_local_project_refs.md`）により禁止。`/api/auth/*` / `/api/users/*` / `/api/admin/*` 等の汎用例で示す
- canonical agents/rules（`JsonUI-Agents-for-claude/.claude/agents/jsonui-*.md` および `jsonui-rules/*.md`）を本リポジトリで編集する → 上流の責務。本サイトでは "agents が何を知っているか" を読者に伝えるだけ
- v2 機能（format-aware / oneOf / multi-file / クライアント関数生成 / `jui sync_agents`）を解説する → "What v1 does NOT support" 節で名前だけ挙げる
- 上流 plan の Open Questions を読者に見せる → 内部議論であって最終仕様の説明ではない
- filter の v1 plan で議論された `api.skip_domain` 旧 alias / phantom deprecation → 上流 v2 で削除済みなので一切触れない
- MCP server の TypeScript 実装詳細（`src/tools/api/*.ts` のコード）を読者に見せる → tool 利用者には不要。input / output schema だけ示す
- ライブラリ実装の internals（`SchemaIR` / `atomic_write_text` / `schema_filter.py` / generator アーキ）を読者に見せる → 消費者には不要

---

## 11. 関連

- 姉妹計画: `docs/plans/2026-05-27-swagger-models-site-modifications.md`
- 上流 (本体): `jsonui-cli/docs/plans/2026-05-27-swagger-data-model-generation.md`（v3）
- 上流 (path filter): `jsonui-cli/docs/plans/2026-05-27-swagger-codegen-path-filter.md`（v2、Phase 1.5）
- 上流 (MCP + Agents): `jsonui-cli/docs/plans/2026-05-27-mcp-agents-api-model-integration.md`
- 前例（同じ規模感の add-doc PR）: `docs/plans/2026-05-14-embed-doc-update.md`
- 既存類似 concept ページの構造参考: `docs/screens/json/concepts/screen-composition.spec.json`
- Memory: `feedback_no_local_project_refs.md`（sampleapp / otta 等の local project 名を文章に使わない）
