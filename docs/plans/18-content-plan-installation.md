# 18. コンテンツプラン: `/learn/installation`（ワンライナー一発インストール）

> **実装アーキテクチャ（本計画書共通）:** ページは `docs/screens/json/learn/installation.spec.json` で定義、
> `jui g project` で Layout + ViewModel を生成。
> 詳細は `02-tech-stack.md` / `17-spec-templates.md`。
>
> Layout の置き場: `docs/screens/layouts/learn/installation.json`

## 1. ページの目的

**JsonUI を試したい初心者（A 層）が最短 3 ステップで環境を用意できること**を絶対要件とする。

- 1 ステップ = curl ワンライナー（agents + CLI + MCP を一括インストール）
- 2 ステップ = `PATH` 追記 + Claude Code 再起動
- 3 ステップ = Claude Code で `Read CLAUDE.md` → ワークフロー選択

初心者が「何をインストールする必要があるのか」を理解しなくても済む導線にする。
詳細を知りたい層向けの展開セクション（tool 別個別インストール / 部分アップデート / カスタムパス等）は**折りたたみ**で提供。

## 2. URL と spec 対応

| URL | spec ファイル | Layout |
|---|---|---|
| `/learn/installation` | `docs/screens/json/learn/installation.spec.json` | `docs/screens/layouts/learn/installation.json` |

IA 上の位置: `Learn > Installation`（`01-information-architecture.md` line 42）。ホーム Hero CTA からの主要遷移先のひとつ。

## 3. 必須コンテンツ

### 3.1 ヒーロー（画面上部）

- **見出し**: "Install JsonUI in one line"（EN）/ "JsonUI をワンライナーで導入"（JA）
- **サブコピー**: "One command installs the CLI, the MCP server, and the agent pack into Claude Code." / "CLI・MCP サーバー・エージェント一式を Claude Code に 1 コマンドで入れます。"
- **CTA ブロック**（`CodeBlock` converter、言語: `bash`、コピーボタン付き）:
  ```bash
  curl -fsSL https://raw.githubusercontent.com/Tai-Kimura/JsonUI-Agents-for-claude/main/installer/bootstrap.sh | bash
  ```

### 3.2 「何が入るか」

3 カラムのカード（`Collection + cellClasses`、`cells/install_target_card.json`）:

| カード | Where | What |
|---|---|---|
| `jsonui-cli` | `~/.jsonui-cli/` | `jui` / `sjui` / `kjui` / `rjui` / `jsonui-test` / `jsonui-doc`。`shared/core/{attribute_definitions,component_metadata}.json` を同梱し、MCP が直接読む |
| `jsonui-mcp-server` | `~/.jsonui-mcp-server/` + `~/.claude.json` に登録 | 29 MCP ツール（Group A 7 / B 6 / C 7 / D 9）、runtime-sync による常時最新の attribute スキーマ |
| Agents + Skills + Rules | `./.claude/`（プロジェクトローカル）+ ルートに `CLAUDE.md` | 9 エージェント、11 スキル、5 ルール |

カードの下に補足:

> CLI が `~/.jsonui-cli/` にあるため、MCP の 4 層 fallback の 3 段目（home）が自動的に効きます。環境変数は不要。

### 3.3 事前要件（`Collection`、PlatformBadge 付き）

| 必須 | ツール | 備考 |
|---|---|---|
| 必須 | `git` / `curl` | 全プラットフォーム |
| 必須 | Node.js (≥ 20) | MCP サーバー本体 |
| 必須 | `npm` | MCP 依存インストール |
| 任意 | Ruby (≥ 2.7) | `sjui` / `kjui` / `rjui` を使うなら |
| 任意 | Python 3 (≥ 3.10) | `jui` / `jsonui-test` / `jsonui-doc` を使うなら |

事前要件が足りない場合、bootstrap は**警告を出して続行**する（該当ツールだけがスキップされる）。全欠損は致命的。

### 3.4 3 ステップ導入（本文のメイン）

1. **ワンライナー実行**（上の CTA を再掲）
2. **PATH 追記**（bootstrap が実行後に printout する内容を `CodeBlock` で再掲）:
   ```bash
   cat >> ~/.zshrc <<'EOF'
   # JsonUI CLI Tools
   export PATH="$HOME/.jsonui-cli/sjui_tools/bin:$PATH"
   export PATH="$HOME/.jsonui-cli/kjui_tools/bin:$PATH"
   export PATH="$HOME/.jsonui-cli/rjui_tools/bin:$PATH"
   EOF
   source ~/.zshrc
   ```
