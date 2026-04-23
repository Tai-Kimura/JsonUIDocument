# 25. コンテンツプラン: Reference — CLI コマンドリファレンス

> Scope: 4〜6 時間 / 1〜2 セッション。6 CLI × 全サブコマンド = 約 40 コマンドの詳細リファレンス。
> 依存: plan 08 の構造設計。本プランは **本文** を書き下ろす。

---

## 1. 対象記事

| URL | spec | Layout |
|---|---|---|
| `/reference/cli-commands` | `docs/screens/json/reference/cli-commands.spec.json` | `docs/screens/layouts/reference/cli-commands.json`（現スタブ） |

本プランでは**全サブコマンドの統合リファレンスページ**として 1 画面にまとめる。個別ページ（`/tools/cli/jui/init` 等）は plan 08 ベースで別途実装（plan 37 で扱う）。

---

## 2. コンテンツ構造

### 2.1 導入セクション

#### 本文
- en: "JsonUI ships six CLIs. Each targets a specific platform or cross-cutting concern. All are installed via the one-liner from `/learn/installation`."
- ja: "JsonUI は 6 つの CLI を提供する。各プラットフォーム固有のものとクロスカット関心事を扱うものがある。全て `/learn/installation` のワンライナーでインストールされる。"

#### 一覧表（日英両方の列ヘッダ）

| Binary / バイナリ | Language / 言語 | Purpose / 用途 | Platform / 対象 |
|---|---|---|---|
| `jui` | Python | Unified generator / verifier / orchestrator | All / 全プラットフォーム |
| `sjui` | Ruby | SwiftJsonUI 開発ツール | iOS |
| `kjui` | Ruby | KotlinJsonUI 開発ツール | Android |
| `rjui` | Ruby | ReactJsonUI 開発ツール | Web |
| `jsonui-test` | Python | Test file validator & generator | Cross |
| `jsonui-doc` | Python | Documentation generator | Cross |

---

### 2.2 `jui`（Python）全サブコマンド

各サブコマンドを以下テンプレートで書き下ろす:

```markdown
#### `jui <command>`

**Synopsis**: `jui <command> [options]`

**Purpose**: （1 文の日英）

**Options**:
| Option | Type | Default | Description |
|---|---|---|---|

**Examples**:
```bash
$ jui <command> <example-args>
# Expected output (snippet)
```

**See also**: link to related commands
```

以下、各コマンドの具体コンテンツ:

#### `jui init`
- Synopsis: `jui init [--platforms <list>] [--project-name <name>]`
- Purpose(en): "Initialize a new JsonUI project in the current directory. Creates `jui.config.json`, platform scaffolding, and `.jsonui-type-map.json`."
- Purpose(ja): "カレントディレクトリに新しい JsonUI プロジェクトを初期化。`jui.config.json`、プラットフォーム足場、`.jsonui-type-map.json` を作成。"
- Options:
  | Option | Type | Default | Description |
  |---|---|---|---|
  | `--platforms` | comma-separated | `web` | Target platforms: `web` / `ios` / `android` |
  | `--project-name` | string | basename of cwd | Project identifier |
  | `--overwrite` | flag | `false` | Overwrite existing config files |
- Example:
  ```bash
  $ jui init --platforms web,ios --project-name myapp
  ✓ Created jui.config.json
  ✓ Created .jsonui-type-map.json
  ✓ Initialized jsonui-doc-web/
  ✓ Initialized jsonui-doc-ios/
  ```

#### `jui generate project` (alias: `jui g project`)
- Synopsis: `jui g project [--file <spec>] [--platforms <list>]`
- Purpose(en): "Generate Layout JSON + ViewModel stubs from screen spec(s). If `--file` is omitted, generates all specs in `docs/screens/json/`."
- Purpose(ja): "画面 spec から Layout JSON + ViewModel スタブを生成。`--file` 省略時は `docs/screens/json/` 内の全 spec を対象。"
- Options:
  | Option | Type | Default | Description |
  |---|---|---|---|
  | `--file` | path | all specs | Single spec file path |
  | `--platforms` | comma-separated | from config | Override target platforms |
  | `--force` | flag | `false` | Overwrite hand-edited Layout files |
