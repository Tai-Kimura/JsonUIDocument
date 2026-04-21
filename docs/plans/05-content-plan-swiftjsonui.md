# 05. コンテンツプラン: SwiftJsonUI セクション

> **実装アーキテクチャ（本計画書共通）:** 各ページは `docs/screens/json/platforms/swift/*.spec.json` で定義し、
> `jui g project` で Layout JSON + ViewModel を生成、`jui build` で Web（必須）/iOS/Android（任意） に配布する。
> `02-tech-stack.md` / `02b-jui-workflow.md` / `17-spec-templates.md` 参照。
>
> 各 URL → spec ファイル対応:
> - `/platforms/swift/overview` → `docs/screens/json/platforms/swift/overview.spec.json`
> - `/platforms/swift/setup` → `docs/screens/json/platforms/swift/setup.spec.json`
> - `/platforms/swift/uikit` → `docs/screens/json/platforms/swift/uikit/index.spec.json`
> - （以下 URL をディレクトリ階層に対応させる）
>
> Layout JSON の置き場: `docs/screens/layouts/platforms/swift/*.json`
> サイドバー `common/sidebar_swift.json`（`platforms: ["web"]`）で include

## 1. 対象リポジトリ

`/Users/like-a-rolling_stone/resource/SwiftJsonUI`

- UIKit モード（`Sources/SwiftJsonUI/Classes/UIKit/`）
- SwiftUI モード（`Sources/SwiftJsonUI/Classes/SwiftUI/`）
- Hot Loader（`Sources/SwiftJsonUI/Classes/HotLoader/`）
- Dynamic Mode（`Sources/SwiftJsonUI/Classes/SwiftUI/Dynamic/` + `DynamicView.swift`）
- Developer Menu（`Sources/SwiftJsonUI/Classes/SwiftUI/DeveloperMenu/`）

## 2. ページ構成

```
/platforms/swift
├── /platforms/swift/overview                SwiftJsonUI 概要（トップ）
├── /platforms/swift/setup                   セットアップ（CocoaPods / SPM）
├── /platforms/swift/uikit                   UIKit モード概要
├── /platforms/swift/uikit/viewcontroller    SJUIViewController 統合
├── /platforms/swift/uikit/binding           UIKit の Binding
├── /platforms/swift/uikit/lifecycle         ライフサイクル連携
├── /platforms/swift/swiftui                 SwiftUI モード概要
├── /platforms/swift/swiftui/dynamic-view    DynamicView API
├── /platforms/swift/swiftui/viewmodel       ObservableObject ViewModel
├── /platforms/swift/swiftui/binding         SwiftUI の Binding
├── /platforms/swift/swiftui/style-processor StyleProcessor（内部機構）
├── /platforms/swift/swiftui/view-switcher   ViewSwitcher
├── /platforms/swift/hot-loader              Hot Loader
├── /platforms/swift/dynamic-mode            Dynamic Mode
├── /platforms/swift/developer-menu          Developer Menu
├── /platforms/swift/keyboard-avoidance      キーボード回避
├── /platforms/swift/custom-components       カスタム SJUIView 作成
├── /platforms/swift/coverage                サポート状況チェックリスト
└── /platforms/swift/troubleshooting         トラブルシューティング
```

## 3. 各ページの要点

### 3.1 `overview`
- 一文定義: iOS (UIKit / SwiftUI 両対応) 向け JsonUI 実装
- 主要機能ハイライト:
  - JSON Layout 駆動 UI
  - Hot Loader（ビルドなしで反映）
  - Dynamic Mode（SwiftUI）
  - Two-way binding
  - UIKit / SwiftUI どちらでも同じ JSON
- アーキテクチャ図（UIKit / SwiftUI の違いと共通部）
- 「次に読むもの」リンク

### 3.2 `setup`
- Requirements: iOS 13+（要確認、`Package.swift` で検証）
- CocoaPods:
  ```ruby
  pod 'SwiftJsonUI'
  ```
