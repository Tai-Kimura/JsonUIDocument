# 38. コンテンツプラン: Tools — `/tools/mcp` 記事群

> Scope: 3〜5 時間 / 1〜2 セッション。plan 09 の MCP 構造（overview + グループ別 + 29 ツール個別ページ）の本文を書く。
> 依存: plan 26（reference/mcp-tools の詳細仕様）、plan 09（構造設計）。

reference/mcp-tools（plan 26）は**全 29 ツールの引数・戻り値・エラー**を網羅する。本プランは**読み物としての使い方ガイド**を書く。

---

## 1. 対象記事

| URL | 役割 |
|---|---|
| `/tools/mcp/overview` | MCP 全体像、Claude Code への組込み |
| `/tools/mcp/install` | MCP サーバーのインストール（`/learn/installation` 誘導） |
| `/tools/mcp/architecture` | MCP プロトコルと jsonui-mcp-server の内部構造 |
| `/tools/mcp/group-a-spec-layout` | Group A 7 ツール概要 |
| `/tools/mcp/group-b-build-verify` | Group B 6 ツール概要 |
| `/tools/mcp/group-c-doc-authoring` | Group C 9 ツール概要 |
| `/tools/mcp/group-d-lookup-search` | Group D 9 ツール概要 |
| `/tools/mcp/tools/<tool-name>` | 各 29 ツールの使用ガイド（詳細は reference） |
| `/tools/mcp/integration/claude-code` | Claude Code 統合 |
| `/tools/mcp/integration/codex` | OpenAI Codex 統合 |
| `/tools/mcp/integration/cursor` | Cursor 統合 |
| `/tools/mcp/troubleshooting` | トラブルシューティング |

---

## 2. 各ページの書き下ろすべき内容

### 2.1 `/tools/mcp/overview`

#### セクション

**MCP とは**
- en: "MCP (Model Context Protocol) is a standard for AI agents to call tools. JsonUI's MCP server exposes 29 tools that give agents first-class access to specs, layouts, and validators."
- ja: "MCP（Model Context Protocol）は AI エージェントがツールを呼ぶための標準。JsonUI の MCP サーバーは 29 ツールを公開し、エージェントに spec・layout・validator への一級アクセスを提供する。"

**なぜ MCP か**
- Agent が正しいコンテキストで作業できる（`jui.config.json` を読んで platform を判定、spec を直接読んで構造を理解）
- Bash 経由の `jui` コマンド呼び出しと比べて、引数型が明示的でエラーが少ない
- 4 層 fallback により環境差分に強い

**4 つのグループ**

| Group | 目的 | 代表ツール |
|---|---|---|
| A. Spec & Layout | 読み取り | `list_screen_specs`, `read_spec_file` |
| B. Build & Verify | 生成・検証 | `jui_build`, `jui_verify` |
| C. Doc Authoring | spec 作成補助 | `doc_init_spec`, `doc_validate_spec` |
| D. Lookup & Search | 属性/コンポーネント検索 | `lookup_component`, `search_components` |

**何が MCP 経由で**行われるか
- エージェントが `get_project_config` を最初に呼んで現プロジェクトの構成を把握
- `list_screen_specs` で作業対象を特定
- `lookup_component` / `lookup_attribute` で属性詳細を確認
- `jui_build` / `jui_verify` で検証
- 全ての書き込みは Bash 経由ではなく MCP tool 経由

#### コードサンプル
1. Claude Code の `Use the jui-tools MCP to list screen specs` 発話例 → MCP 呼出しログ → 返り値

---

### 2.2 `/tools/mcp/install`

`/learn/installation` に誘導。本ページは:
- MCP のみ再インストール手順（`JSONUI_BOOTSTRAP_STEPS=mcp`）
- `~/.claude.json` への登録内容確認
- 動作確認（Claude Code の MCP ツール一覧に `jui-tools` が出る）

#### コードサンプル
1. MCP-only bootstrap コマンド
2. `~/.claude.json` の該当セクション例

---

### 2.3 `/tools/mcp/architecture`

#### セクション

**プロセス構成**
- MCP サーバー = Node.js プロセス（`~/.jsonui-mcp-server/dist/index.js`）
- Stdio 経由で Claude Code / Codex 等のクライアントと通信
- サーバーは stateless；毎呼出しで `jui.config.json` を読む

**4 層 fallback**
1. `JSONUI_CLI_PATH` 環境変数
2. プロジェクト local（`./jsonui-cli/`）
3. Home（`~/.jsonui-cli/`）
4. Node.js `require.resolve` によるグローバル

**attribute_definitions.json の同期**
- MCP サーバーは起動時に `$JSONUI_CLI_PATH/shared/core/attribute_definitions.json` を読む
- `jui sync-tool` で更新すると MCP も次回呼出しから反映

