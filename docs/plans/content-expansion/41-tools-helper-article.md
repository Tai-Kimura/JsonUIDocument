# 41. コンテンツプラン: Tools — `/tools/helper` 記事群

> Scope: 2〜3 時間 / 1 セッション。plan 12 の jsonui-helper ページ構成に対応。VSCode 拡張機能ガイド。
> 依存: plan 12（構造設計）。

---

## 1. 対象記事

| URL | 役割 |
|---|---|
| `/tools/helper/overview` | jsonui-helper (VSCode 拡張) の全体像 |
| `/tools/helper/install` | Marketplace からのインストール |
| `/tools/helper/commands` | コマンドパレット経由の提供機能 |
| `/tools/helper/intellisense` | 自動補完機能の詳細 |
| `/tools/helper/snippets` | コードスニペット一覧 |
| `/tools/helper/schema-validation` | JSON schema による型安全編集 |
| `/tools/helper/settings` | 設定オプション |
| `/tools/helper/troubleshooting` | トラブルシューティング |

---

## 2. 各ページの書き下ろすべき内容

### 2.1 `/tools/helper/overview`

**一文定義**
- en: "jsonui-helper is a VSCode extension providing IntelliSense, schema validation, snippets, and command-palette shortcuts for JsonUI projects."
- ja: "jsonui-helper は VSCode 拡張。JsonUI プロジェクト向けの IntelliSense、スキーマ検証、スニペット、コマンドパレットショートカットを提供。"

**提供機能一覧**

| 機能 | 説明 |
|---|---|
| IntelliSense | 属性補完、コンポーネント型補完 |
| Schema validation | spec / layout / strings の検証 |
| Snippets | `sjui-screen`, `sjui-button`, `sjui-form` 等 |
| Commands | `JsonUI: Create Screen`, `JsonUI: Run Verify` 等 |
| Preview | Layout JSON のビジュアルプレビュー（実験的） |

**旧 `swiftjsonui-helper` との関係**
- `swiftjsonui-helper` は廃止済み
- `jsonui-helper` が統合版（Swift / Kotlin / React 全て対応）

**Publisher / Version**
- Publisher: `jsonui`
- Latest version: v0.1.0
- Marketplace URL: （publisher 公開時に更新）

#### コードサンプル
1. VSCode 内での IntelliSense 動作スクリーンショット説明

---

### 2.2 `/tools/helper/install`

**Marketplace**
```
1. VSCode を開く
2. Extensions パネル (⌘⇧X) で "jsonui-helper" を検索
3. Install
```

**CLI**
```bash
$ code --install-extension jsonui.jsonui-helper
```

**Cursor / Continue での導入**
- VSIX 手動インストール手順

#### コードサンプル
1. CLI インストールコマンド
2. ワークスペース `.vscode/extensions.json` で推奨
```json
{
  "recommendations": ["jsonui.jsonui-helper"]
}
```

---

### 2.3 `/tools/helper/commands`

#### コマンド一覧

コマンドパレット（⌘⇧P）で呼べる:

| Command | 動作 |
|---|---|
| `JsonUI: Create New Screen` | 対話 → `jui g screen` 実行 |
| `JsonUI: Generate Project from Spec` | 現ファイル（spec）から `jui g project` |
| `JsonUI: Run Build` | `jui build` 実行 |
| `JsonUI: Run Verify` | `jui verify --fail-on-diff` 実行 |
| `JsonUI: Run Localize` | `jsonui-localize` 実行 |
| `JsonUI: Sync Tools` | `jui sync-tool` 実行 |
| `JsonUI: Preview Layout` | 現ファイル（layout）のビジュアルプレビュー |
| `JsonUI: Go to Spec` | Layout → spec ジャンプ |
| `JsonUI: Go to Layout` | spec → Layout ジャンプ |
| `JsonUI: Insert Component` | インラインでコンポーネント挿入 |

各コマンドの詳細（引数、成功時挙動、失敗時挙動）。

#### コードサンプル
1. キーバインド設定例（`keybindings.json`）
```json
{
  "key": "ctrl+shift+j b",
  "command": "jsonui.runBuild"
}
```

---

### 2.4 `/tools/helper/intellisense`

#### 機能詳細

**属性補完**
- Layout JSON で `"type": "Label"` と書くと、Label の全属性が候補に出る
- 属性名を書くと、その型に応じた値候補（例: `visibility` → `visible` / `invisible` / `gone`）
- 属性の説明（hover で表示）

