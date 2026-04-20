# 00. プロジェクト全体像

## 1. 目的

JsonUI ファミリー（SwiftJsonUI / KotlinJsonUI / ReactJsonUI / jsonui-cli / jsonui-mcp-server / jsonui-test-runner / JsonUI-Agents-for-\* / jsonui-helper / Dynamic Mode / Hot Reload）の**統合ドキュメントサイト**を再構築する。

既存の `/Users/like-a-rolling_stone/resource/JsonUIDocument/` は実験段階の試作であり、本計画書の実装をもって**全削除・置換**する。

## 2. ターゲット層と優先順位

JsonUI は現在「個人開発の OSS ライブラリを今後広めていく」段階にあるため、既存ユーザーの後方互換性は考慮せず、新規流入と差別化を軸に優先順位を設計する。

| 順位 | 層 | 記号 | 備考 |
|------|----|----|------|
| 1 | 初心者 | A | JSON も触ったことがない層まで想定。Hello World から |
| 2 | AI エージェント連携を使う層 | E | JsonUI の最大の差別化ポイント。MCP サーバーと Agents 群をサイトで前面に |
| 3 | 他フレームワーク経験者 | C | SwiftUI / Compose / React 経験者を「乗り換え候補」として扱う |
| 4 | コントリビューター | D | OSS を広めるうえで重要 |
| 5 | 既存ユーザー | B | 最下位（存在自体は尊重するが、既存 API 互換の説明などは不要） |

## 3. スコープ一覧

| カテゴリ | 対象リポジトリ | 備考 |
|---------|---------------|------|
| コアライブラリ | SwiftJsonUI / KotlinJsonUI / ReactJsonUI | UIKit / SwiftUI / Compose / XML / Next.js |
| CLI | jsonui-cli（sjui / kjui / rjui / jui / jsonui-test / jsonui-doc） | Ruby + Python 製 |
| MCP サーバー | jsonui-mcp-server（29 ツール） | Group A（7）/ B（6）/ C（7）/ D（9） |
| テストランナー | jsonui-test-runner / jsonui-test-runner-ios | master 実装は前者。後者は空リポジトリ |
| AI エージェント | JsonUI-Agents-for-claude / JsonUI-Agents-for-Codex | 同等の内容を二種類 |
| 開発者ツール | **jsonui-helper**（VSCode 拡張、v0.1.0、publisher: `jsonui`） | 旧 `swiftjsonui-helper` は廃止済み。`jsonui-helper` が唯一の現行実装 |
| 実行時機能 | Dynamic Mode / Hot Reload | クロスプラットフォーム横断解説 |

### スコープ外

- `jsonui-agents`（古い別プロジェクトの名残。スルー）
- `swiftUITestApp` / `JsonUITest` 配下のテスト用プロジェクト（ドキュメント対象ではない）
- `*_wiki` 系リポジトリ（見つからない＝既存 wiki への依存を断ち、本サイトに統合）
- `kjuisampleapp` 等、開発用サンプルの個別紹介
- チュートリアル用のサンプルアプリ（ユーザー回答 7 により不要）

## 4. 基本方針

### 4.1 ドッグフーディング（jui オーケストレーション前提）

サイト本体を **jui + rjui（+ sjui / kjui）で実装**する。これは単なる ReactJsonUI ドッグフーディングではなく、**JsonUI 全体のクロスプラットフォームワークフローのショーケース**である。

- spec（`docs/screens/json/*.spec.json`）を Single Source of Truth とし、`jui generate project` で Layout JSON + ViewModel を生成
- `jui build` で Web（必須）/iOS/Android（野心的ショーケース）に配布
- 同じ spec / Layout JSON が 3 プラットフォームで動く事実こそが最強のデモ
- ReactJsonUI / SwiftJsonUI / KotlinJsonUI の不足機能（`CodeBlock`, `OpenApiViewer`, `SearchModal` 等）を洗い出し、各本体へコントリビュート
- コントリビューターが「jui ワークフローでこれだけのドキュメントサイトが組める」と確認できる教材
- Web は必須、iOS/Android は Phase 5 以降で最小配布セットを実装（Overview / Reference 数ページなど）

詳細は `02-tech-stack.md` / `02b-jui-workflow.md`。

### 4.2 多言語（日英同時）

最初から `ja` / `en` の 2 言語でリリース。`jui` の共通 strings 機構（`docs/screens/layouts/Resources/strings.json`）を正本とし、Web/iOS/Android それぞれに `jui build` で配布。詳細は `03-i18n.md`。

### 4.3 インタラクティブ機能は「属性検索のみ」

- ライブプレビュー / プレイグラウンド / AI アシスタント / バージョンスイッチャーは**不要**。
- 属性検索のみを実装し、28 コンポーネント × 全属性（共通 131 属性 + 各コンポーネント固有）を対象に**インクリメンタル検索**を提供。
- 実装詳細は `04-attribute-search.md`。

