# doc contract check — サイト反映プラン (実行可能)

**起票**: 2026-07-07
**対象**: 上流で 2026-07-07 に Phase 1〜3 を実装完走した「ドキュメント整合性チェック (`jsonui-doc check`)」機能一式を、本サイトへ反映するためのコンテンツ計画
**ステータス**: **実行可能** — 上流 Phase 1〜3 の実装が `document_tools/jsonui_doc_cli/check/` に着地済み。Phase 4 (Firestore 等) のみ着手条件付きで待機
**関連**: `2026-07-07-upstream-catchup-renderer-ssot-and-doc-contract-check.md` で「反映は本プランに切り出す」と宣言済み。§2 で SSoT 系との実行順序を規定

**公開 repo ポリシー**: 本ドキュメントは公開リポジトリに含まれる。上流の実地検証コーパスとして使われている consumer プロジェクトの名前 / 固有パス / 具体スキーマ名 (テーブル名・カラム名・複合インデックス構成など) / 内部 bug ID / fixture 名は本プランおよび派生するサイトコンテンツに一切書かない。参照が必要な場合は「発端プロジェクト」「上流の実地検証」等の一般名詞に丸める。

---

## 0. 状態と発火順序

上流は 4 フェーズ構成 (jsonui-cli 側 `2026-07-07-doc-contract-check-05-impl-plan.md`) のうち **Phase 1〜3 が実装完走** (`document_tools/jsonui_doc_cli/check/` に着地。`openapi_diff` / `db_schema/` / `_run_full_checker` / `scope=generated` を確認済み)。本サイトの反映は原案どおり 3 段構成で書いているが、**すべて実行可能**な状態。

| 上流フェーズ | 上流の実装状況 | 本サイトの反映段 | 実行可能 |
|---|---|---|---|
| Phase 0 (受け皿) | ✅ 実装済み (CI 組み込み、config アクセサ、レポート契約) | — (内部整備、反映不要) | — |
| **Phase 1** | ✅ `jsonui-doc check` コマンド + `builtin:openapi-diff` + generate html 取り込み | **反映段 1** (§2) | **可** |
| **Phase 2** | ✅ 複数 DB フォーマット + `x-indexes` / `x-db-type` / `x-external-ref` + `builtin:db-schema` v1 (MySQL/PG/SQLite) | **反映段 2** (§3) | **可** |
| **Phase 3** | ✅ フルチェッカー型 + `--scope generated` + db-schema v1.1 相当 | **反映段 3** (§4) | **可** |
| Phase 4 (非 RDB) | ⏸ 着手条件付きで待機 (Firestore を使う実プロジェクト出現待ち) | 反映段 4 (別プランに切り出し) | 未 |

**推奨実行方針**: 上流 Phase 1〜3 は同日リリース済みなので、本サイトも **段 1〜3 を 1 セッションで一括反映する** のが最も少ない deploy 回数で終わる。段別に分けたい理由 (レビュー負荷分散など) がある場合のみ 3 回に分割する。段別実行の詳細は §2〜§4 に残す。

**段間の独立性**: 各段は互いに依存しない。段 2 の DB モデル 2 ページを飛ばして段 1 と段 3 だけ反映しても content として矛盾しない (段 3 の追記は段 1 の新規ページに載る)。

---

## 1. サイト全体構造への影響 (先に確定させる)

Phase 1 反映時に、以降の段でも使う構造を先に決める。**反映段 1 で導入し、段 2/3 で追記する形**にする。

### 1.1 新規ページ 2 本

| ページ | 位置 | 役割 | 反映段 |
|---|---|---|---|
| `concepts/implementation-contract-check` | 新規 (concept エッセイ) | 「check = 生産者 / generate = 描画者」の分離、confidence の 3 段階 (proof/metadata/sampled)、プラグイン 2 段階 (adapter/full checker) を説明。DB モデルからの swagger 生成を扱う既存 `data-models-from-openapi` の対になる位置づけ | 段 1 (雛形) → 段 2 (DB 側追記) → 段 3 (フルチェッカー追記) |
| `guides/verifying-implementation-against-docs` | 新規 (cookbook) | `jui.config.json` の `checks` 宣言 → チェッカー実行 → 生成 HTML への表示までのウォークスルー | 段 1 (API 版) → 段 2 (DB 版追記) → 段 3 (フルチェッカー版追記) |

