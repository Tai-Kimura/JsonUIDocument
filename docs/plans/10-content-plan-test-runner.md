# 10. コンテンツプラン: jsonui-test-runner / jsonui-test-runner-ios

> **実装アーキテクチャ（本計画書共通）:** 各ページは `docs/screens/json/tools/test-runner/**/*.spec.json` で定義、
> `jui g project` で Layout + ViewModel。JSON Schema ビューアは **Web 専用** Converter `JsonSchemaViewer`。
> 詳細は `02-tech-stack.md` / `17-spec-templates.md`。
>
> Layout の置き場: `docs/screens/layouts/tools/test-runner/**/*.json`
> スキーマの置き場: `jsonui-doc-web/public/schemas/*.schema.json`
>
> アクション・アサーションの表は `Collection + cellClasses`（`cells/action_row.json` / `cells/assertion_row.json`）。

## 1. 対象リポジトリ

### 1.1 `jsonui-test-runner`（master 実装）

`/Users/like-a-rolling_stone/resource/jsonui-test-runner/`

- `schemas/` — JSON Schema（screen-test / flow-test / actions / description）
- `drivers/ios/` — XCUITest 実装
- `drivers/android/` — Espresso / UIAutomator 実装
- `drivers/web/` — Playwright 実装
- `examples/` — サンプルテスト
- `test_tools/` — テスト用ヘルパー

### 1.2 `jsonui-test-runner-ios`（現在は空リポジトリ）

`/Users/like-a-rolling_stone/resource/jsonui-test-runner-ios/`

- 現状 `.git/` のみ
- ドキュメント上は「iOS ドライバは `jsonui-test-runner/drivers/ios` が master、`jsonui-test-runner-ios` は将来的な独立ドライバ配布先」として扱う

## 2. ページ構成

```
/tools/test-runner
├── /tools/test-runner/overview                    全体像
├── /tools/test-runner/install                     インストール（CLI + ドライバ）
├── /tools/test-runner/getting-started             はじめてのテストケース
├── /tools/test-runner/screen-tests                画面単体テスト
├── /tools/test-runner/flow-tests                  フローテスト
├── /tools/test-runner/schemas                     スキーマリファレンス
│   ├── /tools/test-runner/schemas/screen-test
│   ├── /tools/test-runner/schemas/flow-test
│   ├── /tools/test-runner/schemas/actions
│   └── /tools/test-runner/schemas/description
├── /tools/test-runner/actions                     アクション 16 種
├── /tools/test-runner/assertions                  アサーション 7 種
├── /tools/test-runner/cli                         jsonui-test CLI（/tools/cli/jsonui-test と相互リンク）
├── /tools/test-runner/drivers                     ドライバー一覧
│   ├── /tools/test-runner/drivers/ios             XCUITest
│   ├── /tools/test-runner/drivers/android         UIAutomator
│   └── /tools/test-runner/drivers/web             Playwright
├── /tools/test-runner/ai-generation               AI エージェントによるテスト生成
└── /tools/test-runner/troubleshooting             トラブルシューティング
```

## 3. 主要ページの要点

### 3.1 `overview`
- 目的: JsonUI ライブラリ（Swift/Kotlin/React）向けのクロスプラットフォーム UI テスト自動化ツール
- 特徴:
  - 宣言的テスト定義（JSON）
  - iOS/Android/Web で同じテスト実行
  - AI エージェント連携（レイアウトJSONと仕様書から自動生成）
- 注意: `jsonui-test-runner-ios` は空リポジトリ、iOS ドライバ master は `drivers/ios`

### 3.2 `install`
- `jsonui-test` CLI インストール（`pip install jsonui-test` またはローカル）
- プラットフォーム別ドライバのインストール:
  - iOS: XCUITest プロジェクトに `drivers/ios` を追加（後続で `jsonui-test-runner-ios` に移行予定）
  - Android: Gradle に `drivers/android` を追加
  - Web: `npm i -D @jsonui/test-runner-web playwright`（仮名、実態確認）

### 3.3 `getting-started`
- Hello World テスト:
  ```json
  {
    "type": "screen",
    "source": { "layout": "Layouts/Login.json" },
    "cases": [
      {
        "name": "初期表示確認",
        "steps": [
          { "assert": "visible", "id": "email_input" },
          { "assert": "visible", "id": "password_input" },
          { "assert": "disabled", "id": "login_button" }
        ]
      }
    ]
  }
  ```
- 実行コマンド（各プラットフォームのドライバで異なる）

### 3.4 `screen-tests`
- スキーマ: `schemas/screen-test.schema.json`
- 1 画面 = 1 テストファイル
- `source.layout` で対象 JSON Layout を指定

