# Swagger 駆動 Data Model 機能 — サイト側修正計画

**日付**: 2026-05-27
**ステータス**: ドラフト v3（MCP + Agents integration plan `2026-05-27-mcp-agents-api-model-integration.md` を反映、§3 の "MCP 更新不要" 判断を **撤回**）
**対象**: このリポジトリ（jsonui-doc 本体）の **コード / spec / strings** に必要な変更のみ
**前提**: 上流の 3 つの計画
- `jsonui-cli/docs/plans/2026-05-27-swagger-data-model-generation.md` v3（Phase 1 完了、DTO + Domain 二層 codegen）
- `jsonui-cli/docs/plans/2026-05-27-swagger-codegen-path-filter.md` v2（Phase 1.5、path / schema filter）
- `jsonui-cli/docs/plans/2026-05-27-mcp-agents-api-model-integration.md`（MCP に Group E 3 tool 追加 + `jui ls` 系 CLI 追加 + agents/rules 更新）

の **全部** がランディングし `jui sync_tool` / MCP server 更新が consumer 側に行き渡った後の作業。
**スコープ外**: 機能を読者に説明する新規ドキュメントページの追加（→ `2026-05-27-swagger-models-doc-additions.md` を参照）

---

## 0. 前提の確認

このサイトは:

- `docs/api/` ディレクトリを **持たない**
- `jui.config.json` に `api_directory` / `api.platforms.*` / `api.schemas.*` キーを **持たない**
- 自前で消費する OpenAPI スキーマを **持たない**

したがって新パイプライン (`_sync_api_models` v3 + path-filter v2) は、このリポジトリでは **silently no-op** で走る想定。filter 側の glob 評価ロジックも入力 swagger が無いので走らない。本計画はその「no-op が本当に no-op であること」を検証し、上流の挙動を解説するドキュメント側との整合だけ取る。

---

## 1. 上流ランディング直後の検証チェックリスト

`jui sync_tool` で v3 パイプラインが入った直後に必ず実行する。order matters。

| # | コマンド | 期待 | 不一致なら |
|---|---|---|---|
| 1 | `jui sync_tool` | 完了 | n/a |
| 2 | `jui build` | 0 warnings、`[api-codegen]` 系ログ無し | warning は **silent fix 禁止**。`jsonui-cli/docs/bugs/reports/` に bug report 起票 |
| 3 | `jui verify --fail-on-diff` | 0 drift | DTO 在中していないのに drift が出るなら上流バグ。bug report 起票 |
| 4 | `ls docs/api/ 2>/dev/null` | not found | 何か emit されていたら異常 |
| 5 | `ls jsonui-doc-web/src/models/generated/ 2>/dev/null` | not found | 同上 |
| 6 | `git status` | clean | 生成物が出ていたら異常 |
| 7 | `jui build --verbose` | "filtered out N schemas" のような filter ログが **出ない** | swagger を持たないのに filter が走るのは異常。bug report 起票 |
| 8 | `jui ls api-specs` | 空配列 or "no swagger files found" | 何か返ってきたら設定ミス |
| 9 | `jui ls api-models` | 空配列 or "no generated models" | 同上 |
| 10 | MCP server 更新確認: `mcp__jui-tools__list_api_specs` を IDE 経由で呼ぶ | 0 件返却（or "no api_directory configured" 系メッセージ） | 例外が出るなら MCP server 配信ミス |

**Memory rule**: ライブラリ側のバグは report、silent な workaround は禁止（`feedback_library_bugs.md`）。本計画でも厳守。

---

## 2. `jui.config.json` への追記 — **しない**

理由:

- swagger を消費しないので `api_directory` / `api.platforms.*` を入れても全 default。
- path-filter v2 の `api.schemas.{include_paths, exclude_paths, include_schemas, exclude_schemas, skip_domain}` も同様 — 入力が無い filter は無意味。
- 空 config は将来 default が変わった時に意図せず追従が外れる。
- 上流 default `docs/api` は探索して空なら skip するだけなので明示は不要。
- path-filter 側も「`[]` と key 未指定が等価で制限なし」が default（path-filter plan §2.4）なので明示する利点は無い。

**何もしない** が正解。本項は「明示的に何もしない」ことを記録するためだけに存在する。

---

## 3. MCP ツールカタログ — **更新必須**（v2 判断を撤回）

v2 plan の「MCP 更新不要」判断は撤回。上流 MCP integration plan §3 で **Group E: API Model Discovery** が 3 tool 追加されたため、カタログを以下のとおり更新する。