### 1.2 既存ページの改訂

| ページ | 改訂内容 | 反映段 |
|---|---|---|
| `reference/cli-commands` | `jsonui-doc` の役割・body を「HTML generator」から「HTML generator + 実装整合性 checker」に拡張。 `jsonui-doc check` サブコマンド (`db` / `api` / `db:main` / `--list` / `--with-checks` / exit 0/1/2 の意味) を新セクションとして追記 | 段 1 |
| `reference/cli-commands` | `jsonui-doc check db` の subcommand 化 (拡張。dialect 別 dump adapter の存在を明記) | 段 2 |
| `reference/mcp-tools` | (段 3 で必要になったら) MCP に `doc_check_list` read-only ツールが追加された場合のみ Group 追記。上流 v1 では見送り宣言 | 段 3 判断 |
| `guides/api-data-models` | 「実装との整合性を継続的に検証したい場合は /guides/verifying-implementation-against-docs を参照」を末尾 next-reads に追加 | 段 1 |
| `guides/writing-your-first-spec` | 「docs/api/ + docs/db/ が spec の SSoT」の言及箇所に「実装整合性 check がある」を 1 行追記 | 段 1 |

### 1.3 サイトナビゲーション (Chrome の NAV_CATALOG) への追加

反映段 1 で 2 ページ増える。既存の並び:

```
Concepts   … why-spec-first / one-layout-json / data-models-from-openapi / …
Guides     … writing-your-first-spec / writing-layouts / api-data-models / …
```

追加位置:

- `concepts/implementation-contract-check` を `data-models-from-openapi` の直後に挿入 (「swagger → DTO 生成」と「実装との整合性検証」で 1 セット)
- `guides/verifying-implementation-against-docs` を `api-data-models` の直後に挿入 (同じく 1 セット)

### 1.4 サイト自体の check 導入 (非目的)

本サイト自体は backend を持たず、`docs/api/*.json` は「例示用の swagger」として扱われている。よって本サイトに `jsonui-doc check` を有効化する意味はなく、`jui.config.json` に `checks` を書かない。**サイトのコンテンツとしてのみ扱う**。

---

## 2. 反映段 1 — Phase 1 完了時 (check コマンド + OpenAPI diff)

トリガ: 上流 CHANGELOG で「`jsonui-doc check` v1 (OpenAPI diff) リリース」が公開された時点。

### 2.1 新規 `concepts/implementation-contract-check.spec.json`

- displayName: 「Implementation contract check」
- 章立て (H2 単位、~7-min read)
  1. 問題設定 — spec が生成の SSoT である一方、実装との整合性は人手で維持されている
  2. 分離原則 — check (生産者) と generate (描画者) を分ける理由。「clone + generate html で第三者コードは実行されない」不変条件の説明
  3. Confidence 3 段階 — `proof` / `metadata` / `sampled` の使い分け (段 1 では `proof` のみ実例、段 2 で `metadata`、段 3 で `sampled` を後埋め)
  4. アダプタ型 vs フルチェッカー型 — 段 1 ではアダプタ型のみ (Phase 1 の実装範囲)
  5. 実装との整合性ページの読み方 — 生成 HTML 上の表示、鮮度 (stale) 判定の意味
  6. 見つけられない差分 — 「実装の宣言との照合」であって「実レスポンスの検証」ではない点を明示 (Phase 1 の重要な制約)
  7. 次に読む — `/guides/verifying-implementation-against-docs`
- 段 2 で 3 章 (Confidence: metadata の実例) と 4 章 (adapter → full checker への昇格判断) を追記する余地を残す

### 2.2 新規 `guides/verifying-implementation-against-docs.spec.json`