#### コードサンプル
1. MCP サーバーのディレクトリ構造（tree output）
2. プロトコル通信の例（JSON-RPC 1 往復）

---

### 2.4 `/tools/mcp/group-a-spec-layout`

#### セクション
- Group A の 7 ツールの共通目的（読み取り系）
- いつ使うか（「まず最初に読むべき」系）
- 代表的な使用シーケンス（config → list → read）

各ツールへのリンク:
- `get_project_config` → `/tools/mcp/tools/get-project-config`
- `list_screen_specs` → `/tools/mcp/tools/list-screen-specs`
- `list_component_specs` → `/tools/mcp/tools/list-component-specs`
- `list_layouts` → `/tools/mcp/tools/list-layouts`
- `read_spec_file` → `/tools/mcp/tools/read-spec-file`
- `read_layout_file` → `/tools/mcp/tools/read-layout-file`
- `get_data_source` → `/tools/mcp/tools/get-data-source`

---

### 2.5 `/tools/mcp/group-b-build-verify`

同構造で Group B の 6 ツール（`jui_init`, `jui_build`, `jui_verify`, `jui_generate_project`, `jui_generate_screen`, `jui_generate_converter`）。

**特徴**: Group B は**副作用あり**（ファイルを書く）。呼び出し前に必ず `get_project_config` で現状確認。

---

### 2.6 `/tools/mcp/group-c-doc-authoring`

Group C の 9 ツール。`jsonui-doc` CLI の MCP 版。

**特徴**: spec の雛形作成 / 検証 / HTML 生成。ドキュメントサイト（本サイト）自身がこの group を使って記事を量産している（自己言及）。

---

### 2.7 `/tools/mcp/group-d-lookup-search`

Group D の 9 ツール。検索・lookup 系で最も頻繁に使われる。

**Tips**:
- `lookup_component` は完全一致、`search_components` は曖昧検索
- `get_binding_rules` は binding 方向（one-way / two-way）の確認に必須

---

### 2.8 `/tools/mcp/tools/<tool-name>`（29 ページ）

各ページ:
- 用途（1-2 段落）
- 代表的な使用シナリオ（3 つ）
- ミニ example（Input / Output）
- `/reference/mcp-tools#<tool>` への詳細リンク

例: `/tools/mcp/tools/list-screen-specs`:
- 用途: 画面 spec 一覧を取得
- シナリオ 1: 新規セッション開始時の現状把握
- シナリオ 2: 特定パス配下の spec を絞り込み
- シナリオ 3: CI で差分 spec を検出

---

### 2.9 `/tools/mcp/integration/claude-code`

#### セクション
- Claude Code への自動登録手順（`/learn/installation` で済む）
- `~/.claude.json` の設定項目リファレンス
- slash command からの呼出し（`Use the jui-tools MCP to ...`）
- トラブルシューティング

#### コードサンプル
1. `~/.claude.json` の完全エントリ
2. 典型的な slash command

---

### 2.10 `/tools/mcp/integration/codex`

- OpenAI Codex / Codex Cloud での MCP 登録手順
- 設定ファイルの違い
- Codex 独特の制約

---

### 2.11 `/tools/mcp/integration/cursor`

- Cursor IDE での MCP 登録
- `~/.cursor/mcp.json` への書き込み

---

### 2.12 `/tools/mcp/troubleshooting`

- MCP ツールがエージェントから見えない → Claude Code 再起動、`~/.claude.json` 確認
- `attribute_definitions not found` エラー → CLI インストール確認
- `lookup_component` が古い情報を返す → `jui sync-tool` で更新
- 個別ツールのエラー → plan 26 のエラーコード表を参照

---

## 3. 必要 strings キー

prefix: `tools_mcp_<page>_*`

概算 200 キー × 2 言語。

---

## 4. クロスリンク追加先

- `/learn/installation` → `/tools/mcp/overview`
- `/reference/mcp-tools` の各ツール → `/tools/mcp/tools/<tool>`
- `/tools/agents`（plan 39）→ `/tools/mcp/overview`

---

## 5. 実装チェックリスト

- [ ] 50+ ページ分の spec ファイル作成
- [ ] strings キー追加
- [ ] Layout 生成
- [ ] 各グループページに CodeBlock ≥ 1
- [ ] 29 ツール個別ページに mini example
- [ ] 統合ページで `~/.claude.json` 完全例
- [ ] クロスリンク追加
- [ ] `jui build` / `jui verify` / `jsonui-localize`

---

## 6. セッション分割の推奨境界

- **分割 A**: overview + install + architecture + 4 グループ概要（7 ページ、2 時間）
- **分割 B**: 29 ツール個別ページ（ミニ形式で 29 ページ、3 時間）
- **分割 C**: integration 3 ページ + troubleshooting（1 時間）
