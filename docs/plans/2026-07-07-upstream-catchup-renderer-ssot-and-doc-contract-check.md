# 上流キャッチアップ — Renderer SSoT + doc contract check 提案

**起票**: 2026-07-07
**対象期間**: 上流 (jsonui-cli / SwiftJsonUI / KotlinJsonUI / ReactJsonUI) の直近 1 週間 (2026-06-30 〜 2026-07-07)
**目的**: 上流で完了した「Renderer SSoT 化」フェーズと、2026-07-07 に提案 → 同日中に実装完走した「ドキュメント整合性チェック (`jsonui-doc check`)」の内容を精査し、本サイトへ反映すべきコンテンツ / 実装対応を洗い出す
**ステータス**: ドラフト (実装未着手)
**関連プラン**: doc contract check の**コンテンツ反映**は本プラン §2 で概要のみ扱い、詳細は姉妹プラン `2026-07-07-doc-contract-check-site-reflection.md` に切り出し。上流実装完了を確認済みなので同プランは実行可能状態

**公開 repo ポリシー**: 本ドキュメントは公開リポジトリに含まれる。特定 consumer プロジェクトの名称・パス、内部 bug ID、上流の inbox/report 生ファイル名などは記載しない。上流の呼称 (SwiftJsonUI / KotlinJsonUI / ReactJsonUI / jsonui-cli / jsonui-test-runner) と、公開 API として観測可能な事実のみを扱う。

---

## 0. TL;DR (1 段落)

上流は「定義は SSoT、実装は 5 箇所並行」問題を **Renderer SSoT 化** で構造的に解消するフェーズを 07-02 週に完走した。3 本柱 — (A) conformance suite v2、(B) build 時 L1 正規化 (`normalizeLayouts`)、(C) 型付き属性抽出コード生成 (`jui generate attr-bindings`) — が **default 有効化まで到達済み** (07-03 の commit `e5c89a1`)。付随して KotlinJsonUI 2.9.3 (Compose deprecation 総ざらい) と rjui converter 25 本の typed-attribute リファクタが完了。**2026-07-07 に提案された doc contract check** (`jsonui-doc check`) も同日中に Phase 1〜3 (OpenAPI diff + DB スキーマチェッカー v1 + フルチェッカー型 + `--scope generated`) まで実装完走 (`document_tools/jsonui_doc_cli/check/`)。本サイトへの実装影響は **`jui sync_tool` 実行 + 通常ビルドで完結** (extensions は保護される、既に検証済み)。コンテンツ反映は **SSoT 系で 3 ページ小改訂 + doc contract check 系で 2〜4 ページ新規追加** — 詳細な段別プランは姉妹プランに切り出し済み。

---

## 1. 上流 1 週間の完了スコープ (概要)

### 1.1 Renderer SSoT 化 (07-02 〜 07-03、完走)

上流の課題: `shared/core/attribute_definitions.json` (属性 SSoT) と Layout JSON (UI 構造 SSoT) は単一ソースだが、それを解釈するレンダラーは iOS / Android / Web の 3 プラットフォーム × static/dynamic 2 モード = 5 箇所以上の並行実装で、属性追加のたびに同じ穴が複数箇所に生じていた。

対応した 3 本柱と本サイトへの関わり:

| 柱 | 上流での成果 | 本サイトへの実装影響 | 本サイトへのコンテンツ影響 |
|---|---|---|---|
| **A. Conformance suite v2** | attribute_definitions からの fixture 生成 + 3 プラットフォーム実行 + `jui conformance generate\|report\|compat-doc` 追加 | なし (テストは jsonui-cli 側で完結) | reference/cli-commands の `jui` サブコマンド一覧に `conformance` を追記 |
| **B. Build 時 L1 正規化 (`normalizeLayouts`)** | エイリアス → 正準名の書き換え・`$jui` marker 付与を `jui build` の配布ステップに寄せた。**default 有効** (07-03 `e5c89a1`) | `jui sync_tool` で反映 → 配布 layout の先頭に `"$jui": {"normalized": "L1", "schemaVersion": 1}` が付く。`attribute_validator.rb` の whitelist も同時に配布されるので **zero warnings 維持**。既に本サイトのローカル build で成功確認済み | concepts/one-layout-json に L0/L1/L2 の正規化レベル説明を追記 (作者は L0、配布は L1、runtime は L2 の三層) |
| **C. 型付き属性抽出コード (`jui generate attr-bindings`)** | Swift / Kotlin / Ruby の型付き属性パーサを attribute_definitions から機械生成。rjui は本サイトが消費している platform で、converter 25 本が **TypedAttributes bridge 経由**に統一済み | `jui sync_tool` が `lib/core/generated/attributes/*.rb` (vendored、多数) + `lib/core/typed_attributes.rb` bridge + `shared/core/*` を配布する。 | reference/attributes に「エイリアス / deprecated / 正規化マーカー」の見出しを追加 (v2 の SSoT モデルとして) |