- displayName: 「Verifying implementation against docs」
- Cookbook 型。章立て:
  1. 何を検証するのか — OpenAPI diff の対象 (パス × メソッド、パラメータ、2xx レスポンス、enum 値集合)
  2. `jui.config.json` に checks を宣言する — 段 1 では `builtin:openapi-diff` のみ紹介
  3. FastAPI 用アダプタスクリプト例 — 数行の `python -m app.export_openapi` サンプル (上流の docs 同梱コードを紹介する形。**上流の実地検証コーパス由来のコード片は貼らず、汎用 FastAPI アプリのミニ例に丸める**)
  4. Spring / NestJS / Rails (rswag) 等の代替パス — 「各フレームワークの OpenAPI 出力機構を `impl_openapi_command` に指す」概論のみ
  5. ローカル / CI での実行 — exit code (0/1/2) の意味、`--list` によるドライラン、環境変数での接続情報
  6. 生成 HTML への反映 — 「実装との整合性」セクションの見方、stale 表示、input_hashes 一致判定
  7. 見つけられない差分 (再掲・詳細) — 実レスポンス検証はフルチェッカー型の領域 (段 3 で追記)
- 段 2 で「DB スキーマも同時に checks に追加する」節を追記する予定を **1 行の TODO コメント**でスペック内に予約 (実装時に define エージェントが検知できる)

### 2.3 `reference/cli-commands.spec.json` の改訂

- `cli_jsonui_doc_body` の en/ja を「HTML generator」から「HTML generator + implementation contract checker. Subcommands: `check` (OpenAPI diff / DB schema — v1 では OpenAPI のみ), `generate html` (docs from screen / component specs).」形の一文に拡張
- 新セクション `section_jsonui_doc_check` を追加:
  - コマンド一覧: `jsonui-doc check` / `jsonui-doc check api` / `jsonui-doc check api-name` (name フィルタ) / `jsonui-doc check --list` / `jsonui-doc generate html --with-checks`
  - exit code の意味 (0 = OK / 1 = mismatch / 2 = 実行エラー)
  - config 宣言必須 + 実行前表示 + タイムアウト の 3 セキュリティ原則を 1 段落で説明
  - **具体の `impl_openapi_command` 値は書かない**。config スキーマの key 名列挙のみ (`name` / `type` / `impl_openapi_command` / `command` / `dump_command` / `timeout_seconds`)

### 2.4 strings.json への追加キー (概算)

- concept ページ: 40〜60 キー (章タイトル + 本文 + code 例のラベル)
- guide ページ: 60〜80 キー (Cookbook で例が多いため多め)
- reference 追記: 8〜12 キー (section 見出し + subcommand 行 + exit code 表)
- 合計 ~120〜150 キー。en + ja の 2 言語 → 240〜300 エントリ。jsonui-localize で登録

### 2.5 NAV_CATALOG 更新

- `ChromeViewModel` の NAV_CATALOG に 2 エントリ追加 (concepts / guides 各 1)
- home の RECENT_CHANGES_RAW に「Implementation contract check (concept + guide)」を 1 行追加
- 各 concepts/guides index ページの item 追加

---

## 3. 反映段 2 — Phase 2 完了時 (複数 DB + DB schema チェッカー)

トリガ: 上流 CHANGELOG で「`jsonui-doc[db]` extras + 複数 DB 対応 (`docs/db/{db_name}/`) + `builtin:db-schema` v1 リリース」が公開された時点。

### 3.1 新規 `concepts/data-models-from-db.spec.json` (**要検討**)

現サイトは `data-models-from-openapi` (API 側) しか concept ページを持っていない。DB モデル (`docs/db/*.json`) の位置づけは tools/mcp と tools/cli で断片的に言及されているのみ。Phase 2 で DB モデルフォーマットが x-* キー拡張を含む形で「一級の spec」になるため、**新規 concept を立てる価値がある**。