3. **Claude Code を再起動** → プロジェクトで:
   ```
   Read CLAUDE.md
   ```
   次に `conductor` エージェントが起動し、`New work / Modify / Investigate / Backend` のメニューを出す。

### 3.5 動作確認（Collection）

導入後すぐに試せるコマンド:

| コマンド | 期待される動き |
|---|---|
| `jui --help`（シェル） | CLI のヘルプが出れば PATH 設定 OK |
| Claude Code → `Use the jui-tools MCP to list components` | 29 ツールの中から `search_components` が呼ばれ、28 コンポーネントが返る |
| Claude Code → `Read CLAUDE.md` → `1` | `conductor` が起動する |

### 3.6 アップデート（同じコマンドで上書き）

> Bootstrap は idempotent。同じコマンドを再実行すると各コンポーネントが `git fetch + reset --hard origin/main` で最新に追随します。

`CodeBlock` で再実行コマンド。

### 3.7 部分アップデート（折りたたみセクション）

`Collapse` / `Details` converter を使って、展開しないと見えない形で提供:

```bash
# Agents だけ更新
curl -fsSL https://raw.githubusercontent.com/Tai-Kimura/JsonUI-Agents-for-claude/main/installer/bootstrap.sh | \
  JSONUI_BOOTSTRAP_STEPS="agents" bash

# CLI + MCP だけ（プロジェクトを触らずにツールだけ最新化）
JSONUI_BOOTSTRAP_STEPS="cli,mcp" bash <(curl -fsSL ...)
```

サポートする値: `cli` / `mcp` / `agents` のカンマ区切り任意サブセット。

### 3.8 カスタムパス（折りたたみ）

```bash
# すべて /opt/jsonui 配下に入れたい
export JSONUI_CLI_DIR=/opt/jsonui/cli
export JSONUI_MCP_DIR=/opt/jsonui/mcp
curl -fsSL https://raw.githubusercontent.com/Tai-Kimura/JsonUI-Agents-for-claude/main/installer/bootstrap.sh | bash
```

- `JSONUI_CLI_DIR` … CLI の絶対インストール先
- `JSONUI_MCP_DIR` … MCP の絶対インストール先
- `JSONUI_BOOTSTRAP_REF` … Agents リポジトリの branch / tag / commit
- `JSONUI_BOOTSTRAP_STEPS` … 実行ステップ

> `JSONUI_CLI_DIR` をデフォルト以外にする場合、MCP は `JSONUI_CLI_PATH` 環境変数を参照する（fallback の 1 段目）。`~/.claude.json` の `jui-tools` エントリに `"env": { "JSONUI_CLI_PATH": "/opt/jsonui/cli" }` を追記する旨を注記。

### 3.9 個別インストール（折りたたみ）

既に CLI または MCP を別手段で管理していて干渉したくない場合:

- CLI のみ: `curl -fsSL https://raw.githubusercontent.com/Tai-Kimura/jsonui-cli/main/installer/bootstrap.sh | bash`
- MCP のみ: `curl -fsSL https://raw.githubusercontent.com/Tai-Kimura/jsonui-mcp-server/main/install.sh | bash`
- Agents のみ: `curl -fsSL https://raw.githubusercontent.com/Tai-Kimura/JsonUI-Agents-for-claude/main/install.sh | bash`

### 3.10 トラブルシューティング（Collection）

| 症状 | 原因候補 | 対処 |
|---|---|---|
| `jui: command not found` | PATH が通っていない | ステップ 2 の PATH 追記を確認、`source ~/.zshrc` |
| Claude Code の MCP リストに `jui-tools` が出ない | 再起動していない / `~/.claude.json` に別書式が残っている | Claude Code を完全再起動。`~/.claude.json` を開いて `mcpServers.jui-tools` の `args` が `~/.jsonui-mcp-server/dist/index.js` を指しているか確認 |
| MCP が "attribute_definitions.json not found" で起動失敗 | `~/.jsonui-cli/` が削除された or 空 | bootstrap を `JSONUI_BOOTSTRAP_STEPS=cli` で再実行。または `JSONUI_CLI_PATH` を env で直接指定 |
| `curl` が失敗 / 404 | GitHub の CDN キャッシュ遅延（push 直後） | 5 分待ってリトライ。すぐ欲しい場合は `?v=$(date +%s)` を付与（ただし CDN は無視することもあるので待つ方が確実） |
| macOS で `node` は入っているのに "node not found" | Homebrew の node が `sudo`/subshell で見えない | `which node` で確認し、`JSONUI_MCP_DIR` を設定して sudo なしで再実行 |
| Ruby / Python が古いと言われる | バージョン不足 | 該当ツールを使わないなら無視可（警告のみ） |