**コンポーネント型補完**
- `"type": "` と打つと 28 コンポーネントの候補
- 各コンポーネントの description が表示

**Binding 補完**
- `"text": "@{` と打つと、ViewModel の `uiVariables` から候補
- `@string/` と打つと strings.json のキー候補

**参照ジャンプ**
- `@string/key` から strings.json へ
- `"include": "common/header"` から該当 Layout JSON へ
- `@{userName}` から ViewModel の定義へ

#### コードサンプル
1. 補完動作のステップバイステップ説明（スクリーンショット代替）

---

### 2.5 `/tools/helper/snippets`

#### 主要スニペット

全スニペット一覧（Trigger → 展開結果）:

| Trigger | 展開 |
|---|---|
| `sjui-screen` | 最小 screen spec 雛形 |
| `sjui-button` | Button コンポーネント |
| `sjui-label` | Label コンポーネント |
| `sjui-textfield` | TextField + validation error |
| `sjui-form-field` | Label + TextField + Error |
| `sjui-safearea` | SafeAreaView ルート |
| `sjui-collection` | Collection + cell reference |
| `sjui-tabview` | TabView 3 タブ |
| `sjui-displaylogic` | displayLogic 雛形 |
| `sjui-event-handler` | eventHandler 雛形 |

各スニペットの展開結果を本文に掲載（CodeBlock）。

#### カスタムスニペット

ユーザーが独自スニペットを追加する方法:
- `.vscode/jsonui.code-snippets` ファイル作成
- フォーマット例

---

### 2.6 `/tools/helper/schema-validation`

#### 機能詳細

自動的に適用される JSON schema:
- `docs/screens/json/**/*.spec.json` → `screen-spec.schema.json`
- `docs/screens/layouts/**/*.json` → `layout.schema.json`
- `docs/strings/**/*.json` → `strings.schema.json`
- `docs/screens/cells/**/*.json` → `cell.schema.json`
- `docs/screens/json/components/**/*.component.json` → `component-spec.schema.json`

検証される内容:
- 必須フィールドの存在
- 列挙値の妥当性（`orientation: "vertical" | "horizontal"` 以外を書くとエラー）
- 参照の存在（`@string/key` が strings.json にあるか、`include` 先が存在するか）

#### カスタム schema

プロジェクト固有の追加検証:
- `.vscode/settings.json` で拡張 schema を指定
- jsonui-helper の内蔵 schema との合成

#### コードサンプル
1. `.vscode/settings.json` の schema 関連付け例
2. エラー表示例（言葉で説明）

---

### 2.7 `/tools/helper/settings`

#### 設定オプション

`.vscode/settings.json` で設定可能:

```json
{
  "jsonui-helper.cliPath": "~/.jsonui-cli",
  "jsonui-helper.autoRunVerify": true,
  "jsonui-helper.autoRunLocalize": false,
  "jsonui-helper.previewTheme": "github-light",
  "jsonui-helper.formatOnSave": true,
  "jsonui-helper.enableIntelliSense": true,
  "jsonui-helper.enableSnippets": true,
  "jsonui-helper.logLevel": "info"
}
```

各設定の詳細説明、デフォルト値、効果。

---

### 2.8 `/tools/helper/troubleshooting`

- IntelliSense が効かない → `jsonui-helper.cliPath` 確認、VSCode 再起動
- Schema validation が動かない → JSON 言語関連付け確認
- コマンドが Not Found → CLI インストール確認
- Preview が真っ白 → Layout 実際の構造を `jui build` で検証
- スニペットが展開されない → trigger の typo、スニペットスコープ確認

---

## 3. 必要 strings キー

prefix: `tools_helper_<page>_*`

概算 100 キー × 2 言語。

---

## 4. クロスリンク追加先

- `/learn/installation` → `/tools/helper/install`
- `/reference/json-schema` → `/tools/helper/schema-validation`
- `/tools/cli/overview` → 「VSCode 拡張も提供」節から

---

## 5. 実装チェックリスト

- [ ] 8 ページ分 spec 作成
- [ ] strings キー追加
- [ ] Layout 生成
- [ ] 各ページ CodeBlock ≥ 1
- [ ] コマンド・スニペット・設定の表を完成
- [ ] クロスリンク追加
- [ ] `jui build` / `jui verify` / `jsonui-localize`

---

## 6. セッション分割の推奨境界

1 セッションで完結可能（8 ページ、軽量）。