- 章立て案:
  1. なぜ DB モデルを spec に置くのか — swagger (API 側) と同じ「ドキュメント = SSoT」哲学
  2. 単一 DB (フラット) 構造 — `docs/db/*.json`、既存プロジェクト互換
  3. 複数 DB (ディレクトリ) 構造 — `docs/db/{db_name}/*.json`、`databases` config
  4. スキーマの書き方 — OpenAPI Schema Object subset + x-* 拡張 (`x-indexes` / `x-db-type` / `x-external-ref`)
  5. ERD が DB 単位で描かれる理由 — DB 跨ぎ FK は存在しない前提、`x-external-ref` は点線描画への予約
  6. 実装との整合性 — /concepts/implementation-contract-check への交差参照

代替案: 新規 concept を作らず、既存の `data-models-from-openapi` を「Data models from OpenAPI (API + DB)」に拡張。ただし章数が肥大化 (現行 10 章 → 15+ 章) するので、**分離する案を推奨**。

**判断は反映実行時に jsonui-conductor / define で確定** (Phase 2 実装時点の SSoT スコープに応じて再確認)。

### 3.2 新規 `guides/writing-db-models.spec.json` (**要検討**)

`writing-layouts` / `writing-your-first-spec` に相当する「DB モデルを書き始める」cookbook。以下を含む:

1. `docs/db/{table}.json` を最小構成で作る (単一 DB 前提)
2. カラム定義 (OpenAPI Schema)
3. PK / UNIQUE / FK / index の書き方
4. 複合 index / UNIQUE — `x-indexes` の使い方 (Phase 2 の新機能)
5. `x-db-type` による厳密型指定 (誤検知回避)
6. 複数 DB 化 — `docs/db/{db_name}/` に切り出し、`databases` config

現サイトは `guides/writing-your-first-spec` (screen spec 中心) と `guides/writing-layouts` (Layout JSON 中心) の 2 本が入門系。**DB モデル cookbook が空白**なので Phase 2 で埋める。

### 3.3 `guides/verifying-implementation-against-docs` に DB 節追記

- 新章「DB スキーマも同時に検証する」を挿入:
  - `builtin:db-schema` の checks 宣言例
  - `dump_command` (アダプタ型) と SQLAlchemy inspector (extras) の使い分け
  - 環境変数 `JSONUI_CHECK_DB_URL_{NAME}` による接続情報の渡し方
  - 方言別マッピング (MySQL / PG / SQLite) の説明 (**具体的な型対応表は本サイトに書かず、上流公開ドキュメントへリンクする方針で検討** — 型マップは上流の JSON データファイルが SSoT なので、コピーはドリフト源)
  - `--strict` フラグの意味
  - ignore パターン (`alembic_version` 等 ORM 管理テーブル) の追加宣言

### 3.4 `concepts/implementation-contract-check` に metadata confidence 節追記

Phase 2 では現時点 v1 は依然 `proof` のみ (RDB スキーマ照合)。ただし Phase 4 の伏線として、confidence の使い分け (proof vs sampled) を「今後 Firestore などを追加した場合の考え方」として 1 段落追記する。

### 3.5 `reference/cli-commands` の追記

- `jsonui-doc check db` / `jsonui-doc check db:{name}` の紹介を追加
- `jui.config.json` の `databases` セクション key を列挙 (dialect / version)
- `docs/db/{db_name}/` の複数 DB レイアウトを 1 段落で説明

### 3.6 サイト自体の HTML 生成が変わることに注意

上流 Phase 2 は **本サイトが利用している `jsonui-doc generate html` の内部で `docs/db/` の分割ロジック**が入る。上流 P2-1 で `generator.py:767` の `html_rel_path` に subdir を折り込む修正が単一 DB プロジェクトでは **バイト一致** を守ると宣言されているが、本サイトは念のため:

1. `jui sync_tool` 実行前後で `docs/screens/html/` (もし本サイトが `jsonui-doc generate html` を通す場合) 出力に差分が出ないことを確認
2. 本サイトは `docs/db/*.json` を実際に 1 つも持っていないので影響は理論上ゼロだが、**Phase 2 の sync 時に生成物のスモークテストを追加**