- SPM:
  ```swift
  dependencies: [
    .package(url: "https://github.com/Tai-Kimura/SwiftJsonUI.git", from: "X.Y.Z")
  ]
  ```
- `sjui_tools` のインストール手順（`jsonui-cli` 側を参照リンク）
- `sjui.config.json` の雛形
- Hello World（`rjui g view HomeView` ならぬ `sjui g view HomeView`）

### 3.3 `uikit`
- `SJUIViewController` 継承モデル
- JSON → UIView ツリーへの変換（`SJUIViewCreator.swift`）
- 各コンポーネントは `UIView` サブクラス:
  - `SJUILabel` / `SJUIButton` / `SJUITextField` / `SJUIImageView` / ...
  - `Extensions/` の詳細は coverage ページでチェックリスト化
- ViewController 統合サンプルコード
- Binding の接続方法（`Binding.swift` ベース）

### 3.4 `uikit/viewcontroller`
- `SJUIViewController` のライフサイクル
- `loadView` / `viewDidLoad` でのレイアウト適用
- JSON 参照パスの解決順序
- カスタム ViewController との共存

### 3.5 `swiftui`
- `DynamicView` / `JSONLayoutLoader` / `ViewSwitcher` の役割
- ObservableObject を使った ViewModel 連携
- 互換モード vs Dynamic モードの違い

### 3.6 `swiftui/dynamic-view`
- `DynamicView("screen_name", viewModel: vm)` の API
- パラメータ: `layoutName` / `viewModel` / `fallback`
- レイアウトファイルの探索順序（Bundle / HotLoader / Remote）

### 3.7 `swiftui/viewmodel`
- `@Published` プロパティをどう JSON にバインドするか
- `ObservableObject` の拡張点（存在するなら）
- `onAppear` / `onDisappear` イベントハンドラ

### 3.8 `swiftui/style-processor`
- `Sources/SwiftJsonUI/Classes/SwiftUI/Dynamic/StyleProcessor.swift` の役割
- modifier 適用順序（詳細は `/reference/modifier-order`）
- カスタムスタイル追加の可否

### 3.9 `swiftui/view-switcher`
- `ViewSwitcher.swift` — Dynamic / Static 切替
- `USE_DYNAMIC` フラグの使い方

### 3.10 `hot-loader`
- `HotLoader.swift` / `HotLoaderConfigReader.swift`
- ローカルネットワーク経由での JSON リロード
- `hot_loader_config.json` の書式（`jsonui-cli/sjui_tools/lib/hotloader/ip_monitor.rb` と `server.js` と接続）
- 許可リスト・セキュリティ注意
- 横断解説は `13-content-plan-dynamic-hot-reload.md`

### 3.11 `dynamic-mode`
- 横断解説: `13-content-plan-dynamic-hot-reload.md`
- このページは「SwiftJsonUI としての有効化手順」のみ
- `DeveloperMenu` を開き Dynamic Mode を切替

### 3.12 `developer-menu`
- `DeveloperMenuContainer.swift` のスクリーンショット
- 有効化条件（通常は `DEBUG` のみ）
- 使える項目（Dynamic Mode 切替、ログレベル、JSON 再読込）

### 3.13 `keyboard-avoidance`
- `KeyboardAvoidance/` のクラス構成
- UIKit モードで自動スクロール回避する仕組み

### 3.14 `custom-components`
- `SJUIViewCreator` に新コンポーネントを登録する方法
- カスタム View（UIKit / SwiftUI それぞれ）
- `sjui g view` によるスキャフォールド

### 3.15 `coverage`
- 既存 `SwiftUI_Unimplemented_Attributes_Checklist.md` と `README_COVERAGE.md` を統合して生成
- 属性 × モード（UIKit / SwiftUI）の対応表

### 3.16 `troubleshooting`
- JSON が反映されない → キャッシュ・HotLoader 接続性
- Binding が機能しない → `@{}` 構文・`@Published` の宣言漏れ
- Dynamic Mode エラー → ログ取得方法

