# 11. コンテンツプラン: JsonUI-Agents-for-claude / JsonUI-Agents-for-Codex

> **実装アーキテクチャ（本計画書共通）:** 各ページは `docs/screens/json/tools/agents/**/*.spec.json` で定義、
> `jui g project` で Layout + ViewModel。
> Claude / Codex の差分は同ページ内の `Tabs` / `TabPanel` Converter（全プラットフォーム対応）で切替。
> 詳細は `02-tech-stack.md` / `17-spec-templates.md`。
>
> Layout の置き場: `docs/screens/layouts/tools/agents/**/*.json`
> Agents / Skills の一覧は `Collection + cellClasses`（`cells/agent_card.json` / `cells/skill_card.json`）。

## 1. 対象リポジトリ

- `/Users/like-a-rolling_stone/resource/JsonUI-Agents-for-claude/`
- `/Users/like-a-rolling_stone/resource/JsonUI-Agents-for-Codex/`

両者とも以下を持つ:
- `CLAUDE.md` / `AGENTS.md` — 入口ファイル
- `agents/` — 専門エージェント定義
- `skills/` — スキル定義
- `rules/` — ルールファイル
- `examples/`
- `install.sh`

## 2. ページ構成

```
/tools/agents
├── /tools/agents/overview                    全体像と哲学
├── /tools/agents/why                         AI 差別化ポイント（MCP と相補）
├── /tools/agents/install                     インストール（claude / codex 共通）
├── /tools/agents/claude                      JsonUI-Agents-for-claude
│   ├── /tools/agents/claude/install
│   ├── /tools/agents/claude/claude-md        CLAUDE.md の構造
│   └── /tools/agents/claude/workflows        Workflow 1〜9
├── /tools/agents/codex                       JsonUI-Agents-for-Codex
│   ├── /tools/agents/codex/install
│   ├── /tools/agents/codex/agents-md         AGENTS.md の構造
│   └── /tools/agents/codex/workflows
├── /tools/agents/workflows                   Workflow 1〜9 詳細（claude/codex 共通）
│   ├── /tools/agents/workflows/requirements       Option 1
│   ├── /tools/agents/workflows/implementation     Option 2
│   ├── /tools/agents/workflows/migration          Option 3
│   ├── /tools/agents/workflows/modify             Option 4
│   ├── /tools/agents/workflows/create-specs       Option 5
│   ├── /tools/agents/workflows/backend            Option 6
│   ├── /tools/agents/workflows/feature-plan       Option 7
│   ├── /tools/agents/workflows/responsive         Option 8
│   └── /tools/agents/workflows/investigate        Option 9
├── /tools/agents/agents-list                 全 agents 一覧
│   ├── /tools/agents/agents-list/orchestrator
│   ├── /tools/agents/agents-list/requirements
│   ├── /tools/agents/agents-list/spec
│   ├── /tools/agents/agents-list/setup
│   ├── /tools/agents/agents-list/screen-impl
│   ├── /tools/agents/agents-list/modify
│   ├── /tools/agents/agents-list/responsive
│   ├── /tools/agents/agents-list/investigate
│   ├── /tools/agents/agents-list/feature-plan
│   └── /tools/agents/agents-list/test
├── /tools/agents/skills-list                 全 skills 一覧（カテゴリ別）
│   ├── /tools/agents/skills-list/implementation
│   ├── /tools/agents/skills-list/specification
│   ├── /tools/agents/skills-list/platform-setup
│   └── /tools/agents/skills-list/test
├── /tools/agents/philosophy                  「Constrain AI to Reduce Output Variance」
└── /tools/agents/troubleshooting             トラブルシューティング
```

## 3. 主要ページ要点

### 3.1 `overview`
- JsonUI プロジェクト向けの**専門エージェント群**
- Claude Code / Codex 両対応
- MCP サーバー（`/tools/mcp`）と補完関係:
  - MCP: コンポーネント仕様をリアルタイムに提供
  - Agents: 実装フローをオーケストレート

### 3.2 `why`
哲学: **Constrain AI to Reduce Output Variance**（既存 README にも記載）

```
通常の AI 開発:
  Quality = Spec Quality × Prompt Skill × Context Management
             (不安定)      (不安定)       (不安定)

JsonUI アプローチ:
  Quality = Spec Quality × Code Constraints × Specialized Agents
             (不安定)       (安定)            (安定)
```

- Code Constraints は JsonUI のツールが吸収
- Specialized Agents は各責務を分離（layout / viewmodel / data / ...）
- **Spec Quality のみが変動要因**

### 3.3 `install`

ページ冒頭に `/learn/installation` への誘導バナー（Converter `InfoBanner` 想定）:

> 初めての方は `/learn/installation` のワンライナーで agents + CLI + MCP を一括インストールできます。このページは「既に CLI/MCP を別手段で管理していて、agents だけ入れたい」人向けです。

本文:

- Claude Code 用（agents のみ）:
  ```bash
  curl -H "Cache-Control: no-cache" -sL \
    "https://raw.githubusercontent.com/Tai-Kimura/JsonUI-Agents-for-claude/main/install.sh?$(date +%s)" \
    | bash
  ```
- Codex 用（agents のみ）:
  ```bash
  curl -H "Cache-Control: no-cache" -sL \
    "https://raw.githubusercontent.com/Tai-Kimura/JsonUI-Agents-for-Codex/main/install.sh?$(date +%s)" \
    | bash
  ```
