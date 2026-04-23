# JsonUIDocument 新設計計画 インデックス

本ディレクトリは、JsonUI ファミリー全体を対象とした**統合ドキュメントサイト**の設計計画書群です。
既存 `/Users/like-a-rolling_stone/resource/JsonUIDocument/` は全削除前提で、**`jui` を orchestrator とするクロスプラットフォーム JsonUI プロジェクト**として再構築します。

> **アーキテクチャ根幹:** ドキュメントサイトは「ReactJsonUI 単独で Next.js サイトを自作する」のではなく、
> **spec（`docs/screens/json/*.spec.json`）を Single Source of Truth とし、`jui generate project` で
> Layout JSON + ViewModel を生成、`jui build` で Web（必須）/ iOS/Android（野心的ショーケース）に配布する**プロジェクトとして構築します。
> 詳細: `02-tech-stack.md` / `02b-jui-workflow.md`。

> 前提条件の根拠: ユーザー回答（9 項目）・調査結果は本計画書の全体に反映されています。詳細は `00-overview.md` を参照。

---

## ターゲット層（優先順位）

1. **A** 初心者（最優先）
2. **E** AI エージェント連携を使う層
3. **C** 他フレームワーク経験者（乗り換え候補）
4. **D** コントリビューター
5. **B** 既存ユーザー（最下位）

---

## カバー範囲（全部）

- SwiftJsonUI（UIKit / SwiftUI 両モード）
- KotlinJsonUI（Compose / XML 両モード）
- ReactJsonUI（Next.js）
- jsonui-cli（sjui / kjui / rjui / jui / jsonui-test / jsonui-doc）
- jsonui-mcp-server（29 MCP ツール。Group A 7 / B 6 / C 7 / D 9）
- jsonui-test-runner（screen / flow / actions）
- jsonui-test-runner-ios（XCUITest ドライバ／現在は空リポジトリ、master は `jsonui-test-runner/drivers/ios`）
- JsonUI-Agents-for-claude / JsonUI-Agents-for-Codex
- Dynamic Mode / Hot Reload
- JSON Schema / 属性リファレンス
- jsonui-helper（VSCode 拡張、v0.1.0、publisher `jsonui`。旧 `swiftjsonui-helper` は廃止済み）

---

## ファイル一覧

| # | ファイル | 役割 |
|---|---------|------|
| 00 | `00-overview.md` | プロジェクト全体像、ターゲット層、優先順位、成功指標 |
| 01 | `01-information-architecture.md` | サイト構成、URL ↔ spec ファイル対応、TabView / include / Collection を使った IA |
| **02** | **`02-tech-stack.md`** | **jui ワークフロー設計、`jui.config.json`、3 プラットフォーム配布** |
| **02b** | **`02b-jui-workflow.md`** | **1 ページ分の spec → Layout → build 完全サンプル（Label リファレンス）** |
| 03 | `03-i18n.md` | 日英同時スタートの実装方針（jui 共通 strings 機構に乗る） |
| 04 | `04-attribute-search.md` | 全 View / 全属性を対象とするインクリメンタル検索の設計（Web 専用、spec で構築） |
| 05 | `05-content-plan-swiftjsonui.md` | SwiftJsonUI セクションのページ構成と spec 設計 |
| 06 | `06-content-plan-kotlinjsonui.md` | KotlinJsonUI セクションのページ構成と spec 設計 |
| 07 | `07-content-plan-reactjsonui.md` | ReactJsonUI セクション + 「dogfooding」ページ |
| 08 | `08-content-plan-cli.md` | jsonui-cli（jui / sjui / kjui / rjui / jsonui-test / jsonui-doc） |
| 09 | `09-content-plan-mcp-server.md` | MCP サーバー。Swagger 手書き戦略含む |
| 10 | `10-content-plan-test-runner.md` | jsonui-test-runner / test-runner-ios |
| 11 | `11-content-plan-agents.md` | JsonUI-Agents-for-claude / -for-Codex |
| 12 | `12-content-plan-helper.md` | jsonui-helper（VSCode 拡張） |
| 13 | `13-content-plan-dynamic-hot-reload.md` | Dynamic Mode / Hot Reload 横断解説 |
| 14 | `14-attribute-reference-generation.md` | 属性リファレンスの自動生成戦略（spec を自動生成するハイブリッド） |
| **15** | **`15-toolchain.md`** | **jui.config.json、`.jsonui-type-map.json`、`jsonui-doc-web`/`-ios`/`-android`、CI** |
| 16 | `16-migration-and-rollout.md` | 既存削除 → jui init → フェーズ別ロールアウト |
| **17** | **`17-spec-templates.md`** | **ページ種別ごとの spec テンプレート雛形集** |
| **18** | **`18-content-plan-installation.md`** | **`/learn/installation` — agents + CLI + MCP のワンライナーインストール要件** |

太字は本設計の大幅修正／新規ファイル。

### Phase 2: コンテンツ拡充ロードマップ（plans 19〜41 / `content-expansion/`）

既存 plans 00〜18 は**設計・骨組み**まで。各記事の**具体的な本文・コードサンプル・クロスリンク**を記事単位で詳細化するのが plans 19〜41、全て `content-expansion/` サブディレクトリ配下。UI / レイアウト構造には触れない（デザイン改修中のため）。

→ 詳細インデックス: [`content-expansion/README.md`](content-expansion/README.md)
→ マスターロードマップ: [`content-expansion/19-content-expansion-roadmap.md`](content-expansion/19-content-expansion-roadmap.md)

別セッションで処理する場合は `content-expansion/19-content-expansion-roadmap.md` → 目的の plan の順に読むこと。

---

## 読む順番（実装者向け）

1. **`jsonui-cli/docs/jui_tools_README.md`** を先に熟読（jui ワークフローの根本、**必読**）
2. **`00-overview.md`** — プロジェクト全体像
3. **`02-tech-stack.md`** — 本計画の根幹アーキテクチャ
4. **`02b-jui-workflow.md`** — 1 ページ分の完全サンプル（ここで手が動くようになる）
5. **`15-toolchain.md`** — 具体的なファイル構成・コマンド
6. **`16-migration-and-rollout.md`** — Phase 分割
7. **`17-spec-templates.md`** — spec 雛形
8. **`01-information-architecture.md`** — URL ↔ spec マッピング
9. **`03-i18n.md`** / **`04-attribute-search.md`** / **`14-attribute-reference-generation.md`** — 共通仕組み
10. **`05`〜`13`** — 担当セクションのコンテンツプラン

---

## 実装フェーズの要約

- **Phase 0**: 設計レビュー、既存ファイル全削除（バックアップ不要）
- **Phase 1**: jui プロジェクト足場（`jui init` + `jsonui-doc-web` セットアップ）
- **Phase 2**: 共通 spec テンプレ一括生成、共通部品（Header / Sidebar / Footer / Breadcrumb / TOC）、独自 Converter（`CodeBlock` / `TableOfContents` / `SearchModal` / `SearchTrigger` / `OpenApiViewer` / `JsonSchemaViewer` — いずれも `component_spec` 先行で `jui g converter --from <spec>`）
- **Phase 3**: ライブラリ別コンテンツ（SwiftJsonUI / KotlinJsonUI / ReactJsonUI）
- **Phase 4**: Tools（CLI / MCP / test-runner / Agents / Helper）
- **Phase 5**: 概念 + 属性リファレンス自動生成 + **iOS/Android ショーケース**
- **Phase 6**: Learn / Guides / 検索本実装 / 仕上げ
- **Phase 7**: 切替・公開

各ファイルは**別セッションで実装を開始できる粒度**で書かれています。