### 3.11 アンインストール

`CodeBlock`:

```bash
# MCP エントリ削除 + 拡張削除
bash ~/.jsonui-mcp-server/uninstall.sh
rm -rf ~/.jsonui-mcp-server

# CLI 削除
rm -rf ~/.jsonui-cli
# PATH 行を ~/.zshrc から手動で削除

# Agents 削除（プロジェクトから）
rm -rf .claude CLAUDE.md
```

### 3.12 関連リンク

- `/tools/cli`（CLI 詳細）
- `/tools/mcp`（MCP 詳細 / 全 29 ツール）
- `/tools/agents`（9 エージェント詳細）
- `/learn/hello-world`（次のステップ）
- `/tools/mcp/tools/get-data-source`（どのファイルから読んでるか確認するツール）

## 4. Converter 依存

- `CodeBlock`（`bash` ハイライト + コピーボタン）
- `PlatformBadge`（事前要件ごとに OS / ツール種別）
- `Details` / `Collapse`（折りたたみ 3 箇所）
- `Collection`（`cells/install_target_card.json`, `cells/prereq_row.json`, `cells/troubleshoot_row.json`）

これらは `07-content-plan-reactjsonui.md` / `15-toolchain.md` で全サイト共通の Converter として既に列挙されている範囲。追加の独自 Converter は不要。

## 5. Strings 追加キー

`learn_installation_*` プレフィックスで約 25 キー × 2 言語:

- ヒーロー: `headline`, `subcopy`, `cta_copy_button`
- 各カード: `card_cli_title` / `card_cli_body`, 同様に `mcp` / `agents`
- 3 ステップ: `step1_title` / `step1_body`, 同様に `step2` / `step3`
- 動作確認 3 行: `verify_cli_title` / `verify_cli_expect` ほか
- トラブルシューティング 6 行: `trouble_1_symptom` / `trouble_1_fix` ほか
- 折りたたみセクション 3 枚のタイトル

## 6. スクリーンショット

- Terminal（bootstrap 実行中のログ、最後の "All done." バナー部分）
- Claude Code 再起動後の MCP リストに `jui-tools` が見える画面
- `Read CLAUDE.md` → `conductor` のメニューが出ている画面

スクリーンショットは `docs/screenshots/learn/installation/*.png` 配下。GIF は使わず静止画 + alt text で i18n 対応（JA / EN）。

## 7. サイドバー

`docs/screens/layouts/common/sidebar_learn.json` の最上位。`/learn/installation` を `/learn/what-is-jsonui` の直下に配置（`01-information-architecture.md` の並びと一致）。

## 8. 実装チェックリスト

- [ ] `docs/screens/json/learn/installation.spec.json` 作成（`jui g screen` 雛形 → 手作業で埋める）
- [ ] `jui g project --file learn/installation.spec.json`
- [ ] `docs/screens/layouts/learn/installation.json` 手作業調整
- [ ] `docs/screens/layouts/learn/installation/cells/install_target_card.json`
- [ ] `docs/screens/layouts/learn/installation/cells/prereq_row.json`
- [ ] `docs/screens/layouts/learn/installation/cells/troubleshoot_row.json`
- [ ] Strings `learn_installation_*` × 2 言語
- [ ] スクリーンショット 3 枚
- [ ] ホーム Hero から `/learn/installation` への CTA リンク
- [ ] `/tools/{cli,mcp,agents}/install` 各ページのトップに「全部まとめて入れたい人は `/learn/installation` へ」のバナー
- [ ] `jui build` → 0 warnings
- [ ] `jui verify --fail-on-diff` 通る
- [ ] `jsonui-localize` 通る
