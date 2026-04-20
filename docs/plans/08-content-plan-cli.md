# 08. コンテンツプラン: jsonui-cli セクション

> **実装アーキテクチャ（本計画書共通）:** 各ページは `docs/screens/json/tools/cli/**/*.spec.json` で定義し、
> `jui g project` で Layout JSON + ViewModel を生成、`jui build` で配布。
> 詳細は `02-tech-stack.md` / `02b-jui-workflow.md` / `17-spec-templates.md`。
>
> Layout の置き場: `docs/screens/layouts/tools/cli/**/*.json`
> サイドバー: `docs/screens/layouts/common/sidebar_tools_cli.json`（`platforms: ["web"]`）
>
> コマンド一覧は `Collection + cellClasses` で描画（`cells/command_row.json`）。

## 1. 対象リポジトリ

`/Users/like-a-rolling_stone/resource/jsonui-cli/`

## 2. サブツール一覧

| ツール | プラットフォーム | 言語 | バイナリ | 用途 |
|-------|----------------|------|--------|------|
| **sjui_tools** | iOS | Ruby | `sjui` | SwiftJsonUI 開発 CLI |
| **kjui_tools** | Android | Ruby | `kjui` | KotlinJsonUI 開発 CLI |
| **rjui_tools** | Web | Ruby | `rjui` | ReactJsonUI 開発 CLI |
| **jui_tools** | クロスプラットフォーム | Python | `jui` | 統一ジェネレータ／Verifier |
| **test_tools** | クロスプラットフォーム | Python | `jsonui-test` | テストファイル検証・生成 |
| **document_tools** | クロスプラットフォーム | Python | `jsonui-doc` | ドキュメント生成 |

## 3. ページ構成

```
/tools/cli
├── /tools/cli/overview                      CLI 全体像
├── /tools/cli/install                       インストール（bootstrap / local）
├── /tools/cli/jui                           jui (Python)
│   ├── /tools/cli/jui/overview
│   ├── /tools/cli/jui/init
│   ├── /tools/cli/jui/generate-project
│   ├── /tools/cli/jui/generate-screen
│   ├── /tools/cli/jui/generate-converter
│   ├── /tools/cli/jui/build
│   ├── /tools/cli/jui/verify
│   ├── /tools/cli/jui/migrate-layouts
│   └── /tools/cli/jui/config                jui.config.json
├── /tools/cli/sjui                          sjui (Ruby)
│   ├── /tools/cli/sjui/overview
│   ├── /tools/cli/sjui/init
│   ├── /tools/cli/sjui/setup
│   ├── /tools/cli/sjui/generate
│   ├── /tools/cli/sjui/destroy
│   ├── /tools/cli/sjui/build
│   ├── /tools/cli/sjui/convert
│   ├── /tools/cli/sjui/validate
│   ├── /tools/cli/sjui/watch
│   ├── /tools/cli/sjui/hotload
│   └── /tools/cli/sjui/config               sjui.config.json
├── /tools/cli/kjui                          kjui (Ruby)
│   ├── /tools/cli/kjui/overview
│   ├── /tools/cli/kjui/init
│   ├── /tools/cli/kjui/setup
│   ├── /tools/cli/kjui/generate
│   ├── /tools/cli/kjui/generate-xml
│   ├── /tools/cli/kjui/build
│   ├── /tools/cli/kjui/hotload
│   └── /tools/cli/kjui/config               kjui.config.json
├── /tools/cli/rjui                          rjui (Ruby)
│   ├── /tools/cli/rjui/overview
│   ├── /tools/cli/rjui/init
│   ├── /tools/cli/rjui/build
│   ├── /tools/cli/rjui/generate
│   ├── /tools/cli/rjui/watch
│   ├── /tools/cli/rjui/hotload
│   └── /tools/cli/rjui/config               rjui.config.json
├── /tools/cli/jsonui-test                   jsonui-test (Python)
│   ├── /tools/cli/jsonui-test/overview
│   ├── /tools/cli/jsonui-test/validate
│   ├── /tools/cli/jsonui-test/generate
│   └── /tools/cli/jsonui-test/config
├── /tools/cli/jsonui-doc                    jsonui-doc (Python)
│   ├── /tools/cli/jsonui-doc/overview
│   ├── /tools/cli/jsonui-doc/init-spec
│   ├── /tools/cli/jsonui-doc/init-component
│   ├── /tools/cli/jsonui-doc/validate-spec
│   ├── /tools/cli/jsonui-doc/validate-component
│   ├── /tools/cli/jsonui-doc/generate-spec
│   ├── /tools/cli/jsonui-doc/generate-component
│   ├── /tools/cli/jsonui-doc/generate-html
│   ├── /tools/cli/jsonui-doc/generate-mermaid
│   ├── /tools/cli/jsonui-doc/generate-adapter
│   ├── /tools/cli/jsonui-doc/rules-init
│   ├── /tools/cli/jsonui-doc/rules-show
│   ├── /tools/cli/jsonui-doc/figma-fetch
│   └── /tools/cli/jsonui-doc/figma-images
└── /tools/cli/shared                        shared/core（attribute_definitions.json 等）
```

## 4. 共通テンプレ（各コマンドページ）

1. **概要**（1 文）
2. **CLI シグネチャ**
3. **パラメータ**（表）
4. **使用例**
5. **入力・出力ファイル**
6. **依存する設定ファイル**
7. **よくあるエラー**
8. **関連コマンド**

## 5. 代表的なコマンドの詳細（抜粋）

### 5.1 `jui init`
- 入力: なし
- 出力: `jui.config.json`, `docs/specs/`, `layouts/`, `.jui_cache.json`
- 既存プロジェクトへの非破壊追加可