### 1.2 KotlinJsonUI 2.9.3 — Compose deprecation migration (07-03、published)

Compose BOM 2026.03.00 / Kotlin 2.2.0 環境で残っていた deprecation を全解消し、`library` と `library-dynamic` を同一バージョンで publish。ライブラリ利用者側の影響:

- `Divider` → `HorizontalDivider` (drop-in rename)
- `TabRow` → `SecondaryTabRow` (indicator lambda が scope-member 版に変わる — 構造的変更)
- `ClickableText` → `Text` + `LinkAnnotation`
- `KeyboardOptions.autoCorrect` → `autoCorrectEnabled`
- `WindowWidthSizeClass` → `WindowSizeClass.isWidthAtLeastBreakpoint` (breakpoint API 差し替え)
- RenderScript blur → stack blur (pure-Kotlin) にリプレース
- codegen 側は generated Kotlin の `screenWidthDp` → `LocalWindowInfo.containerSize` 差し替え。**consumer Compose 床は BOM 2025.04.01 (Compose UI 1.8.0) 以上**

**本サイトへの関わり**: 本サイトは web 専用 (rjui) なので直接影響なし。ただし platforms/kotlin ページで「Compose only / XML は凍結」の方針を明記する必要がある (次項参照)。

### 1.3 XML / Android Views 系の正式凍結 (07-03)

上流ユーザー承認済み: KotlinJsonUI の **XML mode は maintenance-frozen**。新機能は Compose のみ。KotlinJsonUI 3.0 で削除候補。`kjui_tools` の XML codegen パスも同期して凍結。

**本サイトへの関わり**: platforms/kotlin ページの platform mode 記述で「Compose (dynamic + static) が正、XML は凍結・3.0 削除予定」と明示する。

### 1.4 Font weight mapping 配布パイプライン修正 (07-03)

`shared/core/font_weight_mapping.json` が consumer tool に未配布だった bug を修正 (`jui sync_tool` に配布ロジックを追加)。iOS で font weight が `.regular` に丸められる問題が上流ユーザーで発生していた。

**本サイトへの関わり**: sync_tool 実行で自動反映。追記コンテンツなし。

### 1.5 CI 基盤 (07-02 〜 07-03)

- KotlinJsonUI に `.github/workflows/ci.yml` 新設 (今まで push CI 無し)
- jsonui-cli で conformance-mobile / conformance CI が本番運用に (visual regression gate 付き)

**本サイトへの関わり**: なし (本サイトの deploy CI は既に運用中)。

---

## 2. 2026-07-07 doc contract check (**Phase 1〜3 実装完走**)

上流で提案 → 同日に実装完走した **`jsonui-doc check` コマンド** の要点 (現状):

- **狙い**: `docs/api/*.json` (swagger) と `docs/db/*.json` (DB モデル) がドキュメント生成の SSoT として機能している一方、実 backend との整合性を機械検証する手段が無かった。これを埋める。
- **設計原則**:
  - check (生産者) と generate html (描画者) を分離。`generate html` は接続情報のない環境でも常に成功する不変条件を守る。
  - チェッカーは「アダプタ型」(事実を出す) と「フルチェッカー型」(判定まで) の 2 段階プラグイン。ビルトインもプラグインと同じ契約に乗る。
  - 結果に `confidence: proof | metadata | sampled` を必須で持たせる。
- **実装済み (`document_tools/jsonui_doc_cli/check/` 配下)**:
  - `openapi_diff.py` + `openapi_normalize.py` — OpenAPI diff チェッカー (Phase 1)
  - `db_schema/` — DB スキーマチェッカー v1 (MySQL / PostgreSQL / SQLite、SQLAlchemy inspector 経由 + adapter 型 `dump_command` 対応)。`type_families.json` (方言別マッピング表) 同梱 (Phase 2)
  - `runner.py` の `_run_full_checker` — フルチェッカー型プラグインサポート (Phase 3)
  - `openapi_diff.py` の `scope=generated` — DTO 生成対象パスに絞った差分検出 (Phase 3)
  - `report.py` + `cli.py::cmd_check` + `generate html` の整合性ページ描画
  - テスト: `test_check_report` / `test_check_runner` / `test_openapi_diff` / `test_db_schema_check` / `test_generate_html_checks` / `test_project_config`