- Example:
  ```bash
  $ jui g project --file docs/screens/json/learn/hello-world.spec.json
  ✓ Generated docs/screens/layouts/learn/hello-world.json
  ✓ Generated viewmodels: LearnHelloWorldViewModel.{ts,swift,kt}
  ```

#### `jui generate screen`
- Synopsis: `jui g screen --name <Name> [--route <path>]`
- Purpose(en): "Create a new screen spec skeleton + empty Layout + ViewModel stubs. Interactive prompts fill in metadata."
- Purpose(ja): "新規画面の spec 雛形 + 空 Layout + ViewModel スタブを作成。メタデータは対話プロンプトで入力。"
- Example:
  ```bash
  $ jui g screen --name UserProfile --route /user/profile
  ? Display name: User Profile
  ? Description: Show user's profile and edit actions
  ✓ Created docs/screens/json/user/profile.spec.json
  ```

#### `jui generate converter`
- Synopsis: `jui g converter --from <component-spec>`
- Purpose(en): "Create a custom component converter (Ruby source) from a component spec. Used for reusable UI widgets (CodeBlock, SearchModal, etc.)."
- Purpose(ja): "component spec からカスタムコンポーネント converter（Ruby）を生成。再利用可能な UI ウィジェット（CodeBlock, SearchModal など）に使う。"
- Example:
  ```bash
  $ jui g converter --from docs/screens/json/components/codeblock.component.json
  ✓ Generated rjui_tools/lib/converters/codeblock_converter.rb
  ```

#### `jui build`
- Synopsis: `jui build [--platforms <list>] [--watch]`
- Purpose(en): "Build the project for all configured platforms. Outputs validated, optimized artifacts. Must pass with zero warnings per JsonUI invariant #1."
- Purpose(ja): "設定済み全プラットフォーム向けにビルド。検証済み・最適化された成果物を出力。JsonUI 不変条件 #1 により警告ゼロで通過必須。"
- Options:
  | Option | Type | Default | Description |
  |---|---|---|---|
  | `--platforms` | comma-separated | from config | Override |
  | `--watch` | flag | `false` | Rebuild on file change |
  | `--verbose` | flag | `false` | Detailed per-file log |
- Example:
  ```bash
  $ jui build
  ✓ Built jsonui-doc-web (44 layouts, 0 warnings)
  ✓ Built jsonui-doc-ios (44 layouts, 0 warnings)
  ```

#### `jui verify`
- Synopsis: `jui verify [--fail-on-diff] [--quiet]`
- Purpose(en): "Verify that no hand-edited `@generated` files drift from the spec. Core guard for JsonUI invariant #2."
- Purpose(ja): "`@generated` ファイルの手作業編集が spec から乖離していないか検証。JsonUI 不変条件 #2 の中核ガード。"
- Example:
  ```bash
  $ jui verify --fail-on-diff
  ✓ All 44 layouts match their specs
  ```

#### `jui migrate-layouts`
- Synopsis: `jui migrate-layouts --from <old-version>`
- Purpose(en): "One-shot migration for breaking changes between JsonUI versions. Applies AST transforms to all Layout JSON files."
- Purpose(ja): "JsonUI バージョン間の破壊的変更に対する一括移行。全 Layout JSON に AST 変換を適用。"

#### `jui sync-tool`
- Synopsis: `jui sync-tool [<tool-name>]`
- Purpose(en): "Pull latest versions of `rjui_tools` / `sjui_tools` / `kjui_tools` from upstream. Used after library bug fixes are released."
- Purpose(ja): "`rjui_tools` / `sjui_tools` / `kjui_tools` を upstream から最新化。ライブラリバグ修正後に使う。"

