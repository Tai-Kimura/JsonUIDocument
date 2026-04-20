# 12. コンテンツプラン: jsonui-helper（VSCode 拡張）

> **実装アーキテクチャ（本計画書共通）:** 各ページは `docs/screens/json/tools/helper/*.spec.json` で定義、
> `jui g project` で Layout + ViewModel。ショートカット一覧やテンプレートは `Collection + cellClasses`。
> 詳細は `02-tech-stack.md` / `17-spec-templates.md`。
>
> Layout の置き場: `docs/screens/layouts/tools/helper/*.json`

## 1. 対象リポジトリ

`/Users/like-a-rolling_stone/resource/jsonui-helper/`

- `package.json`: `jsonui-helper` v0.1.0（`publisher: jsonui`、repository `github.com/Tai-Kimura/jsonui-helper`）
- `src/` に VSCode 拡張の本体（Layout JSON / Screen Spec / Component Spec / Styles / Strings すべてに対応）
- `out/` にビルド済み
- `vendor/` に `attribute_definitions.json` / `screen_spec_schema.json` / `component_spec_schema.json` / `builtin_type_map.json` / `responsive_size_classes.json` のスナップショット（`npm run sync:specs` で更新）
- `resources/` にアイコン等
- `templates/` にスニペット雛形

### 1.1 旧 `swiftjsonui-helper` について

旧実装（`swiftjsonui-helper` v1.7.0、publisher `swiftjsonui`）は**廃止済み**。バックアップは
`/Users/like-a-rolling_stone/resource/swiftjsonui-helper/` にローカルで保持しているが、以下の扱いで書く:

- サイト本文・ナビ・URL には**現れない**
- 旧ユーザーの検索流入対策として、`/tools/helper/install` ページ末尾に 1 段落だけ注記:
  > 旧 `SwiftJsonUI Helper`（publisher `swiftjsonui`）は `jsonui-helper` に統合され廃止されました。
- 過去の `CHANGELOG` / Marketplace 公開履歴に依存するページは作らない

## 2. ページ構成

```
/tools/helper
├── /tools/helper/overview                jsonui-helper 概要（対応対象: Layout / Screen Spec / Component Spec / Styles / Strings）
├── /tools/helper/install                 インストール（VSCode Marketplace / VSIX）
├── /tools/helper/features                機能一覧
├── /tools/helper/features/completion     補完（Layout / Spec 別）
├── /tools/helper/features/hover          ホバードキュメント
├── /tools/helper/features/navigation     ⌘+click ナビゲーション / DocumentLinks
├── /tools/helper/features/diagnostics    診断（Layout / Spec 別）
├── /tools/helper/features/templates      テンプレート挿入（17 コマンド）
├── /tools/helper/shortcuts               ショートカット一覧
├── /tools/helper/config                  `jui.config.json` 解決 / `jsonuiHelper.*` 設定
├── /tools/helper/type-map                `.jsonui-type-map.json` によるカスタム型マップ
├── /tools/helper/supported-components    サポート対象コンポーネント（28）
└── /tools/helper/troubleshooting         トラブルシューティング
```

## 3. 主要ページの要点

### 3.1 `overview`
- VSCode 拡張 `jsonui-helper` — `jui_tools` 前提の編集体験
- **対応ファイル**:
  - Layout JSON（`layouts_directory` 配下、component `type` + 共通 + per-component 属性）
  - Screen Spec / Component Spec（`*.spec.json`。4 種類: `screen_spec` / `screen_sub_spec` / `screen_parent_spec` / `component_spec`）
  - Styles（`styles_directory`）
  - Strings（`strings_file`）
  - Colors（`colors.json` / `defined_colors.json`）
- **対応言語**: Swift / Kotlin / React（旧 SwiftJsonUI 特化ではない。28 コンポーネント共通スキーマ）
- テレメトリ・外部通信なし（`PRIVACY.md`）

### 3.2 `install`
- VSCode Marketplace から（publisher: `jsonui`）
- VSIX 直接インストール: `jsonui-helper-0.1.0.vsix`
- 末尾: 旧 `SwiftJsonUI Helper` からの移行者向け 1 段落

### 3.3 `features`
- 5 機能の概要カード（completion / hover / navigation / diagnostics / templates）