### 5.2 `jui generate project`
（`jsonui-cli/jui_tools/jui_cli/commands/generate_cmd.py` より確認済み）

- Options:
  - `--file <spec>` — 単一 spec 処理
  - `--force` — declaration 上書き
  - `--skip-layout` — Layout JSON 生成スキップ
  - `--dry-run` — 生成予定のみ表示
  - `--ios-only` / `--android-only` / `--web-only`
  - `--type-map <path>` — 型マップ差し替え
- 処理フロー:
  1. Spec バリデーション（`document_tools.spec_doc.validator`）
  2. `parent_spec` のマージ
  3. Repository / UseCase の集約
  4. プラットフォーム別に ViewModel / Repository / UseCase / Layout JSON を生成
- 既存ファイルは **declaration のみ更新**、実装は上書きしない
- Layout 生成は `config_mgr.layouts_directory`（共有ディレクトリ）にアウトプット

### 5.3 `jui generate screen`
- `jui g screen Login` で `docs/specs/login.spec.json` テンプレ生成
- 複数名 OK: `jui g screen Login Register UserProfile`
- `--display-name` で表示名指定

### 5.4 `jui generate converter`
- サブモード:
  - `jui g converter MyCard` — 直接指定
  - `jui g converter --from my_card.component.json` — component spec 由来
  - `jui g converter --all` — component spec 全処理
- 各プラットフォーム CLI (`sjui g converter`, `kjui g converter`, `rjui g converter`) を内部で呼び出す

### 5.5 `jui build`
- 各プラットフォーム CLI の `build` を統括して実行
- Layouts は共有ディレクトリから各プラットフォームへ配布

### 5.6 `jui verify`
- Layout JSON の差分を検出
- CI 統合時に使う

### 5.7 `jui migrate-layouts`
- 既存プロジェクトの Layouts を共有ディレクトリへ統合
- Cross-platform migration（Option 3）で使用

### 5.8 `sjui g view <name>` / `kjui g view <name>` / `rjui g view <name>`
- 各プラットフォーム専用の single view scaffold
- `sjui g converter` / `kjui g converter` / `rjui g converter` のカスタムコンポーネント生成

### 5.9 `sjui hotload` / `kjui hotload` / `rjui hotload`
- `jsonui-cli/{sjui,kjui,rjui}_tools/lib/hotloader/` の `server.js` をブート
- `ip_monitor.rb` で LAN 内アプリとの接続

### 5.10 `jsonui-test validate <path>`
- `jsonui-test-runner` のスキーマで `.test.json` を検証
- エラー行・列を表示

### 5.11 `jsonui-doc generate spec`
- Spec → HTML/Markdown
- 単一ファイル / ディレクトリ（バッチ）

### 5.12 `jsonui-doc generate html`
- テストファイルディレクトリから HTML 一括生成
- Figma JSON も自動取り込み

### 5.13 `jsonui-doc figma fetch`
- Figma File API を呼び、JSON + 画像を取得
- プランによるレート制限サポート
- `FIGMA_TOKEN` 環境変数

## 6. 代表 CLI シグネチャ一覧（早見表）

サイト上では 1 ページに 1 コマンドだが、サマリ表を `/tools/cli/overview` 先頭に配置:

| カテゴリ | コマンド |
|---------|---------|
| init | `jui init`, `sjui init`, `kjui init`, `rjui init` |
| generate | `jui g {project,screen,converter}`, `sjui g view`, `sjui g converter`, `kjui g view`, `kjui g converter`, `rjui g view`, `rjui g converter` |
| build | `jui build`, `sjui build`, `kjui build`, `rjui build` |
| watch/hotload | `sjui watch`, `sjui hotload`, `kjui hotload`, `rjui watch`, `rjui hotload` |
| verify | `jui verify`, `sjui validate` |
| test | `jsonui-test validate`, `jsonui-test generate` |
| doc | `jsonui-doc init {spec,component}`, `jsonui-doc validate {spec,component}`, `jsonui-doc generate {spec,component,html,mermaid,adapter,doc}`, `jsonui-doc figma {fetch,images}` |
| migrate | `jui migrate-layouts` |

## 7. 自動生成の機会

- 各コマンドの `--help` 出力をスクリプトで収集し、ページに埋め込む（ビルド時）
- Python CLI は `argparse` ベース、Ruby CLI は `optparse` ベースなので、プログラムで構造を抽出可能
- 長期的には `jsonui-cli` 側に `--docs` フラグを追加して JSON メタデータを出力する提案（Phase 6 以降）

## 8. Strings 追加キー

`tools_cli_*` プレフィックスで約 50 キー × 2 言語（細分化するため多い）。

## 9. 実装チェックリスト

- [ ] `docs/screens/json/tools/cli/**/*.spec.json` 約 55 枚（`jui g screen` 一括生成）
- [ ] 各 spec に対し `jui g project --file ...` で Layout + ViewModel
- [ ] `docs/screens/layouts/tools/cli/**/*.json` 手作業で仕上げ
- [ ] `jsonui-doc-web/src/app/tools/cli/**/page.tsx` ルート
- [ ] `docs/screens/layouts/common/sidebar_tools_cli.json`（`platforms: ["web"]`、折りたたみ対応）
- [ ] Strings `tools_cli_*` を `Resources/strings.json` に追加
- [ ] コマンド早見表 `/tools/cli/overview` は `Collection + cells/command_row`
- [ ] 各コマンドページの `--help` 出力はビルド時収集スクリプトで反映（Phase 5 相当）