- インストール後、`Read CLAUDE.md` または `Read AGENTS.md` で起動
- ワンライナー（agents + CLI + MCP）の詳細は `18-content-plan-installation.md` / `/learn/installation` を参照

### 3.4 `claude/claude-md`
- `CLAUDE.md` の役割: プロジェクトルールと workflow 選択の入口
- 9 つの Workflow 一覧（要約）
- 即時アクション（`Read CLAUDE.md` で 9 択メニューを表示）
- 各 Workflow が起動する Agent

### 3.5 `codex/agents-md`
- `AGENTS.md` の役割（Claude Code 版の `CLAUDE.md` と同等）
- Codex 特有の差分があれば明記

### 3.6 `workflows/*` 共通

各 Workflow ページのテンプレ:
1. 概要
2. 呼び出されるエージェント
3. 入力
4. 出力
5. セッション境界（Option 1 など、セッションを切る指示がある場合）
6. 使用例

#### Option 1: Requirements
- `jsonui-requirements` agent
- 出力: `docs/screens/json/*.spec.json`
- セッション分離: 完了後、新セッションで Option 2 へ

#### Option 2: Implementation
- `jsonui-orchestrator` agent
- フロー: spec → setup → implement → test
- `app_config_path` パラメータ

#### Option 3: Cross-Platform Migration
- `jsonui-orchestrator` に migration context を渡す
- 入力: source_platform / source_project_path / target_platform

#### Option 4: Modify Existing App
- `jsonui-modify` agent
- 用途: 機能追加 / バグ修正 / スペック変更

#### Option 5: Create Specs for Existing App
- `jsonui-spec` agent
- 既存 Layout/ViewModel から `.spec.json` を逆生成

#### Option 6: Backend Development
- CLAUDE.md のルールを**完全解除**
- ユーザー指定の別 `.md` をルールとして読み込む

#### Option 7: New Feature Plan
- `jsonui-feature-plan` agent
- 出力: `docs/plans/{feature-name}-frontend.md` / `-backend.md`

#### Option 8: Responsive
- `jsonui-responsive` agent
- 既存画面にタブレット / 横画面対応を追加

#### Option 9: Investigate
- `jsonui-investigate` agent
- **Read-only**、ファイル変更しない

### 3.7 `agents-list`

各 agent の 1 ページ。内容:
- 役割
- Input / Output
- 関連 skills
- Workflow 番号（どの Option から呼ばれるか）

Agent 一覧（両リポジトリ共通）:
- `jsonui-requirements`
- `jsonui-orchestrator`
- `jsonui-spec`
- `jsonui-setup`
- `jsonui-screen-impl`
- `jsonui-test`
- `jsonui-responsive`
- `jsonui-investigate`
- `jsonui-modify`
- `jsonui-feature-plan`

### 3.8 `skills-list`

カテゴリ別に整理:

**Implementation Skills**
- `jsonui-generator`
- `jsonui-layout`
- `jsonui-refactor`
- `jsonui-data`
- `jsonui-viewmodel`
- `jsonui-converter`

**Specification Skills**
- `jsonui-requirements-gather`
- `jsonui-screen-spec`
- `jsonui-component-spec`
- `jsonui-swagger`
- `jsonui-spec-review`

**Test Skills**
- `jsonui-test-cli`
- `jsonui-screen-test-implement`
- `jsonui-flow-test-implement`
- `jsonui-test-document`
- `jsonui-test-setup-ios`
- `jsonui-test-setup-android`
- `jsonui-test-setup-web`

**Platform Setup Skills**
- `swiftjsonui-swiftui-setup`
- `swiftjsonui-uikit-setup`
- `kotlinjsonui-compose-setup`
- `kotlinjsonui-xml-setup`
- `reactjsonui-setup`

### 3.9 `philosophy`
- README の Philosophy セクションをサイト化
- 図版を追加

### 3.10 `troubleshooting`
- インストール失敗
- 古い CLAUDE.md のまま起動しない
- Workflow 選択が表示されない

## 4. 差分管理（claude / codex）

- `agents/` と `skills/` の内容は 9 割同一
- サイトでは原則「共通ドキュメント」を書き、差異がある箇所のみ claude / codex タブで区切る
- 例: install コマンド、設定ファイルパス

```
src/Layouts/components/agent_variant_tabs.json  # Claude / Codex 切替 Tabs
```

## 5. サイドバー

`src/Layouts/components/sidebar_agents.json` — 3 階層

## 6. Strings 追加キー

`tools_agents_*` プレフィックスで約 55 キー × 2 言語。

## 7. 実装チェックリスト

- [ ] `docs/screens/json/tools/agents/**/*.spec.json` 約 45 枚（`jui g screen` 一括生成）
- [ ] 各 spec に対し `jui g project --file ...`
- [ ] `docs/screens/layouts/tools/agents/**/*.json` 手作業で仕上げ
- [ ] `jsonui-doc-web/src/app/tools/agents/**/page.tsx`
- [ ] `docs/screens/layouts/common/sidebar_tools_agents.json`（`platforms: ["web"]`）
- [ ] Strings `tools_agents_*`
- [ ] Philosophy ページの図版
- [ ] `Tabs` / `TabPanel` による claude / codex 切替
- [ ] `CLAUDE.md` の内容を必要に応じて差分最小で本文に組み込む（原文著者同一のため、コピー許容）
- [ ] MCP（`/tools/mcp`）との相互リンク