### 3.4 `features/completion`

**Layout JSON**:
- コンポーネント `type` 補完（28 個、`width`/`height`/`child` の雛形つき）
- 属性名補完（選択中コンポーネントの共通 + 固有属性）
- 属性値補完:
  - enum（`textAlign` / `contentMode` / `visibility` / `lineBreakMode` / `borderStyle` ほか）
  - `width` / `height` → `matchParent` / `wrapContent` / 数値
  - 色属性 → `colors.json` / `defined_colors.json` + `#RRGGBB`
  - `text` / `hint` → `strings.json` のキー（`_` で階層探索）
  - `style` → `Styles/` のベース名
  - `include` / `view` / `cellClasses[]` / `sections[].cell/header/footer` → `layouts_directory` 配下
  - `src` → `images_directory` 配下の SVG
  - `alignTopOfView` / `alignBottomOfView` など → 兄弟 component の id
  - `@{...}` → 同一ファイルの `data[].name`
- Platform override: `"platform": { "ios": { ... } }` の入れ子属性 / `"platforms": [...]` のプラットフォーム値
- Responsive: 7 size class（`compact` / `medium` / `regular` / `landscape` + 3 つの `-landscape` バリアント）
- `partialAttributes[]` / `data[].class`（built-in type map + `.jsonui-type-map.json`）

**Spec**:
- スキーマ駆動（公式 JSON Schema から property 名・enum・object skeleton を自動導出）
- `metadata.platforms` / method-level `platforms` → `ios` / `android` / `web`
- `metadata.layoutFile` → layout ファイル
- `subSpecs[].file` / `structure.customComponents[].specFile` → spec ファイル
- `structure.components[].style` → 当該 `type` の属性
- `structure.components[].binding` → binding 可能属性
- `dataFlow.*.methods[*].params[*].type` / `returnType` → `.jsonui-type-map.json` + generics パターン（`[$T]` / `$T?` / `Array($T)` / `AsyncThrowingStream<$T,$E>` …）
- `useCases[].repositories` → 同 spec 内 `repositories[].name` のクロス参照
- `displayLogic[].effects[].element` → `structure.components[].id` のクロス参照

### 3.5 `features/hover`
- 属性名 → 説明 / 受け付ける型 / `platform` / `mode` メタ
- Spec キー → JSON Schema の description
- `@{name}` → 対応する `data[]` の `class` / `defaultValue`

### 3.6 `features/navigation`
- `⌘+click` / `Ctrl+click` で参照値からターゲットファイルへジャンプ:
  - `include` / `view` / `style` / `layoutFile`
  - `cellClasses[]` / `sections[].cell` / `header` / `footer`
  - `subSpecs[].file` / `customComponents[].specFile`
- DocumentLinks として同じパスに下線が付く

### 3.7 `features/diagnostics`

`jsonuiHelper.diagnostics.enabled` で on/off（デフォルト on、debounce 付き）。

**Layout**:
- 未知の属性 / enum 違反
- `include` / `view` / `style` / `cellClasses[]` 解決失敗
- `hidden` + `visibility` 併用
- 重複 id
- 不正な `platform` / `responsive` キー

**Spec**:
- `layoutFile` / `subSpecs[].file` / `customComponents[].specFile` 解決失敗
- 重複 component id
- `displayLogic.effects[].element` が存在しない id を指す
- `useCases` が未定義の `Repository` を参照
- iOS 固有型（`UIImage` / `inout` / ラベル付きタプルなど）を `platforms: ["ios"]` なしで使用

### 3.8 `features/templates`

| コマンド | 既定キー（Mac / Win） | スコープ |
|---|---|---|
| Insert View | `⌘⇧V` / `Ctrl+Shift+V` | Layout |
| Insert Label | `⌘⇧L` / `Ctrl+Shift+L` | Layout |
| Insert Button | `⌘⇧B` / `Ctrl+Shift+B` | Layout |
| Insert ScrollView | `⌘⇧S` / `Ctrl+Shift+S` | Layout |
| Insert SafeAreaView | `⌘⇧A` / `Ctrl+Shift+A` | Layout |
| Insert Collection | `⌘⇧C` / `Ctrl+Shift+C` | Layout |
| Insert TextField / Image / TabView / Include | — | Layout |
| Insert screen_spec / screen_sub_spec / screen_parent_spec / component_spec | — | Spec |
| Insert Repository / UseCase / ApiEndpoint | — | Spec |

