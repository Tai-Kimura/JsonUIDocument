# 37. コンテンツプラン: Tools — `/tools/cli` 記事群

> Scope: 4〜6 時間 / 1〜2 セッション。plan 08 の CLI ページ構成（overview + install + 6 ツール × サブコマンド群）の本文を書く。
> 依存: plan 25（reference/cli-commands の詳細リファレンス）、plan 08（構造設計）。

reference/cli-commands（plan 25）が**全サブコマンドの網羅リファレンス**なのに対し、本プランは**読み物としての tools/cli 配下**（overview、install、各ツールの使い方チュートリアル）を書く。重複防止のため、詳細仕様は reference に委ね、本セクションは「いつ使うか／代表的シナリオ／ワークフロー」に特化。

---

## 1. 対象記事

plan 08 §3 から抜粋:

| URL | 役割 | 備考 |
|---|---|---|
| `/tools/cli/overview` | CLI 全体像 | 必須 |
| `/tools/cli/install` | インストール方法 | `/learn/installation` 誘導中心 |
| `/tools/cli/jui/overview` | `jui` の概要 + 代表ワークフロー | 必須 |
| `/tools/cli/jui/init` | `jui init` の使い方 | 短いチュートリアル |
| `/tools/cli/jui/generate-project` | `jui g project` ワークフロー | spec → Layout の流れ |
| `/tools/cli/jui/generate-screen` | `jui g screen` ワークフロー | 新規画面の始め方 |
| `/tools/cli/jui/generate-converter` | `jui g converter` ワークフロー | custom component 用（plan 32 へ誘導） |
| `/tools/cli/jui/build` | `jui build` ワークフロー | |
| `/tools/cli/jui/verify` | `jui verify` ワークフロー | |
| `/tools/cli/jui/migrate-layouts` | `jui migrate-layouts` | バージョンアップ時 |
| `/tools/cli/jui/config` | `jui.config.json` リファレンス | |
| `/tools/cli/sjui/*` | `sjui` サブページ群（10 ページ） | plan 33 と相互参照 |
| `/tools/cli/kjui/*` | `kjui` サブページ群（10 ページ） | plan 34 と相互参照 |
| `/tools/cli/rjui/*` | `rjui` サブページ群（10 ページ） | plan 35 と相互参照 |
| `/tools/cli/jsonui-test/*` | 簡素 | plan 40（tools/test-runner）と重複注意 |
| `/tools/cli/jsonui-doc/*` | 簡素 | |

---

## 2. 各ページの書き下ろすべき内容

### 2.1 `/tools/cli/overview`

#### セクション

**CLI 全体図**
- en: "JsonUI ships six CLIs. Use `jui` for cross-platform operations; use `sjui` / `kjui` / `rjui` for platform-specific tasks."
- ja: "JsonUI は 6 つの CLI を同梱。クロスプラットフォーム操作は `jui`、プラットフォーム固有タスクは `sjui` / `kjui` / `rjui` を使う。"

**決定フロー**
- 新規プロジェクト → `jui init`
- 新規画面 → `jui g screen`
- Layout 再生成 → `jui g project`
- ビルド → `jui build`
- 検証 → `jui verify`
- プラットフォーム固有（iOS Hot Loader 起動など）→ `sjui` / `kjui` / `rjui`

**`jui` と `sjui` / `kjui` / `rjui` の分担**

| 責務 | CLI |
|---|---|
| spec ↔ Layout / ViewModel 生成 | `jui` |
| プラットフォーム固有 scaffold（Fragment, ViewController 等） | `sjui` / `kjui` / `rjui` |
| プラットフォーム固有ビルド（Xcode, Gradle, Next.js） | `jui build` が内部で呼ぶ |
| Hot Loader | `sjui hotload` / `kjui hotload` / Next.js HMR |

#### コードサンプル
1. 典型ワークフローのコマンド列（`jui init` → `jui g screen` → `jui g project` → `jui build`）
2. プラットフォーム固有の追加ステップ例

---

### 2.2 `/tools/cli/install`

plan 18 の `/learn/installation` に誘導。本ページは「CLI のみ」「手動インストール」の簡易版:

- ワンライナー（`/learn/installation` へのリンク）
- 手動 git clone での CLI のみ install
- PATH 追加
- `jui --version` で確認

---

### 2.3 `/tools/cli/jui/overview`

#### セクション

- `jui` は 8 サブコマンドを持つ（list + brief purpose）
- 内部構造（Python / argparse ベース）
- 主要データ入力: `jui.config.json`, spec files
- 主要データ出力: Layout JSON, ViewModel stubs, strings.json

**8 サブコマンド表**（詳細は `/reference/cli-commands` へ）:

| Command | Purpose | 代表シナリオ |
|---|---|---|
| `jui init` | プロジェクト初期化 | 新規作成 |
| `jui g project` | spec → Layout + ViewModel | 画面を spec から生成 |
| `jui g screen` | spec 雛形作成 | 新規画面追加 |
| `jui g converter` | custom component converter 生成 | ウィジェット作成 |
| `jui build` | 全プラットフォームビルド | 成果物作成 |
| `jui verify` | spec ↔ 生成物の整合検証 | PR 前チェック |
| `jui migrate-layouts` | バージョン間変換 | バージョンアップ |
| `jui sync-tool` | 下位 CLI の更新 | ライブラリ修正後 |

---

### 2.4 `/tools/cli/jui/init`

#### セクション
- 使用場面: 新しい JsonUI プロジェクトを始めるとき
- 入力（対話または flag）
- 生成されるファイル一覧
- 典型的な対話ログ（完全な output を CodeBlock で）
- 次のステップ（→ `jui g screen`）