### 3.1 TOOL_IDS への追加

両 VM の `TOOL_IDS` 配列末尾に新グループとして追加:

- `jsonui-doc-web/src/viewmodels/reference/McpToolsViewModel.ts`
- `jsonui-doc-web/src/viewmodels/tools/McpViewModel.ts`

追加内容（Group E、3 件）:

```typescript
// E (API Model Discovery)
"list_api_specs", "list_api_models", "preview_api_model_sync",
```

### 3.2 グループ表記の拡張

両 VM の冒頭コメント `A (Lookup) → B (Validation) → C (Generation) → D (Build + Runtime)` を `→ E (API Model Discovery)` まで拡張。strings の `tools_mcp_section_groups_*` も同様に 4 groups → 5 groups。

### 3.3 strings 追加

`docs/screens/layouts/Resources/strings.json` に新規キー（各 tool で en + ja 必須）:

| キー | 内容 |
|---|---|
| `tools_mcp_tool_list_api_specs_name/group/role` | name: "list_api_specs" / group: "E" / role: "Discover swagger files + metadata" |
| `tools_mcp_tool_list_api_models_name/group/role` | name: "list_api_models" / group: "E" / role: "List generated DTO + Domain scaffold + orphans" |
| `tools_mcp_tool_preview_api_model_sync_name/group/role` | name: "preview_api_model_sync" / group: "E" / role: "Dry-run filter impact (kept/excluded/halts)" without writing" |
| `reference_mcp_tools_tool_list_api_specs_params` | input/output JSON schema dump |
| `reference_mcp_tools_tool_list_api_models_params` | 同上 |
| `reference_mcp_tools_tool_preview_api_model_sync_params` | 同上 |

### 3.4 tool 件数の最終確定

現状 30 → +3 → **33 件**。後述 §6 の "29 → 33" 一括置換に組み込む。

### 3.5 グループ count

`tools_mcp_section_groups_body` 系で各 group の件数を表記している場合（"A:7 / B:6 / C:7 / D:9" 等）、新 group E:3 を追加。実数値は MCP server ランディング後に `mcp__jui-tools__*` 全 tool を列挙して確定する。

---

## 4. CLI コマンドリファレンス — 追記必須

上流が CLI に新サブコマンド / 新 flag を追加するため、以下 spec を更新する。

### 4.1 `docs/screens/json/reference/cli-commands.spec.json`

#### `jui g api` セクションを **追加**

`generate` グループ配下に新サブコマンド行を 1 件追加:

- name: `jui g api`
- one-liner (en): "Regenerate API DTOs + Domain scaffolds from `docs/api/*.json` without running the full build. Honors `api.schemas.*` filter."
- one-liner (ja): "`docs/api/*.json` から API DTO と Domain scaffold だけを再生成（full build はスキップ）。`api.schemas.*` の filter も適用される。"
- 主要 flag:
  - `--dry-run` — filter プレビュー JSON を出力、書き込まない（`mcp__jui-tools__preview_api_model_sync` の実装裏側でもある）
  - `--fail-on-diff` — 既存と byte-equal でなければ exit 非 0（CI 用途）
  - `--regenerate-domain {Name}` は **v2 送り**（書かない、書くなら "(v2)" 明記）
- 補足 1 行: filter で除外された schema 数は `jui build` と同じく `[api-codegen] filtered out N schemas` 形式の log に出る旨を記載

#### `jui ls` 親コマンドを **新規追加**（or 既存 group に追加）

MCP integration plan §3.6 で導入された discovery 用 CLI。`generate` の隣に並べる読み取り系として 1 group 新設。サブコマンド 2 件:

| name | one-liner (en) | one-liner (ja) |
|---|---|---|
| `jui ls api-specs` | List swagger files in `api_directory` with title / version / schema_count / endpoint_count metadata. | `api_directory` 配下の swagger ファイル一覧（タイトル / バージョン / schema 件数 / endpoint 件数つき）。 |
| `jui ls api-models` | List generated DTO + Domain scaffold files per platform, including orphans (schema deleted but file remains). | プラットフォーム別の DTO + Domain scaffold + orphan（schema が消えたが残っているファイル）一覧。 |

両者とも flag は `--platform ios|android|web` `--json`（machine-readable 出力）。

#### `jui lint-generated` セクションを **更新**

既存 flag (`--fix`, `--verbose`) に **`--fail-on-orphan`** を追加:

- en: "Fail when a Domain scaffold exists for a schema that has been deleted from the swagger file."
- ja: "Domain scaffold が残っているのに swagger から該当 schema が消えている場合に exit 非 0。"

#### `jui verify --fail-on-diff` セクションを **拡張**

DTO byte-equal 比較が drift 検出に含まれることを 1 行追記:

- en: "Also re-generates API DTOs in-memory and compares byte-equal against disk; fails on any DTO drift."
- ja: "API DTO もメモリ上で再生成してディスクと byte-equal 比較。DTO の drift も検出。"

#### TOC / アンカー

- `commands_<group>` 系の strings に新行（jui_g_api）を追加
- spec の sections 配列に新エントリを差し込む（順序は generate group 末尾）

### 4.2 関連 strings (`docs/screens/layouts/Resources/strings.json`)

新規キー:

- `reference_cli_commands_jui_g_api_name` (en + ja)
- `reference_cli_commands_jui_g_api_oneliner` (en + ja)
- `reference_cli_commands_jui_g_api_flags` (en + ja, テーブル本体)
- `reference_cli_commands_jui_lint_generated_fail_on_orphan_*` (en + ja)
- `reference_cli_commands_jui_verify_dto_note_*` (en + ja)
- `reference_cli_commands_jui_ls_group_*` (en + ja, 新 group ヘッダ)
- `reference_cli_commands_jui_ls_api_specs_*` (en + ja, name/oneliner/flags)
- `reference_cli_commands_jui_ls_api_models_*` (en + ja, 同上)

---

## 5. ツールページ `tools/cli.spec.json` — 軽微な追記

generate サブグループの本文に 1 文足す:

- en: "...and `api` regenerates OpenAPI DTOs + Domain scaffolds (since v3 build pipeline)."
- ja: "...`api` は OpenAPI DTO と Domain scaffold を再生成（v3 build パイプライン以降）。"

新規 `ls` group を 1 行追加（discovery 系として generate の後ろに並べる）:

- en: "`ls api-specs` / `ls api-models` enumerate swagger inputs and generated DTO/Domain files — used by the MCP tools and by humans for quick state check."
- ja: "`ls api-specs` / `ls api-models` は swagger 入力と生成済 DTO/Domain ファイルの列挙。MCP ツールの実装ベースであり、人間が状況確認するためにも使う。"

サブコマンド数の数値 (現状 13) を **`+3` する**（`g api` + `ls api-specs` + `ls api-models`）。`tools_cli_section_generate_*` / `tools_cli_section_ls_*` を同時更新。実数値は上流ランディング後に確定（`jui --help` で実物確認）。

---

## 6. 既知の **stale strings** 修正 + Group E 追加に伴う一括更新

`tools_mcp` 系で "29 MCP tools" / "29 typed MCP tools" / "29 ツール" の表記が strings.json 内 **14 行** ある（grep 結果から、L784 〜 L3243）。

最終値は **30 + 3 (Group E) = 33**。本機能の延長で全箇所を一括置換:

| 行範囲 | 内容 | 新値 |
|---|---|---|
| L784 / L785 / L796 / L797 | sidebar tagline | "33 MCP tools" / "33 ツール" |
| L1114 / L1115 | section_catalog_body | 同上、文意も後述 (stale "live Swagger" 修正と同時) |
| L1246 / L1247 | chrome sidebar description | "33 tools in 5 groups" / "33 ツールを 5 グループ" |
| L1422 / L1423 | why_spec_first 本文 | "33 typed tools" / "型付きツール 33 個" |
| L2478 / L2479 | agents 入口説明 | "33 typed tools" / "型付きツール 33 個" |
| L2622 / L2623 / L3242 / L3243 | index 系説明 | "33 typed MCP tools" / "33 個の型付き MCP ツール" |

すべて `29 → 33` に置換、grep で `\b29\b` / `\b30\b`（中間値）が tools_mcp / chrome / why_spec_first / agents 文脈に残らないことを確認。

**並行して**: `tools_mcp_section_catalog_body` の "live Swagger / tool manifests" は誤誘導。"Hand-authored catalog kept in sync with the MCP server's 5-group tool list (33 tools, currently)" の系統に書き換え。doc-additions plan §5 と整合。

**注意**: 数値 30 → 33 の中間値（path-filter ランディングだけ済んだ状態）が一時的に発生し得るが、本サイトの更新は **3 計画書すべて consumer 側に行き渡ってから** 着手するので（§0 / §10 参照）、中間値で commit することはない。

---