### 3.5 `flow-tests`
- スキーマ: `schemas/flow-test.schema.json`
- 複数画面に渡る操作フロー
- 画面遷移と状態を検証

### 3.6 `actions`（16 種）
README より抽出:

| アクション | 説明 | パラメータ |
|-----------|------|-----------|
| `tap` | 要素をタップ | `id`, `text?` |
| `doubleTap` | ダブルタップ | `id` |
| `longPress` | 長押し | `id`, `duration?` |
| `input` | テキスト入力 | `id`, `value` |
| `clear` | 入力クリア | `id` |
| `scroll` | スクロール | `id`, `direction`, `amount?` |
| `swipe` | スワイプ | `id`, `direction` |
| `waitFor` | 要素出現待機 | `id`, `timeout?` |
| `waitForAny` | いずれかの要素出現 | `ids`, `timeout?` |
| `wait` | 指定時間待機 | `ms` |
| `back` | 戻る | - |
| `screenshot` | スクリーンショット | `name` |
| `alertTap` | アラートボタンタップ | `button`, `timeout?` |
| `selectOption` | ドロップダウン/ピッカー選択 | `id`, `value?`, `label?`, `index?` |
| `tapItem` | コレクション内アイテムタップ | `id`, `index` |
| `selectTab` | タブ選択 | `index`, `id?` |

### 3.7 `assertions`（7 種）

| アサーション | 説明 | パラメータ |
|-------------|------|-----------|
| `visible` | 要素が表示 | `id` |
| `notVisible` | 要素が非表示 | `id` |
| `enabled` | 有効 | `id` |
| `disabled` | 無効 | `id` |
| `text` | テキスト検証 | `id`, `equals?`, `contains?` |
| `count` | 要素数検証 | `id`, `equals` |
| `state` | ViewModel 状態検証 | `path`, `equals` |

### 3.8 `drivers/ios`
- XCUITest ベース
- プロジェクト統合方法（Package.swift or CocoaPods）
- iOS テストターゲットの設定
- 既存の `swiftjsonui/test-runner` 相当ディレクトリへのパス
- 将来 `jsonui-test-runner-ios` への物理分離予定（現状は empty repo）

### 3.9 `drivers/android`
- UIAutomator ベース
- instrumentation テスト統合

### 3.10 `drivers/web`
- Playwright ベース
- `drivers/web/src/models/` に TypeScript モデル

### 3.11 `cli`
- `/tools/cli/jsonui-test` とリンク（重複コンテンツを書かず、アンカーで参照）

### 3.12 `ai-generation`
- AI エージェントでテスト生成するワークフロー
- `JsonUI-Agents-for-*` の Option 2〜4 と連携
- `jsonui-test` skill / `jsonui-screen-test-implement` skill 呼び出し
- 入力: Layout JSON + Screen Spec
- 出力: `.test.json`

### 3.13 `troubleshooting`
- iOS: Xcode で Accessibility Inspector が必要
- Android: エミュレータでの API Level 互換
- Web: Playwright の baseURL 設定

## 4. JSON Schema の掲載

- `schemas/screen-test.schema.json`
- `schemas/flow-test.schema.json`
- `schemas/actions.schema.json`
- `schemas/description.schema.json`

いずれも `/tools/test-runner/schemas/*` で内容を表示:
- JSON 構造を展開ツリーで表示
- 各フィールドの `description` を表示

Converter としては独自 `JsonSchemaViewer` を用意。実装は `react-jsonschema-form` ではなくカスタムで（read-only 用途）。

## 5. Strings 追加キー

`tools_testrunner_*` プレフィックスで約 35 キー × 2 言語。

## 6. 実装チェックリスト

- [ ] `docs/screens/json/tools/test-runner/**/*.spec.json` 約 20 枚（`jui g screen` 一括生成）
- [ ] 各 spec に対し `jui g project --file ...`
- [ ] `docs/screens/layouts/tools/test-runner/**/*.json` 手作業で仕上げ
- [ ] `jsonui-doc-web/src/app/tools/test-runner/**/page.tsx`
- [ ] `docs/screens/layouts/common/sidebar_tools_testrunner.json`（`platforms: ["web"]`）
- [ ] Strings `tools_testrunner_*`
- [ ] `schemas/` 以下 4 本を `jsonui-doc-web/public/schemas/` にコピー
- [ ] component_spec `docs/screens/json/components/json_schema_viewer.component.json` 作成（spec-first。`02-tech-stack.md §6.1`）、`.jsonui-doc-rules.json` に名前登録（Web 専用）
- [ ] Converter 生成: `jui g converter --from docs/screens/json/components/json_schema_viewer.component.json`
- [ ] `ai-generation` ページから `/tools/agents/*` へリンク
- [ ] `jsonui-test-runner-ios` リポジトリの空状態を「将来分離予定」と明記