### 3.7 NAV_CATALOG 更新

- concept 追加時: `data-models-from-db` を `data-models-from-openapi` の直後に
- guide 追加時: `writing-db-models` を `writing-layouts` の直後に

---

## 4. 反映段 3 — Phase 3 完了時 (フルチェッカー + --scope generated + v1.1)

トリガ: 上流 CHANGELOG で「フルチェッカー型プラグイン + `--scope generated` + db-schema v1.1 (複合 index)」の公開時点。

### 4.1 `guides/verifying-implementation-against-docs` にフルチェッカー節追記

- 新章「実 API を叩いて実レスポンスを検証する」を挿入:
  - アダプタ型では届かないケース (認証・シードデータ・特定エンドポイントの契約テスト)
  - フルチェッカー型の出力契約 (schemaVersion 付き JSON を stdout に吐く)
  - httpx で数エンドポイントを叩くサンプル (**上流 docs 同梱のミニ例を参照する形。本サイトに具体コードを持ち込まない** — ミニ例は「認証つき API を叩く」パターンなのでプロジェクト固有色が強く、公開 doc に置くと readers がミスリードされる可能性)
  - フルチェッカー型が exit 2 になる不正出力パターンの説明

### 4.2 `concepts/implementation-contract-check` に「adapter → full checker への昇格判断」追記

- どのタイミングでフルチェッカーに移行するか (認証必要 / 実データ検証 / 意味的規約の検証)
- confidence への影響 (proof のまま維持できるケースとサンプル検証に落ちるケース)

### 4.3 `guides/api-data-models` に `--scope generated` の紹介追記

- 既存の `api.schemas.include_paths` (path filter) セクションの直後に、「継続的検証時に filter に一致するパス/スキーマだけ差分検知したい場合」として `jsonui-doc check --scope generated` を 1 段落追記
- 実行フロー: `jui g api --dry-run --json` で kept_schemas を取得 → check がそれで対象を絞る (本サイトの reader 目線では意識不要、subprocess 経由の内部動作なので概念だけ触れる)

### 4.4 `guides/writing-db-models` に v1.1 追記

- 複合 index / 複合 UNIQUE の `x-indexes` サンプルの diff → v1 では手書き必須だったのが v1.1 で機械照合される旨を追記
- FK ON DELETE / AUTO_INCREMENT の照合対象化 (schema 側の書き方)

### 4.5 `reference/cli-commands` の追記

- `--scope generated` / `--strict` フラグの意味
- フルチェッカー型の宣言例 (`type: "checker"`, `command`)

### 4.6 strings 追加見込み

- concept + guide 追記合計 ~40 キー (段 3)

---

## 5. 反映段 4 — Phase 4 (Firestore ほか)

上流 Phase 4 は着手条件つき (Firestore を実採用するプロジェクトが出るまで待機)。**上流が Phase 4 に着手した時点で本プランから枝分かれさせる**。予約項目:

- `concepts/implementation-contract-check` に sampled confidence の実例節を追加
- `guides/verifying-implementation-against-docs` に Firestore / DynamoDB / Elasticsearch 等の節を追加 (対象 DB 追加時に個別)
- `reference/cli-commands` の対応 dialect リスト更新

---

## 6. 実行時の gate と検証 (全段共通)