#### コードサンプル
1. 対話的 `jui init` の完全 session
2. flag 指定の例

---

### 2.5 `/tools/cli/jui/generate-project`

#### セクション
- 使用場面: spec を書いた／更新した後
- `--file` 指定 vs 全 spec 再生成
- 生成物（Layout JSON / ViewModel stubs / Repository stubs）
- 既存ファイルの扱い（`__@generated` マーカー尊重、手書き部分保持）

#### コードサンプル
1. 単一 spec 再生成
2. 全 spec 再生成
3. 生成ログの見方

---

### 2.6 `/tools/cli/jui/generate-screen`

#### セクション
- 使用場面: 新規画面を追加するとき
- 生成される spec の雛形
- `jui g project` への繋がり

#### コードサンプル
1. 対話的 `jui g screen` の完全 session
2. 生成された spec.json 全文

---

### 2.7 `/tools/cli/jui/generate-converter`

#### セクション
- 使用場面: custom component を追加するとき
- plan 32 への誘導メイン（詳細はそちら）

---

### 2.8 `/tools/cli/jui/build`

#### セクション
- 使用場面: 全プラットフォーム向けに成果物を作りたいとき
- `--platforms` による絞込み
- `--watch` モード
- 出力先ディレクトリ
- Warning の対処（`jui build` は 0 warnings で通過必須：不変条件 #1）

#### コードサンプル
1. 全プラットフォームビルド出力
2. `--watch` モードログ
3. Warning が出たときの読み方

---

### 2.9 `/tools/cli/jui/verify`

#### セクション
- 使用場面: PR 提出前・CI で
- `--fail-on-diff` の意味
- Drift 検出時の対処（`@generated` 手編集を spec 更新に戻す）

#### コードサンプル
1. Clean pass の output
2. Drift 検出時の output と diff 表示

---

### 2.10 `/tools/cli/jui/migrate-layouts`

#### セクション
- 使用場面: JsonUI version を上げた直後
- 対象となる破壊的変更の例
- 安全に移行するための手順（バックアップ、ブランチ切り）

---

### 2.11 `/tools/cli/jui/config`

`jui.config.json` の全フィールドリファレンス:

```json
{
  "platforms": ["web", "ios", "android"],
  "specDir": "docs/screens/json",
  "layoutDir": "docs/screens/layouts",
  "stringsDir": "docs/strings",
  "cellsDir": "docs/screens/cells",
  "outputs": {
    "web": { "root": "jsonui-doc-web", "viewModelDir": "src/viewmodels", "router": "app" },
    "ios": { "root": "jsonui-doc-ios", "viewModelDir": "Sources/ViewModels", "mode": "swiftui" },
    "android": { "root": "jsonui-doc-android", "viewModelDir": "app/src/main/java/.../viewmodels", "mode": "compose" }
  },
  "locales": ["en", "ja"],
  "defaultLocale": "en",
  "hooks": {
    "prebuild": "npm run lint",
    "postbuild": "npm run deploy"
  }
}
```

各フィールドを表で説明。

---

### 2.12 `/tools/cli/sjui/*`（10 ページ概要）

各ページ内容は以下レベル。詳細な「コマンドとフラグ」は `/reference/cli-commands` に集約:

- `/tools/cli/sjui/overview`: 役割・責務
- `/tools/cli/sjui/init`: プロジェクト初期化
- `/tools/cli/sjui/setup`: 依存解決
- `/tools/cli/sjui/generate`: scaffold
- `/tools/cli/sjui/destroy`: scaffold 削除
- `/tools/cli/sjui/build`: Xcode build
- `/tools/cli/sjui/convert`: Layout → Swift
- `/tools/cli/sjui/validate`: Layout 検証
- `/tools/cli/sjui/watch`: ファイル watch
- `/tools/cli/sjui/hotload`: Hot Loader サーバー
- `/tools/cli/sjui/config`: `sjui.config.json`

各ページは本文 2-3 段落 + CodeBlock 1 つで良い（詳細は reference で）。

---

### 2.13 `/tools/cli/kjui/*`, `/tools/cli/rjui/*`

同様に 10 ページずつ、コンパクトに記述。

---

### 2.14 `/tools/cli/jsonui-test/*`, `/tools/cli/jsonui-doc/*`

両者とも重複（plan 40, plan 25）を避けるため、overview ページのみ充実させ、個別コマンドは reference に誘導。

---

## 3. 必要 strings キー

prefix: `tools_cli_<page>_*`

概算 500 キー × 2 言語（多数ページに渡るため）。

---

## 4. クロスリンク追加先

- `/learn/installation` → `/tools/cli/overview`
- `/reference/cli-commands` 各コマンド行 → 対応する `/tools/cli/<path>`
- 各 platform ドキュメント (plan 33-35) → 対応する `/tools/cli/sjui` 等

---

## 5. 実装チェックリスト

- [ ] 60+ ページ分の spec ファイル作成（plan 08 ベース）
- [ ] strings キー追加
- [ ] Layout 生成
- [ ] 各ページ CodeBlock ≥ 1
- [ ] クロスリンク追加
- [ ] `jui build` / `jui verify` / `jsonui-localize`

---

## 6. セッション分割の推奨境界

- **分割 A**: `/tools/cli/overview` + `/tools/cli/jui/**`（11 ページ、3 時間）
- **分割 B**: `/tools/cli/sjui/**` + `/tools/cli/kjui/**` + `/tools/cli/rjui/**`（30 ページ、3-4 時間）
- **分割 C**: `/tools/cli/jsonui-test/**` + `/tools/cli/jsonui-doc/**` + `install` ページ（1-2 時間）