- **Phase 4 のみ未実装**: Firestore / DynamoDB 等の非 RDB — 着手条件つき (実プロジェクトの要望駆動) で別プランに切り出し済み

**本サイトへの関わり (現時点)**:

- **実装反映**: なし (本サイトは `docs/api/` / `docs/db/` を持たないため `jui.config.json` に `checks` を書かない。§1.4 参照)
- **コンテンツ反映**: **実行可能** — 姉妹プラン `2026-07-07-doc-contract-check-site-reflection.md` に反映段 1〜3 を段別に定義済み。上流の Phase 1〜3 が既にリリース済みなので、本サイトの反映段も 3 段を **順次または一括** で実行可能な状態

---

## 3. sync_tool + 本サイト実装対応の可否判断

### 3.1 sync_tool の必要性 → **必要**

本サイトの `jsonui-doc-web/rjui_tools/` は 06-22 のコミット時点で in-repo 化した (前回 PR)。**その時点の rjui_tools は Renderer SSoT 完走前**なので、以下が入っていない:

- `lib/core/generated/attributes/*.rb` (型付き属性 vendor、多数)
- `lib/core/typed_attributes.rb` (bridge)
- `lib/core/normalization.rb` (L1 正規化ロジック)
- `shared/core/*` (font weight mapping ほか SSoT 資源)
- 各 converter (25 本) の typed-attribute-access 版
- `attribute_validator.rb` の `$jui` marker whitelist

### 3.2 sync_tool 実行時の差分見込み

上流 dev checkout を source にした sync_tool のドライラン結果 (実施済み、成果物は revert 済):

| 分類 | ファイル数 |
|---|---|
| copied (新規) | 43 |
| updated (差分) | 42 |
| preserved-in-extensions (本サイト固有 converter / attribute_definitions) | 12 (**保護される**) |
| shared-core (SSoT 資源) | 1 |

**extensions が保護されることは実測確認済み** — `jsonui-doc-web/rjui_tools/lib/react/converters/extensions/` の 7 converter + `attribute_definitions/` の 5 JSON はいずれも sync 対象外として preserved-in-extensions カウントに入る。

### 3.3 sync 後の build 検証

sync_tool 実行直後の `jui build --web-only` は success + zero warnings で完了し、以下が確認できた:

- 配布 layout (`src/Layouts/*.json`) の先頭に `"$jui": {"normalized": "L1", "schemaVersion": 1}` marker が付与される (default で L1 正規化が走っている証拠)
- attribute validator が `$jui` を known key として認識し警告を出さない
- 配布統計: 125 layout / 12 style / 2 resource / 15 image、Protocol sync も緑
- 冪等性 (build 2 回目で追加差分なし) は概念上 upstream の受入条件になっており、実プロジェクト検証は 07-03 の final-verification protocol で完走している

### 3.4 実装対応の要否 → **`sync_tool` + `jui build` + コミット** で完結

本サイト固有の実装コードを書く必要はない。手順は 4 ステップ:

1. `jui sync_tool` を実行 (`~/.jsonui-cli` を source にする)
2. `jsonui-doc-web` で `jui build --web-only` を実行し zero warnings 確認
3. `git status` を確認、意図差分 (rjui_tools 全般 + shared/ + generated/) のみであることを検査
4. 意図差分をまとめてコミット (extensions/ は変更されていないことを diff で最終確認)

**リスク**: `rjui_tools` 内の非 extensions ファイルは前回コミットで in-repo 化しており、`.gitignore` は selective ignore (`vendor/bundle/`, `.bundle/`, `tmp/`, `log/`) のみ。sync による更新はそのまま tracked になり、公開 repo に含まれる。上流公開部分 (jsonui-cli 由来) なので情報漏洩リスクは無い。

---

## 4. サイトコンテンツ反映プラン (ページ別)

### 4.1 反映する (3 ページ、小改訂)

#### `reference/cli-commands.spec.json`

- `jui` サブコマンドの説明 (現状「init / generate / build / verify / sync_tool」) に **`conformance`** を追記する。役割: 「attribute_definitions から fixture を生成し、3 プラットフォームでの実行結果マトリクスを出力する」の 1 行相当。
- `jui generate` の説明に **`attr-bindings`** を子コマンドとして追記 (Swift / Kotlin / Ruby の型付き属性抽出コードを attribute_definitions から生成)。
- 修正規模: 文字列キー追加 2 セット (en+ja)、レイアウト構造変更なし。
- 見送り: 個別サブコマンドごとの詳細ページ化は non-goal (本サイトの CLI ref は「6 CLI の役割紹介」レイヤーに徹する既存方針)。

