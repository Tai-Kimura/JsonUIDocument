# 39. コンテンツプラン: Tools — `/tools/agents` 記事群

> Scope: 4〜5 時間 / 1〜2 セッション。plan 11 の agents ページ構成に対応。
> 依存: plan 11（構造設計）、plan 38（MCP integration）。

---

## 1. 対象記事

| URL | 役割 |
|---|---|
| `/tools/agents/overview` | 9 エージェント + 11 スキル + 5 ルールの全体像 |
| `/tools/agents/install` | `/learn/installation` 誘導 |
| `/tools/agents/workflow` | conductor → define → implement → test のワークフロー |
| `/tools/agents/agent/<name>` | 各 9 エージェントの詳細（個別ページ） |
| `/tools/agents/skill/<name>` | 各 11 スキルの詳細（個別ページ） |
| `/tools/agents/rules` | 5 ルールのリファレンス |
| `/tools/agents/customization` | プロジェクトローカルカスタマイズ |
| `/tools/agents/troubleshooting` | トラブルシューティング |

---

## 2. 各ページの書き下ろすべき内容

### 2.1 `/tools/agents/overview`

#### セクション

**エージェントとは**
- en: "Claude Code agents are specialized sub-agents for specific JsonUI tasks. Each has its own prompt, tools, and scope."
- ja: "Claude Code エージェントは特定の JsonUI タスクに特化したサブエージェント。各々独自のプロンプト・ツール・責務範囲を持つ。"

**9 エージェント一覧**

| Agent | 役割 | 呼ばれるとき |
|---|---|---|
| `jsonui-conductor` | エントリーポイント / ルーティング | `/jsonui` 時 |
| `jsonui-ground` | プロジェクト初期化 | `jui init` の補助 |
| `jsonui-define` | spec 作成・編集 | 新規画面の define |
| `jsonui-implement` | Layout 実装 | spec → Layout 変換 |
| `jsonui-navigation-ios` | iOS navigation コード | iOS の navigation 実装時 |
| `jsonui-navigation-android` | Android navigation | Android の navigation 時 |
| `jsonui-navigation-web` | Web navigation | Web の navigation 時 |
| `jsonui-test` | テスト作成 | `.test.json` 書く時 |
| `jsonui-debug` | 読み取り専用調査 | バグ調査・コードリーディング |

**11 スキル一覧**

| Skill | 役割 |
|---|---|
| `jsonui-screen-spec` | 画面 spec 作成の対話ガイド |
| `jsonui-component-spec` | component spec 作成 |
| `jsonui-dataflow` | spec の dataFlow 節の作成 |
| `jsonui-swagger` | OpenAPI spec 作成 |
| `jsonui-layout` | Layout JSON 実装 |
| `jsonui-viewmodel-impl` | ViewModel 実装 |
| `jsonui-localize` | 多言語化 |
| `jsonui-platform-setup` | プラットフォーム設定 |
| `jsonui-screen-test` | screen test 作成 |
| `jsonui-flow-test` | flow test 作成 |
| `jsonui-test-doc` | test 文書化 |

**5 ルール**

| Rule | 対象 | 内容 |
|---|---|---|
| `invariants` | 全 workflow | 4 不変条件 |
| `mcp-policy` | 全 workflow | MCP first 方針 |
| `design-philosophy` | 全 workflow | 設計哲学 |
| `file-locations` | 全 workflow | ファイル配置ルール |
| `specification-rules` | define | spec 記述ルール |

#### コードサンプル
1. 典型的な `/jsonui` セッション開始ログ
2. conductor の質問例

---

### 2.2 `/tools/agents/install`

`/learn/installation` の要約。追加で:
- Agents / Skills / Rules が `.claude/` 配下に配置される仕組み
- プロジェクトローカルでの上書き方法

---

### 2.3 `/tools/agents/workflow`

#### セクション

**4 つの標準 workflow**

| # | Workflow | 使用例 |
|---|---|---|
| 1 | New work / feature | 新規画面追加 |
| 2 | Modify existing | バグ修正・機能変更 |
| 3 | Investigate only | 読み取り専用調査 |
| 4 | Backend | JsonUI 外作業 |

**Workflow 1 の詳細フロー**
```
User: /jsonui → Choose 1 (new work)
  ↓
conductor が質問して絞込み
  ↓
define: spec 作成 / 編集
  ↓
implement: Layout + ViewModel 実装
  ↓
[navigation-ios / android / web: プラットフォーム固有 navigation]
  ↓
jsonui-localize スキル: 多言語化
  ↓
test: screen / flow test 作成
  ↓
最終チェック: jui build (0 warnings), jui verify, jsonui-localize
```

各ステップの所要時間目安（画面サイズ別）、代表的エラーと対処。