- `jui sync_tool` 実行 → 上流の HTML 生成側変更を取り込む (段 2 で必須。段 1/3 でも予防的に実施)
- 3 ページ以内の変更 (段 1) / 5 ページ以内の変更 (段 2) で 1 コミット 1 デプロイの原則を維持
- jsonui-conductor → jsonui-define で spec を書き、jsonui-localize で strings を確定、`jui build` + `jui verify --fail-on-diff` の gate を必ず通す
- 段 1 の deploy 後に **CTA / nav 動作回帰チェック** (前回の `useHomeViewModel` バグ再発防止 — 依存配列の invariant は既に一律固定済みだが、新規 hook wrapper が入るときの目視確認は継続)
- 各段の受け入れ条件:
  - 段 1: 新規 2 ページ が 200 応答 + interactive、NAV_CATALOG から辿れる、cli-commands の `jsonui-doc` 説明が checker 併記
  - 段 2: 追加された 2 ページ (data-models-from-db, writing-db-models) が 200 応答、既存 `verifying-implementation-against-docs` に DB 節が追加、単一 DB プロジェクト向けの HTML 生成がバイト一致 (本サイト自身は `docs/db/` を持たないので影響ゼロを二重確認)
  - 段 3: `verifying-implementation-against-docs` にフルチェッカー節が追加、api-data-models に `--scope generated` 節が追加

---

## 7. 公開 repo ハイジーン (最重要・全段共通)

上流 plan (`2026-07-07-doc-contract-check-00〜05`、gitignore 下の内部ドキュメント) には実地検証コーパスとして使われている consumer プロジェクトのプロジェクト名・テーブル数・パス数・具体テーブル名・具体カラム名・具体複合 index 構成が頻出する。これらを一切、本サイトのコンテンツ (spec / layout / strings) およびコミットメッセージ・PR タイトル・PR 本文に **持ち込まない**。上流 plan を読み書きするのは agent の作業空間内での参照のみに閉じる。

### 7.1 具体的なサンプルコードを書く場合の丸め方

- テーブル名は汎用に (`orders` / `users` / `products` などのオンライン教科書で頻出する語彙)
- カラム名も同様 (`id` / `name` / `created_at` / `amount` など)
- 複合 index の例は「注文アイテムの `(order_id, product_id)` UNIQUE」のような一般業務ドメインで
- FastAPI サンプルは「認証なしの単純な /items API」レベル

### 7.2 上流ドキュメントへのリンク方針

型マッピング表 (dialect 別) や dialect の追加は上流の JSON データファイル / CHANGELOG が SSoT。本サイトにコピーせず、**上流 README / docs へのリンク**にとどめる。理由: コピーはドリフト源になり、上流が Phase 3 の `v1.1` で表を更新した時に本サイトが古いままになる。

### 7.3 段 1〜3 の commit 前 grep チェック

反映 commit 前に必ず consumer 識別子の grep gate を通す。具体パターンは commit 時点で確定している consumer 名 / 具体スキーマ語彙 (テーブル名・カラム名など) を含む grep パターンを、**セッション内でその場で組み立てて実行**する (grep パターン自体をここに書き残さない — 書き残すと本ファイル経由で語彙が漏れる)。hit があれば丸め漏れとして commit 中止し、汎用語 (`orders` / `users` / `products` 等) に置換する。

---

## 8. non-goals (本プランで扱わないこと)

- 上流未実装機能 (フルチェッカー型サンプルの本サイトへの実物同梱、MCP `doc_check_list` ツール等) の先行反映
- 本サイト自身に `jsonui-doc check` を適用する運用 (§1.4)
- 上流 review.md や実装 plan の内部詳細 (レビュー §3 の修正 9 件など) のコンテンツ化 — reader 向けでない
- `reference/attributes` への doc-contract 関連情報の追加 — 属性 SSoT とチェッカーは別軸

---

## 9. 発火手順の要約

上流 CHANGELOG を監視 → Phase 1 / 2 / 3 のいずれかがリリースされた時点で本プランの対応段を実行。

1. jsonui-conductor で workflow 1 (新規追加) を起動
2. jsonui-define で spec 群を編集 (段別に §2/§3/§4 を参照)
3. jsonui-implement で NAV_CATALOG / RECENT_CHANGES_RAW / index ページ更新
4. jsonui-localize で strings 追加
5. `jui build` + `jui verify --fail-on-diff` を green にする
6. デプロイ後、目視 + curl で 200 応答検証
7. §7.3 の grep gate を通してから commit

段 1 完了までの見積り: spec 2 本 + reference 追記 + strings 300 エントリで、実働 1〜2 セッション相当。