#### `concepts/one-layout-json.spec.json`

- 「1 つの Layout JSON が iOS / Android / Web に配布される」既存の説明に、**L0 / L1 / L2 の正規化レベル** を 1 セクション追加。
  - L0 = 作者が編集する原本 (`docs/screens/layouts/`)。手書き surface。
  - L1 = 配布時に `jui build` がエイリアスを正準名に書き換え、`$jui` marker を付けたもの。各プラットフォームの codegen が消費する。
  - L2 = runtime (hotloader / dynamic mode) が L1 に style merge + include 展開 + platform filter を適用した最終形。
- `normalizeLayouts` が default 有効であることに触れる (opt-out flag は `"normalizeLayouts": false`、experimental 期間終了済み)。
- 修正規模: 新規セクション 1 + strings 5-8 個。

#### `platforms/kotlin.spec.json`

- **Platform Mode Policy** セクションを追加 or 既存に追記:
  - Compose (static + dynamic) が正
  - XML / Android Views は maintenance-frozen、KotlinJsonUI 3.0 で削除候補
  - 新機能・仕様変更は Compose のみに載る
- Compose 消費者への **床要件**: BOM 2025.04.01 (Compose UI 1.8.0) 以上。KotlinJsonUI 2.9.3+ の使用を前提。
- 修正規模: 新規セクション 1 + strings ~6 個。**既存の platform 比較記述は変更しない**。

### 4.2 反映する (doc contract check、姉妹プラン参照)

**上流 Phase 1〜3 が実装完走済み**なので、姉妹プラン `2026-07-07-doc-contract-check-site-reflection.md` の反映段 1〜3 を実行する。本プランからは概要のみ列挙:

- **新規 2 ページ** — `concepts/implementation-contract-check` + `guides/verifying-implementation-against-docs`
- **既存改訂** — `reference/cli-commands` の `jsonui-doc` 説明拡張、`guides/api-data-models` に next-reads 追加
- **段 2 で追加検討** — `concepts/data-models-from-db` + `guides/writing-db-models` (現サイトの DB モデル文書化空白を埋める)
- **公開 repo hygiene** — 上流の実地検証コーパスの consumer 名 / 具体スキーマ語彙は本サイトに一切持ち込まない (姉妹プラン §7 に詳細)

修正規模 (段 1〜3 一括): 新規 4 ページ (最大) + 既存 2〜3 ページ改訂 + strings ~400 キー。

### 4.3 反映しない (この時点で読者価値が薄い)

#### Renderer SSoT の内部詳細に踏み込むページの新設

Renderer SSoT 化は「内部アーキテクチャの投資」であり、読者が新機能として消費するものではない (L0/L1/L2 は既存 concept にサブセクションで足りる)。conformance suite も同様に内部品質保証 — reader 向けページを増やす必要は無い。

### 4.3 更新しない (影響ゼロ)

- `guides/api-data-models` — swagger 駆動 codegen の状態は 05-27 に反映済みで変わっていない
- `concepts/data-models-from-openapi` — 同上
- `reference/mcp-tools` — Group E (API Model Discovery) は反映済み。新規 group の追加なし
- `reference/attributes` — v1 スコープでは「エイリアス / deprecated / marker」の説明追加は保留 (SSoT の内部モデルなので、reader 側にとっての価値が薄い。conformance report が公開 doc として出るタイミングで再検討)

---

## 5. 実行順序 (推奨)

Phase 0 と Phase 1 は独立、Phase 2 は Phase 0 が完了してから (localize がある方が strings 検証が確実なため)。Phase 3 は姉妹プランを実行するステップで、Phase 2 の後に (または並行して) 走らせる。

- **Phase 0 — 上流同期 (実装)**
  1. `jui sync_tool` 実行、意図差分のみを確認
  2. `jsonui-doc-web` で `jui build --web-only` 実行、zero warnings 確認
  3. `jui verify --fail-on-diff` 実行、drift 無しを確認 (可能なら)
  4. 変更をコミット (メッセージ例: `chore(rjui_tools): sync to Renderer SSoT — L1 normalization + typed attrs + shared/core`)
- **Phase 1 — deploy 検証**
  1. main へ push → CI deploy 完走
  2. サイトの `/` (top / CTA インタラクティブ性)・`/concepts/one-layout-json`・`/reference/cli-commands` を目視
  3. 配布 layout `.json` の `$jui` marker が正しく効いていること (副次確認)