## 7. Chrome / Sidebar — 新規ページ追加に伴う NAV_CATALOG 更新

ドキュメント追加計画（doc-additions plan）で新 concept / guide ページを足す予定があるため、**そちらが先に着地** してから:

- `jsonui-doc-web/src/viewmodels/ChromeViewModel.ts` の `NAV_CATALOG`:
  - concepts セクションに新エントリ
  - guides セクションに新エントリ
- 追加直後に jui build → 0 warnings → jui verify → 0 drift を再確認

本計画ではエントリの位置だけ予約: concepts 配列の末尾に追加（カテゴリ内 alphabetical ではなく history 順を保つ既存方針に合わせる）。

---

## 8. ViewModel パターン — 新規 VM もここに合わせる

doc-additions plan で新 spec ページを足す際の生成 VM は、既存の SSR-safe パターンに準拠する:

- `private _useDefault = true` か `(lookup) => …` の二択
- `mountLanguage()` を必ず実装
- 対応する hook ラッパは `jsonui-doc-web/src/hooks/` に置き、`useEffect` + `jsonui:languagechange` listener を持つ
- 詳細は既存 30 VM のいずれかをコピー（HomeViewModel.ts が最新 reference）

本計画では「新規 VM はこのパターンを踏襲」とだけ明記。実装は doc-additions 側。

---

## 9. テスト

本計画の修正は spec / strings レベルなので新規テスト追加は不要。ただし以下を回す:

- `jui build` — 0 warnings
- `jui verify --fail-on-diff` — 0 drift
- `jsonui-localize` — green
- 既存 `jsonui-doc-web` の screen tests — pass

CI が緑であることを確認してから merge。

---

## 10. 作業の順序

1. **上流のランディング待ち**: 3 計画書すべて (`v3 本体` / `path-filter v2` / `MCP+Agents integration`) が `jsonui-cli` + `jsonui-mcp-server` + `JsonUI-Agents-for-claude` の各 main に入る
2. consumer 側に配信完了（`jui sync_tool` + MCP server npm 更新 + agents/rules の手動同期）
3. §1 のチェックリスト消化（10 ステップ、MCP smoke を含む）
4. §1 で warning / drift / 想定外 emit が出たら **bug report 起票して停止**（silent fix 禁止）
5. clean なら以下を 1 PR にまとめる:
   - §3 (MCP catalog Group E 追加)
   - §4 (CLI ref に `jui g api` / `jui ls *` 追加)
   - §5 (tools/cli 軽微改訂)
   - §6 (stale strings: 29 → 33 一括置換 + 5 groups 表記)
6. doc-additions plan の新ページ実装と並行進行（§7 の NAV_CATALOG 更新はそちらに依存）
7. 全部入りで再度 §9 のテスト → merge

---

## 11. やらないこと

- swagger サンプルファイルを `docs/api/` に置いて demo する → doc-additions plan で検討（追加するなら code-block 形式で spec に embed する方が site 構造的に自然）
- `jui.config.json` に空の `api` セクションを追加する → §2 の理由により禁止
- `api.schemas.{include_paths, ...}` を空配列で雛形だけ書く → 同上、設定ノイズになるだけ
- ~~MCP TOOL_IDS への追加~~ → **v3 で撤回**、§3 のとおり Group E を追加する
- ライブラリ側 / MCP server 側で出た warning / バグの workaround をこのリポジトリ内に追加 → memory rule により禁止
- 3 計画書のうち一部だけランディングした状態で commit する → §10 のとおり全部揃ってから着手。中間値（30, 31, 32）で commit しない
- canonical agents/rules（`JsonUI-Agents-for-claude/.claude/*.md`）の修正をこのリポジトリで行う → 上流の作業。本サイトには関係ない

---

## 12. 関連

- 上流計画 (本体): `jsonui-cli/docs/plans/2026-05-27-swagger-data-model-generation.md`（v3）
- 上流計画 (path filter): `jsonui-cli/docs/plans/2026-05-27-swagger-codegen-path-filter.md`（v2、Phase 1.5）
- 上流計画 (MCP + Agents): `jsonui-cli/docs/plans/2026-05-27-mcp-agents-api-model-integration.md`
- 姉妹計画: `docs/plans/2026-05-27-swagger-models-doc-additions.md`（読者向けドキュメント追加）
- 過去計画: `docs/plans/2026-05-14-embed-doc-update.md`（同様の構造で書いた前例）
- Memory: `feedback_library_bugs.md`, `feedback_auto_check_bug_reports.md`