## 4. サイドバー `docs/screens/layouts/common/sidebar_swift.json`

**注意:** `platforms: ["web"]` 指定で Web のみに配布。

`Collection + cells/sidebar_link` のデータ駆動パターン（`02b-jui-workflow.md §4.2` と共通）。ViewModel が `[SidebarEntry(id, kind, labelKey, href?, isActive?)]` を公開し、`kind` がグループヘッダ（`group`）とリンク（`link`）を区別する。カスタム `NavLink` 型は作らない（`02-tech-stack.md §6.0`）。

```json
{
  "platforms": ["web"],
  "type": "ScrollView",
  "className": "flex flex-col gap-1",
  "child": [
    {
      "type": "Collection",
      "items": "@{sidebarSwift}",
      "cellIdProperty": "id",
      "cellClasses": ["cells/sidebar_link"]
    }
  ]
}
```

ViewModel 側の `sidebarSwift` 初期値（`SwiftSidebarRepository` / `UseCase` 経由で構築しても可）:

```jsonc
[
  { "id": "group_getting_started", "kind": "group", "labelKey": "ref_swift_getting_started" },
  { "id": "link_swift_overview",   "kind": "link",  "labelKey": "ref_swift_overview",       "href": "/platforms/swift/overview" },
  { "id": "link_swift_setup",      "kind": "link",  "labelKey": "ref_swift_setup",          "href": "/platforms/swift/setup" },

  { "id": "group_uikit", "kind": "group", "labelKey": "ref_swift_uikit" },
  { "id": "link_swift_uikit_overview", "kind": "link", "labelKey": "ref_swift_uikit_overview", "href": "/platforms/swift/uikit" },
  { "id": "link_swift_uikit_vc",       "kind": "link", "labelKey": "ref_swift_uikit_vc",       "href": "/platforms/swift/uikit/viewcontroller" },
  { "id": "link_swift_uikit_binding",  "kind": "link", "labelKey": "ref_swift_uikit_binding",  "href": "/platforms/swift/uikit/binding" },
  { "id": "link_swift_uikit_lifecycle","kind": "link", "labelKey": "ref_swift_uikit_lifecycle","href": "/platforms/swift/uikit/lifecycle" },

  { "id": "group_swiftui", "kind": "group", "labelKey": "ref_swift_swiftui" },
  { "id": "link_swift_swiftui_overview",     "kind": "link", "labelKey": "ref_swift_swiftui_overview",     "href": "/platforms/swift/swiftui" },
  { "id": "link_swift_swiftui_dynamicview",  "kind": "link", "labelKey": "ref_swift_swiftui_dynamicview",  "href": "/platforms/swift/swiftui/dynamic-view" },
  { "id": "link_swift_swiftui_viewmodel",    "kind": "link", "labelKey": "ref_swift_swiftui_viewmodel",    "href": "/platforms/swift/swiftui/viewmodel" },
  { "id": "link_swift_swiftui_binding",      "kind": "link", "labelKey": "ref_swift_swiftui_binding",      "href": "/platforms/swift/swiftui/binding" },
  { "id": "link_swift_swiftui_style",        "kind": "link", "labelKey": "ref_swift_swiftui_style",        "href": "/platforms/swift/swiftui/style-processor" },
  { "id": "link_swift_swiftui_viewswitcher", "kind": "link", "labelKey": "ref_swift_swiftui_viewswitcher", "href": "/platforms/swift/swiftui/view-switcher" },

  { "id": "group_runtime", "kind": "group", "labelKey": "ref_swift_runtime" },
  { "id": "link_swift_hotloader",       "kind": "link", "labelKey": "ref_swift_hotloader",       "href": "/platforms/swift/hot-loader" },
  { "id": "link_swift_dynamicmode",     "kind": "link", "labelKey": "ref_swift_dynamicmode",     "href": "/platforms/swift/dynamic-mode" },
  { "id": "link_swift_devmenu",         "kind": "link", "labelKey": "ref_swift_devmenu",         "href": "/platforms/swift/developer-menu" },
  { "id": "link_swift_keyboardavoid",   "kind": "link", "labelKey": "ref_swift_keyboardavoid",   "href": "/platforms/swift/keyboard-avoidance" },

  { "id": "group_advanced", "kind": "group", "labelKey": "ref_swift_advanced" },
  { "id": "link_swift_custom",       "kind": "link", "labelKey": "ref_swift_custom",       "href": "/platforms/swift/custom-components" },
  { "id": "link_swift_coverage",     "kind": "link", "labelKey": "ref_swift_coverage",     "href": "/platforms/swift/coverage" },
  { "id": "link_swift_troubleshoot", "kind": "link", "labelKey": "ref_swift_troubleshoot", "href": "/platforms/swift/troubleshooting" }
]
```