### 4.4 API リファレンス生成戦略（ハイブリッド）

- **MCP API**: Swagger / OpenAPI で**手書き**し、サイトに組み込む（Redoc または Swagger-UI）。
- **View 属性リファレンス**: `jsonui-cli/shared/core/attribute_definitions.json` と `jsonui-cli/shared/core/component_metadata.json` を入力として、**ビルド時に自動生成**。手書き補足（例・ユースケース・クロスプラットフォーム差分コメント）を上書きマージ。
- 詳細は `14-attribute-reference-generation.md`。

### 4.5 `jsonui-helper` の位置づけ

- 旧 `swiftjsonui-helper`（v1.7.0、publisher `swiftjsonui`）は廃止済み。バックアップのみ保持し、コードは `jsonui-helper` に完全移行済み。
- 現行実装は `/Users/like-a-rolling_stone/resource/jsonui-helper/`（v0.1.0、publisher `jsonui`）。Layout JSON / Screen Spec / Component Spec / Styles / Strings すべてに対応する、`jui_tools` 前提の新 VSCode 拡張。
- ドキュメント本文では**`swiftjsonui-helper` の歴史的記載は不要**（旧名を探しているユーザー向けに `16-migration-and-rollout.md` で 1 回だけ「`swiftjsonui-helper` は `jsonui-helper` に統合されました」と注記する程度）。
- 詳細は `12-content-plan-helper.md`。

## 5. 成功指標（KPI 候補）

| 指標 | 目安 | 備考 |
|------|------|------|
| 環境構築所要時間 | ワンライナー + PATH + 再起動 の 3 ステップを 5 分以内で完了 | `/learn/installation`（`18-content-plan-installation.md`）。agents + CLI + MCP を 1 コマンドで導入 |
| Hello World 完走率 | 5 分以内に iOS / Android / Web のいずれかで表示が出る | 「はじめに」→「Hello World」 |
| MCP ツール認知率 | MCP ページからの遷移ユーザーが Agents ページへも回遊 | AI 差別化の強化 |
| i18n カバレッジ | 全ページで `ja` / `en` が等価 | 未訳ゼロ |
| 属性検索ヒット率 | 28 コンポーネント × 共通 131 属性 + 各コンポーネント固有属性すべてがヒット | `attribute_definitions.json` から抽出 |
| Lighthouse | Performance ≥ 90 / Accessibility ≥ 95 | 静的生成（SSG）前提 |

## 6. トップレベル IA（情報設計）

詳細は `01-information-architecture.md`。以下は概観。

```
/                    ホーム
/learn               入門（初心者向け）
/guides              ガイド（タスク別）
/reference           リファレンス（属性・コンポーネント・CLI・MCP）
/platforms           プラットフォーム別
  /platforms/swift   SwiftJsonUI
  /platforms/kotlin  KotlinJsonUI
  /platforms/react   ReactJsonUI
/tools               補助ツール群
  /tools/cli         jsonui-cli
  /tools/mcp         jsonui-mcp-server
  /tools/test-runner jsonui-test-runner
  /tools/agents      JsonUI-Agents-for-\*
  /tools/helper      jsonui-helper（VSCode 拡張）
/concepts            横断概念
  /concepts/dynamic-mode
  /concepts/hot-reload
  /concepts/data-binding
  /concepts/specs
/search              属性検索
/community           コミュニティ（GitHub / Issues / Discussions）
/releases            リリースノート
```

## 7. 非目標（明示）

- プレイグラウンド、バージョン切替、ブラウザ内コード実行
- 英語以外の追加言語（まずは ja / en のみ）
- サンプルアプリ配布・チュートリアル用の完成プロジェクト
- 既存ユーザーへの移行ガイド

## 8. 参照

- ユーザー回答 9 項目（前セッションでの質疑）
- `jsonui-cli/docs/jui_tools_README.md`（本計画書のアーキテクチャ根拠、必読）
- `jsonui-cli/shared/core/attribute_definitions.json`（3917 行。28 コンポーネントの属性スキーマと `binding_direction` が同居する単一の正本）
- `jsonui-cli/shared/core/component_metadata.json`（jsonui-mcp-server が読む presentation metadata。説明・alias・プラットフォーム対応・ルール）
- `jsonui-mcp-server/docs/design.md`（MCP サーバーの現行設計書。29 ツール、4 グループ、4 層 fallback）

> **注**: 既存 `/Users/like-a-rolling_stone/resource/JsonUIDocument/` 配下のすべてのファイル（`src/` / `SPECIFICATION.md` / `IMPLEMENTATION_PLAN.md` / `package.json` / `rjui.config.json` など）は **完全破棄**。参照・流用・アーカイブは一切行わず、本計画書と上記参考資料のみを根拠にゼロから構築する。