#### `jui lint-generated`（CI-only、Bash 経由）
- Synopsis: `jui lint-generated`
- Purpose(en): "CI-only linter that ensures generated files still match expected header markers. Does not run via MCP."
- Purpose(ja): "`@generated` ファイルのヘッダマーカー整合を検証する CI 専用リンター。MCP 経由では動かない。"

---

### 2.3 `sjui`（Ruby, iOS）全サブコマンド

各サブコマンドを同じテンプレートで:

#### `sjui init`, `sjui setup`
- `sjui init`: Ruby プロジェクトに SwiftJsonUI 拡張を追加。`sjui.config.json` 作成。
- `sjui setup`: CocoaPods / SPM 依存解決、Hot Loader 設定。

#### `sjui generate <type> <name>`, `sjui destroy <type> <name>`
- `type` = `view` / `viewcontroller` / `cell` / `style`
- Example:
  ```bash
  $ sjui generate view HomeView
  ✓ Created Layouts/home_view.json
  ✓ Created ViewControllers/HomeViewController.swift
  ```

#### `sjui convert <layout.json>`
- Purpose: Convert a Layout JSON to SwiftUI / UIKit source code. Used for Dynamic Mode inspection.

#### `sjui validate`
- Purpose: Validate all Layout JSON files against SwiftJsonUI attribute schema.

#### `sjui watch`
- Purpose: File watcher. On layout change, regenerates Swift code and pushes to Hot Loader connected device.

#### `sjui hotload start/stop/status`
- `start`: Hot Loader サーバー起動（ローカル 8080）。
- `stop`: サーバー停止。
- `status`: サーバー稼働状況 + 接続中デバイス表示。

#### `sjui build`
- Purpose: `xcodebuild` ラッパ。JsonUI 拡張（strings 合成、asset 展開）を前処理。

---

### 2.4 `kjui`（Ruby, Android）全サブコマンド

#### `kjui init`, `kjui setup`
- `kjui init`: Gradle プロジェクトに KotlinJsonUI 拡張追加。`kjui.config.json` 作成。
- `kjui setup`: Gradle 依存、Navigation 設定。

#### `kjui generate <type> <name>`, `kjui destroy <type> <name>`
- `type` = `fragment` / `activity` / `view` / `cell` / `style`

#### `kjui generate-xml <layout.json>`
- Purpose: Layout JSON を Android XML に変換（Compose モードでない場合）。

#### `kjui watch`
- Purpose: ファイル監視 + Kotlin コード再生成 + Hot Loader 送信。

---

### 2.5 `rjui`（Ruby, Web）全サブコマンド

#### `rjui init`, `rjui setup`
- `rjui init`: Next.js プロジェクトに ReactJsonUI 拡張追加。
- `rjui setup`: Tailwind CSS 設定、ReactJsonUI ランタイム統合。

#### `rjui generate <type> <name>`
- `type` = `page` / `component` / `cell` / `viewmodel`

#### `rjui dev`
- Purpose: Next.js dev サーバー + rjui ファイル監視の統合起動。

---

### 2.6 `jsonui-test`（Python, cross）全サブコマンド

#### `jsonui-test validate <path>`
- Purpose: テスト JSON ファイルの検証（スキーマ、参照完全性、要素 ID 存在確認）。
- Example:
  ```bash
  $ jsonui-test validate tests/
  ✓ 12 screen tests valid
  ✓ 3 flow tests valid
  ```

#### `jsonui-test generate screen <screen-spec>`
- Purpose: screen spec から screen test 雛形を自動生成。

#### `jsonui-test generate flow <name>`
- Purpose: flow test 雛形を生成。

#### `jsonui-test run [--driver <driver>]`
- Purpose: テストを実際に実行。driver は `web` (Playwright) / `ios` (XCUITest) / `android` (UIAutomator)。