ViewModel が `currentPath` と照合して各 link 行の `isActive` を埋める。クリック時は `onNavigate(item)` → `router.push(item.href)`（cell 側は `02b-jui-workflow.md §4.2` の `cells/sidebar_link` と同一）。

## 5. Strings 追加キー（例）

```json
{
  "ref_swift_overview": "概要",
  "ref_swift_setup": "セットアップ",
  "ref_swift_uikit_overview": "UIKit 概要",
  "ref_swift_uikit_vc": "ViewController 統合",
  "ref_swift_uikit_binding": "Binding",
  "ref_swift_uikit_lifecycle": "ライフサイクル",
  "ref_swift_swiftui_overview": "SwiftUI 概要",
  "ref_swift_swiftui_dynamicview": "DynamicView",
  "ref_swift_swiftui_viewmodel": "ViewModel 連携",
  "ref_swift_swiftui_binding": "Binding",
  "ref_swift_swiftui_style": "StyleProcessor",
  "ref_swift_swiftui_viewswitcher": "ViewSwitcher",
  "ref_swift_hotloader": "Hot Loader",
  "ref_swift_dynamicmode": "Dynamic Mode",
  "ref_swift_devmenu": "Developer Menu",
  "ref_swift_keyboardavoid": "キーボード回避",
  "ref_swift_custom": "カスタムコンポーネント",
  "ref_swift_coverage": "サポート状況",
  "ref_swift_troubleshoot": "トラブルシューティング"
}
```

同様のキーを `ref_swift_*_en` は不要（`en.json` と `ja.json` で同じキーを使う）。

## 6. コード例の一次ソース

- `SwiftJsonUI/Example/` 配下の既存例を引用（UIKit ベース）
- SwiftUI 例は `test_app/` / `test_dynamic_component.swift` から抜粋
- 実装者は **コピペではなくリンク切れ注意**（ソースが変わったら追従）

## 7. スクリーンショット

- Developer Menu（シミュレータ撮影、Light / Dark）
- Hot Loader 接続成功時のトースト
- Dynamic / Static 切替の差分

## 8. 実装チェックリスト

- [ ] `docs/screens/json/platforms/swift/*.spec.json` を 18 枚作成（`jui g screen` 一括生成）
- [ ] 各 spec に対し `jui g project --file ...` で Layout + ViewModel を生成
- [ ] `docs/screens/layouts/platforms/swift/*.json` を手作業で仕上げ
- [ ] `jsonui-doc-web/src/app/platforms/swift/**/page.tsx` ルート作成（dynamic import）
- [ ] `docs/screens/layouts/common/sidebar_swift.json`（`platforms: ["web"]`）
- [ ] Strings の `ref_swift_*` キーを `docs/screens/layouts/Resources/strings.json` に追加（en / ja）
- [ ] `14-attribute-reference-generation.md` で生成される属性テーブルを埋め込み
- [ ] `/concepts/hot-reload` への内部リンク
- [ ] `overview` ページに UIKit / SwiftUI 切替 `Tabs`（独自 Converter、全プラットフォーム対応）
- [ ] `jui build` で Web 配布確認、Phase 5c で iOS ショーケース側にも配布確認