**Workflow 2 の違い**
- `define` は skip（既存 spec を編集）
- `debug` で最初に原因特定 → `implement` で修正
- spec-first trace（spec から Layout を通して追う）が重要

**Workflow 3 の違い**
- 書込みなし
- `debug` のみ使用
- 最終チェックは不要

**Workflow 4 の違い**
- JsonUI rules が全て lifted
- ユーザーが指定した `.md` ファイルを唯一のルールとする

#### コードサンプル
1. Workflow 1 の conductor セッション完全ログ
2. Workflow 2 の debug トレース例

---

### 2.4 `/tools/agents/agent/<name>`（9 ページ）

各エージェントの詳細ページ。テンプレート:

```markdown
## <agent-name>

### Purpose
1-2 段落の責務

### When invoked
conductor によって呼ばれる条件、直接呼ぶ場合の prompt 例

### Tools available
| Tool | Purpose |
|---|---|

### Typical workflow
1. ...
2. ...

### Output
- 生成／更新されるファイル
- 最終メッセージフォーマット

### Can NOT do
- 範囲外のタスク（例: implement は spec 編集しない）

### Example invocations
完全なプロンプト例
```

各 9 エージェントを本プランで個別に記述:

1. **jsonui-conductor**: 質問選択肢、ルーティング先、`/jsonui` 冒頭の選択肢、決定ロジック
2. **jsonui-ground**: `jui init` + プロジェクト足場、platform scaffolding、.jsonui-type-map.json 作成
3. **jsonui-define**: spec 編集、doc_validate_spec と jui_verify を必ず通す、例示的なプロンプト
4. **jsonui-implement**: Layout 実装、`jui g project`、style 作成、localize 呼出し
5. **jsonui-navigation-ios**: SwiftUI NavigationStack or UIKit UINavigationController、transitions から Swift コード
6. **jsonui-navigation-android**: Compose Navigation or XML NavGraph、transitions から Kotlin コード
7. **jsonui-navigation-web**: React Router or Next.js App Router、transitions から TS コード
8. **jsonui-test**: `.test.json` / `.flow.json` 作成、plan 31 の形式準拠
9. **jsonui-debug**: 読み取り専用、3 gates (verify / build / validate_spec) を診断に使う、structured report 出力

各ページで CodeBlock 2-3 個。

---

### 2.5 `/tools/agents/skill/<name>`（11 ページ）

各スキルの詳細ページ。テンプレート:

```markdown
## <skill-name>

### Purpose
何を支援するか

### Invoked by
どのエージェントから呼ばれるか、直接呼ぶ場合のコマンド

### Required inputs
- ...

### Steps
1. ...

### Outputs
- ...

### Example
```

11 スキル分を本プランで記述（各 200-300 語）。

---

### 2.6 `/tools/agents/rules`

各 5 ルールの全文解説:

1. `invariants.md` の 4 不変条件
2. `mcp-policy.md` の MCP-first 方針
3. `design-philosophy.md` の設計哲学
4. `file-locations.md` のディレクトリ規約
5. `specification-rules.md` の spec 記述ルール

本文で各ルール文書を引用しつつ、実務での適用例を添える。

---

### 2.7 `/tools/agents/customization`

#### セクション
- プロジェクトローカルでの上書き（`.claude/agents/` 配下）
- カスタムスキル作成
- プロジェクト固有ルール追加
- `CLAUDE.md` の活用

#### コードサンプル
1. カスタムエージェントファイル全文
2. プロジェクト `CLAUDE.md` の典型例

---

### 2.8 `/tools/agents/troubleshooting`

- `/jsonui` で conductor が起動しない → `.claude/` の存在確認
- エージェントが MCP を呼ばない → `~/.claude.json` 確認、再起動
- スキルが発火しない → ファイル名・frontmatter 確認
- Rule が効かない → `.claude/jsonui-rules/` 配下確認

---

## 3. 必要 strings キー

prefix: `tools_agents_<page>_*`

概算 300 キー × 2 言語。

---

## 4. クロスリンク追加先

- `/learn/installation` → `/tools/agents/overview`
- `/tools/mcp/overview` → `/tools/agents/overview`
- 各 agent ページ → plan 32 (custom components) などの具体タスクページ

---

## 5. 実装チェックリスト

- [ ] 22+ ページ分の spec 作成
- [ ] strings キー追加
- [ ] 各エージェント / スキルページ CodeBlock ≥ 1
- [ ] 5 ルール全文引用 + 実例
- [ ] `~/.claude.json` / `.claude/agents/` の完全例
- [ ] クロスリンク追加
- [ ] `jui build` / `jui verify` / `jsonui-localize`

---

## 6. セッション分割の推奨境界

- **分割 A**: overview + install + workflow（3 ページ、2 時間）
- **分割 B**: 9 agent ページ（2-3 時間）
- **分割 C**: 11 skill ページ + rules + customization + troubleshooting（2 時間）