---

### 2.7 `jsonui-doc`（Python, cross）全サブコマンド

#### `jsonui-doc init <project>`
- Purpose: JsonUI ドキュメントサイトを初期化。

#### `jsonui-doc generate spec <spec-file>`
- Purpose: spec から HTML 文書を生成。

#### `jsonui-doc generate component <component-spec>`
- Purpose: component spec から HTML 文書を生成。

#### `jsonui-doc validate spec <spec-file>`
- Purpose: spec とその HTML 文書が整合しているか検証。

#### `jsonui-doc rules init/show`
- Purpose: プロジェクトローカルのドキュメントルール初期化・表示。

---

### 2.8 各 CLI の設定ファイル

| CLI | 設定ファイル | 主要キー |
|---|---|---|
| `jui` | `jui.config.json` | `platforms`, `specDir`, `layoutDir`, `hooks` |
| `sjui` | `sjui.config.json` | `layoutsDir`, `viewControllersDir`, `hotLoader` |
| `kjui` | `kjui.config.json` | `layoutsDir`, `fragmentsDir`, `composeMode` |
| `rjui` | `rjui.config.json` | `pagesDir`, `componentsDir`, `tailwindConfig` |

各設定ファイルの完全キーリファレンスは `/tools/cli/jui/config` 等の個別ページに誘導（plan 37）。

---

## 3. 必要な strings キー

`cli_ref_*` prefix を日英 2 言語:

- `cli_ref_intro_title`, `cli_ref_intro_body`
- `cli_ref_cli_list_header_*`（表ヘッダ: binary/language/purpose/platform）
- 各 CLI の section heading: `cli_ref_section_jui`, `cli_ref_section_sjui`, ...
- `cli_ref_subcommand_<name>_purpose`（各サブコマンドの目的）
- `cli_ref_option_<name>_desc`（各オプションの説明）

概算 200 キー × 2 言語。

---

## 4. クロスリンク追加先

- `/learn/installation` の CTA 下 → `/reference/cli-commands`
- `/guides/writing-your-first-spec` の「コマンド実行」節 → 各 `jui` コマンドへ
- `/tools/cli/overview` から本ページへ「全コマンド一覧」リンク

---

## 5. 実装チェックリスト

- [ ] `docs/screens/json/reference/cli-commands.spec.json` の `metadata.description` 更新
- [ ] 40 サブコマンド分の strings キー追加
- [ ] コマンドの Options 表データを `docs/data/cli-commands.json` に構造化（日英）
- [ ] `jui g project` で Layout 再生成
- [ ] CodeBlock サンプルを各コマンド 1 個以上（bash 言語タグ）
- [ ] クロスリンク追加（3 箇所）
- [ ] `jui build` 0 warnings
- [ ] `jui verify --fail-on-diff`
- [ ] `jsonui-localize`

---

## 6. データファイル形式

`docs/data/cli-commands.json`:

```json
{
  "commands": [
    {
      "binary": "jui",
      "command": "init",
      "synopsis": "jui init [--platforms <list>] [--project-name <name>]",
      "purpose": { "en": "...", "ja": "..." },
      "options": [
        {
          "name": "--platforms",
          "type": "comma-separated",
          "default": "web",
          "description": { "en": "...", "ja": "..." }
        }
      ],
      "examples": [
        {
          "language": "bash",
          "code": "$ jui init --platforms web,ios --project-name myapp\n✓ Created jui.config.json"
        }
      ],
      "seeAlso": ["jui generate project", "jui build"]
    }
  ]
}
```

---

## 7. セッション分割の推奨境界

- **分割 A**: 導入 + `jui` 全サブコマンド（3 時間、本家 CLI で最重要）
- **分割 B**: `sjui` / `kjui` / `rjui`（2〜3 時間、プラットフォーム別）
- **分割 C**: `jsonui-test` / `jsonui-doc`（1 時間、ツール系）