- **Phase 2 — SSoT 系コンテンツ反映 (§4.1 の 3 ページ)**
  1. jsonui-conductor → jsonui-define で 3 ページの spec を編集
  2. jsonui-localize で strings.json に追加キーを en+ja 登録
  3. `jui build` + `jui verify` の gate を通す
  4. 目視検証 (該当 3 ページ) → コミット → deploy
- **Phase 3 — doc contract check 系コンテンツ反映 (姉妹プラン §2〜§4)**
  1. 姉妹プラン `2026-07-07-doc-contract-check-site-reflection.md` を open
  2. 反映段 1〜3 を 1 セッションで一括、または段別に分割実行
  3. 各段の受け入れ条件 (姉妹プラン §6) を満たしてから次段へ
  4. **段別デプロイの場合**: 段 1 → deploy → 段 2 → deploy → 段 3 → deploy。段 1 だけでリリース可能な設計になっているので、負荷分散したい場合に有効
  5. **一括デプロイの場合**: 段 1〜3 の spec / strings / NAV_CATALOG を全部書いてから 1 コミット、または論理単位 (2〜3 コミット) で push
  6. Phase 2 と並行実行しても矛盾しない (改訂対象ページが基本的に別)。ただし `reference/cli-commands` は両方が触るので、**編集は sequential に行う** (Phase 2 → Phase 3 の順)

---

## 6. 受け入れ条件

- Phase 0 完了時:
  - rjui_tools が上流 SSoT 完走版に揃っている (`lib/core/generated/attributes/*` / `typed_attributes.rb` / `normalization.rb` / `shared/core/*` が存在)
  - `jui build --web-only` zero warnings
  - 配布 layout に `$jui` L1 marker が付与されている
  - extensions/ 配下 (7 converter + 5 attribute_definitions JSON) が sync 前後でバイト一致
- Phase 1 完了時:
  - deploy CI green
  - 3 ページ (top, one-layout-json, cli-commands) の live 動作確認 (200 応答 + JS interactivity)
- Phase 2 完了時:
  - 3 ページ (cli-commands, one-layout-json, platforms/kotlin) が新セクションを含む
  - strings.json 追加キーの en+ja が揃っている
  - `jui build` zero warnings / `jui verify --fail-on-diff` pass
  - live サイトで新セクションが表示され、CTA / nav が回帰していない
- Phase 3 完了時 (姉妹プラン §6 に準拠):
  - 反映段 1: `concepts/implementation-contract-check` + `guides/verifying-implementation-against-docs` が 200 応答 + interactive、NAV_CATALOG から辿れる、`reference/cli-commands` の `jsonui-doc` 説明が checker 併記に更新
  - 反映段 2: `concepts/data-models-from-db` + `guides/writing-db-models` (要検討で採用時) が 200 応答、`verifying-implementation-against-docs` に DB 節が追加
  - 反映段 3: `verifying-implementation-against-docs` にフルチェッカー節が追加、`api-data-models` に `--scope generated` 節が追加
  - 全段共通: 公開 repo hygiene grep gate をパスしている (姉妹プラン §7.3)

## 7. non-goals (このプランで扱わないこと)

- 上流 doc contract check Phase 4 (Firestore ほか) のサイト反映 — 上流着手待ち、着手時に姉妹プラン §5 から枝分かれ
- `reference/attributes` への SSoT 内部モデル (エイリアス / deprecated / marker) 追記 — v2 で再検討
- 個別 CLI サブコマンドのページ化 — 本サイトのレイヤー方針を変更しない
- KotlinJsonUI XML mode の removal 対応 — サイトは既に Compose を主軸に記述している
- 本サイト自体への `jsonui-doc check` 有効化 — 本サイトは `docs/api/` / `docs/db/` を持たないため対象外 (姉妹プラン §1.4)

## 8. 参考 — 反映不要と判断した理由 (簡潔メモ)

- **Renderer SSoT の内部詳細** (attr_codegen emitter の rev2 セマンティクス、L1 alias fallback、canonical_only mode など): これは jsonui-cli 開発者向けの詳細で、レンダラー消費者にとっての UX 変化ではない。サイトの読者層 (JsonUI アプリ実装者) には抽象度が合わない。
- **Conformance suite の細目** (fixture 分類 assertable/visual/untestable、baseline hash 運用など): 上流の QA インフラで、公開 doc の対象外。
- **KotlinJsonUI 2.9.3 の deprecation 個別対応表**: KotlinJsonUI 側の CHANGELOG で追跡する。本サイトは platform 選定の指針を書く役割なので、床要件と mode policy に絞る。