※ キーバインディングは `when: editorTextFocus && resourceExtname == .json` で発火。

### 3.9 `shortcuts`

上記 `features/templates` と同じ表を掲載。Linux は Win と同じ。

### 3.10 `config`

| 設定 | 既定 | 役割 |
|---|---|---|
| `jsonuiHelper.configFile` | `jui.config.json` | 使う config のファイル名（workspace root からの相対） |
| `jsonuiHelper.layoutsDirectory` | `""`（config から読む） | `layouts_directory` のオーバーライド |
| `jsonuiHelper.specDirectory` | `""` | `spec_directory` のオーバーライド |
| `jsonuiHelper.stylesDirectory` | `""` | `styles_directory` のオーバーライド |
| `jsonuiHelper.stringsFile` | `""` | `strings_file` のオーバーライド |
| `jsonuiHelper.diagnostics.enabled` | `true` | 診断の on/off |

**パス解決ルール**: Layout / Spec 内のファイル参照はカレントファイルからの相対ではなく、`layouts_directory` / `spec_directory` を起点とした相対。例: `"bar_list/bar_cell"` は常に `{layouts_directory}/bar_list/bar_cell.json` を指す。

### 3.11 `type-map`

- プロジェクト固有の型を `.jsonui-type-map.json` に登録
- `data[].class` 補完 / `dataFlow.*.methods[*].params[*].type` / `returnType` の候補に反映
- built-in type map（拡張同梱）と merge される
- 例:
  ```json
  {
    "types": {
      "User":    { "swift": "User",    "kotlin": "User",    "react": "User" },
      "[Order]": { "swift": "[Order]", "kotlin": "List<Order>", "react": "Order[]" }
    }
  }
  ```

### 3.12 `supported-components`

Layout の `type` で補完される 28 コンポーネント（`attribute_definitions.json` と一致）:

**Container**
- View, SafeAreaView
- ScrollView, Collection
- TabView

**UI**
- Label, Button, TextField, TextView, EditText, Input
- Image, NetworkImage, CircleView
- Switch, Toggle, Slider, Progress, Indicator
- Radio, CheckBox, Check, Segment, SelectBox
- IconLabel, GradientView, Blur
- Web

### 3.13 `troubleshooting`
- 補完が出ない → `jui.config.json` の位置 / `jsonuiHelper.configFile` を確認
- 参照先にジャンプしない → `layouts_directory` / `spec_directory` の設定を確認
- VSIX がインストールできない → VSCode バージョン（1.103+）
- ショートカット衝突 → キーバインディング設定を編集
- 属性スキーマが古い → 拡張を更新（`vendor/` のバージョン）、または `npm run sync:specs` で再取り込み

## 4. 一次ソース

- `jsonui-helper/package.json`
- `jsonui-helper/README.md`
- `jsonui-helper/CHANGELOG.md`
- `jsonui-helper/src/` 実装コード
- `jsonui-helper/vendor/` スキーマ / 属性定義のスナップショット

## 5. サイドバー

`src/Layouts/components/sidebar_helper.json`

## 6. Strings 追加キー

`tools_helper_*` プレフィックスで約 25 キー × 2 言語（機能ページが増えた分、旧プランより少し増加）。

## 7. 実装チェックリスト

- [ ] `docs/screens/json/tools/helper/*.spec.json` 約 13 枚（`jui g screen` 一括生成）
- [ ] 各 spec に対し `jui g project --file ...`
- [ ] `docs/screens/layouts/tools/helper/*.json` 手作業で仕上げ
- [ ] `jsonui-doc-web/src/app/tools/helper/**/page.tsx`
- [ ] `docs/screens/layouts/common/sidebar_tools_helper.json`（`platforms: ["web"]`）
- [ ] Strings `tools_helper_*`
- [ ] スクリーンショット: completion / hover / diagnostics の各動作（GIF / 静止画）
- [ ] `/tools/helper/install` 末尾に旧 `SwiftJsonUI Helper` 廃止の注記
- [ ] 本文・ナビ・URL すべて `jsonui-helper` 表記（旧名は install ページの注記のみ）
