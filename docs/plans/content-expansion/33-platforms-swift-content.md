# 33. コンテンツプラン: Platforms — SwiftJsonUI 記事本文

> Scope: 8〜12 時間 / 3 セッション。plan 05 の構造設計（18 ページ）に対応する**本文・コードサンプル**を書き下ろす。
> 依存: plan 05（ページ構成）、plan 20-24（reference 属性が完成していると links 張りやすい）。

本プランは plan 05 の各ページについて、**具体的に書くべき本文・コードサンプル・クロスリンク**を指定する。UI 配置には触れない。

---

## 1. 対象記事

plan 05 §2 のページ構成に従い、以下 18 記事を対象とする:

| URL | spec | 現状 |
|---|---|---|
| `/platforms/swift/overview` | `docs/screens/json/platforms/swift.spec.json`（現 1 画面、後述で分割 or index 化） | 本文なし |
| `/platforms/swift/setup` | `docs/screens/json/platforms/swift/setup.spec.json`（新規） | 未作成 |
| `/platforms/swift/uikit` | `.../swift/uikit/index.spec.json` | 未作成 |
| `/platforms/swift/uikit/viewcontroller` | `.../uikit/viewcontroller.spec.json` | 未作成 |
| `/platforms/swift/uikit/binding` | `.../uikit/binding.spec.json` | 未作成 |
| `/platforms/swift/uikit/lifecycle` | `.../uikit/lifecycle.spec.json` | 未作成 |
| `/platforms/swift/swiftui` | `.../swiftui/index.spec.json` | 未作成 |
| `/platforms/swift/swiftui/dynamic-view` | `.../swiftui/dynamic-view.spec.json` | 未作成 |
| `/platforms/swift/swiftui/viewmodel` | `.../swiftui/viewmodel.spec.json` | 未作成 |
| `/platforms/swift/swiftui/binding` | `.../swiftui/binding.spec.json` | 未作成 |
| `/platforms/swift/swiftui/style-processor` | `.../swiftui/style-processor.spec.json` | 未作成 |
| `/platforms/swift/swiftui/view-switcher` | `.../swiftui/view-switcher.spec.json` | 未作成 |
| `/platforms/swift/hot-loader` | `.../swift/hot-loader.spec.json` | 未作成 |
| `/platforms/swift/dynamic-mode` | `.../swift/dynamic-mode.spec.json` | 未作成 |
| `/platforms/swift/developer-menu` | `.../swift/developer-menu.spec.json` | 未作成 |
| `/platforms/swift/keyboard-avoidance` | `.../swift/keyboard-avoidance.spec.json` | 未作成 |
| `/platforms/swift/custom-components` | `.../swift/custom-components.spec.json` | 未作成 |
| `/platforms/swift/coverage` | `.../swift/coverage.spec.json` | 未作成 |
| `/platforms/swift/troubleshooting` | `.../swift/troubleshooting.spec.json` | 未作成 |

---

## 2. 各ページの書き下ろすべき内容

### 2.1 `/platforms/swift/overview`

#### セクション

**一文定義**
- en: "SwiftJsonUI is the iOS implementation of JsonUI, supporting both UIKit (legacy / fine-grained control) and SwiftUI (modern / declarative) from a single Layout JSON."
- ja: "SwiftJsonUI は JsonUI の iOS 実装。UIKit（レガシー／細密制御）と SwiftUI（モダン／宣言的）の両方を、単一の Layout JSON からサポートする。"

**主要機能ハイライト（箇条書き）**
- Layout JSON 駆動 UI（共通）
- Hot Loader — ビルドなしで Layout 変更を反映（UIKit / SwiftUI 両対応）
- Dynamic Mode — SwiftUI のみ、JSON を実行時解釈
- Two-way binding — `@{...}` 構文が `@Published` / `@State` にマップ
- Style Processor — 共通 style のキャッシュと階層マージ
- Developer Menu — デバッグ時に Layout 構造を可視化

**アーキテクチャ対応表**

| JsonUI concept | UIKit | SwiftUI |
|---|---|---|
| Screen root | `SJUIViewController` | `DynamicView` / `@ViewBuilder` |
| ViewModel | 通常の `class` + `NotificationCenter` | `ObservableObject` + `@Published` |
| Binding | `SJUIView` が notification で更新 | `@Published` 自動再描画 |
| Layout reload | `sjuiReloadLayout()` | `DynamicView` の `@StateObject` reload |

**UIKit vs SwiftUI 選択ガイド**
- UIKit を選ぶ場合: iOS 12+ 対応、既存 UIKit アプリとの統合、カスタム gesture recognizer が多い
- SwiftUI を選ぶ場合: iOS 14+ 対応、新規アプリ、Dynamic Mode を使いたい

**次に読むもの**
- `/platforms/swift/setup` — インストール
- `/platforms/swift/uikit` または `/platforms/swift/swiftui` — モード別

#### コードサンプル
1. UIKit 版 "Hello World"（JSON + Swift code）
2. SwiftUI 版 "Hello World"（同等の JSON + Swift code）

---

### 2.2 `/platforms/swift/setup`

#### セクション

- Requirements: iOS 13+ (SwiftUI Mode), iOS 12+ (UIKit Mode), Xcode 15+, Swift 5.9+
- CocoaPods install（`pod 'SwiftJsonUI'`）
- SPM install（`Package.swift` 記述例）
- `sjui` CLI install（`/learn/installation` ワンライナーに誘導、または手動 install）
- `sjui.config.json` 雛形（完全 JSON 掲載）
- 初回 Hello World コマンド（`sjui init`, `sjui g view`, `sjui watch`）
- Hot Loader 有効化（Info.plist の ATS 設定込み）
- Troubleshooting（`pod install` 失敗、SPM resolve 失敗、Hot Loader ポート競合）

#### コードサンプル
1. `pod 'SwiftJsonUI'` 行を含む Podfile 抜粋
2. `Package.swift` 完全記述
3. `sjui.config.json` 完全雛形
4. Hot Loader enable コード（`AppDelegate` または `App` ファイル）

---

### 2.3 `/platforms/swift/uikit`

#### セクション
- UIKit モードの全体像
- 生成されるファイル構造（`Layouts/<name>.json` + `ViewControllers/<name>ViewController.swift`）
- 親クラス `SJUIViewController` の役割
- Layout JSON ↔ `UIView` ツリーの対応
- 生成 Swift コードのリーディング順

#### コードサンプル
1. 典型的な `SJUIViewController` サブクラス（完全コード）
2. 生成された `UIView` ツリー（スニペット）

---

### 2.4 `/platforms/swift/uikit/viewcontroller`

#### セクション
- `SJUIViewController` の API リファレンス（プロパティ、オーバーライド可能メソッド）
- Layout のロードタイミング（`viewDidLoad` / `viewWillAppear`）
- ViewModel との接続パターン
- Cell との組み合わせ（`UICollectionView` / `UITableView` 連携）

#### コードサンプル
1. ViewModel 付き `SJUIViewController`
2. Cell 連携の完全例（`UICollectionViewCell` サブクラス）

---

### 2.5 `/platforms/swift/uikit/binding`

#### セクション
- `@{key}` が UIView の何を更新するか
- `SJUIView.refresh()` の動作原理
- `NotificationCenter` 経由の更新戦略
- two-way binding（`UITextField.editingChanged` → ViewModel）

#### コードサンプル
1. ViewModel 変更 → Label 更新までの完全フロー
2. TextField two-way binding のサンプル

---

### 2.6 `/platforms/swift/uikit/lifecycle`

#### セクション
- `viewDidLoad` / `viewWillAppear` / `viewWillDisappear` のタイミング
- Layout のロード timing のカスタマイズ
- メモリ管理（`deinit` の注意点、retain cycle 回避）

#### コードサンプル
1. lifecycle フックを ViewModel に橋渡しするテンプレート
2. weak self を含むクロージャ例

---

### 2.7 `/platforms/swift/swiftui`

#### セクション
- SwiftUI モードの全体像
- 生成される `struct` + `@StateObject` パターン
- `@ViewBuilder` 活用
- UIKit との相互運用（`UIViewRepresentable`）

#### コードサンプル
1. 生成された SwiftUI View の全文
2. `@StateObject` + `ObservableObject` ViewModel のテンプレート

---

### 2.8 `/platforms/swift/swiftui/dynamic-view`

#### セクション
- `DynamicView` の API
- 静的 View 生成との違い（JSON を実行時にパース）
- use case: A/B test、A/B での Hot Reload
- 性能特性と注意点

#### コードサンプル
1. `DynamicView(layoutPath: "screens/home")` 基本形
2. ViewModel 注入付き `DynamicView`

---

### 2.9 `/platforms/swift/swiftui/viewmodel`

#### セクション
- `ObservableObject` + `@Published` パターン
- Computed property の実装
- async/await の扱い（`Task {}` 内での `@MainActor` 考慮）
- イベントハンドラの命名規則（`on<Event>`）

#### コードサンプル
1. フル ViewModel テンプレート（state + event + async）
2. Dependency Injection パターン（`init(repository:)`）

---

### 2.10 `/platforms/swift/swiftui/binding`

#### セクション
- `@{expression}` から `@Published` への変換
- `Binding<T>` の自動生成タイミング
- Custom Binding の作り方

#### コードサンプル
1. TextField two-way binding の完全例
2. Custom Binding の実装

---

### 2.11 `/platforms/swift/swiftui/style-processor`

#### セクション
- `StyleProcessor` の役割（JSON の `style` キーをマージ）
- style キャッシュ機構
- 階層的 style（ネストした View の style 継承）

#### コードサンプル
1. `styles/button.json` の典型例
2. `style: "button, primary"` 複数 style マージ結果

---

### 2.12 `/platforms/swift/swiftui/view-switcher`

#### セクション
- `ViewSwitcher` の役割（異なる View を切り替える）
- use case: loading / error / content 状態切替
- `displayLogic` との連携

#### コードサンプル
1. `ViewSwitcher` を使った 3 状態 View
2. spec 側の `displayLogic` と Swift 実装の対応

---

### 2.13 `/platforms/swift/hot-loader`

#### セクション
- Hot Loader の仕組み（ローカル WebSocket サーバー）
- `sjui hotload start/stop/status`
- iOS Simulator / 実機での接続手順
- Info.plist の ATS 設定
- トラブルシューティング（ポート競合、ネットワーク切断、SSL）

#### コードサンプル
1. `AppDelegate` で Hot Loader enable
2. Info.plist の XML 記述

---

### 2.14 `/platforms/swift/dynamic-mode`

#### セクション
- Dynamic Mode の全体像（JSON を bundled or 動的 fetch）
- `DynamicView` との関係
- 配信戦略（CDN / local assets / remote config）
- Apple App Review ガイドラインとの整合性

#### コードサンプル
1. CDN から JSON を fetch して描画するフル例
2. A/B test 用の Dynamic Layout パターン

---

### 2.15 `/platforms/swift/developer-menu`

#### セクション
- Developer Menu の有効化（`#if DEBUG` ブロック）
- 提供機能: Layout tree inspector、ViewModel dump、Hot Loader URL 変更
- ジェスチャ（3 本指 tap）でのメニュー表示

#### コードサンプル
1. `DeveloperMenu.register()` コード
2. カスタム機能追加の例

---

### 2.16 `/platforms/swift/keyboard-avoidance`

#### セクション
- キーボード出現時の自動スクロール
- `KeyboardAvoidingScrollView` の仕組み
- 明示的に避ける要素の指定

#### コードサンプル
1. `KeyboardAvoidingScrollView` ラップ例
2. TextField に focus したときの挙動デバッグ

---

### 2.17 `/platforms/swift/custom-components`

#### セクション
- SwiftJsonUI 独自の custom component 実装（`SJUIView` サブクラス または SwiftUI の `View`）
- plan 32 (guides/custom-components) との関係: **plan 32 は横断ガイド、本ページは Swift 固有の詳細**
- 登録方法（`SJUIViewCreator.register`）

#### コードサンプル
1. `SJUIView` サブクラスのテンプレート
2. SwiftUI View テンプレート
3. 登録コード

---

### 2.18 `/platforms/swift/coverage`

#### セクション
- サポート状況チェックリスト
- 28 コンポーネント × UIKit / SwiftUI の対応表
- 131 共通属性 × UIKit / SwiftUI の対応表（未対応属性のリスト）
- Known limitations

#### 表データ（完成形）

| Component | UIKit | SwiftUI |
|---|---|---|
| Label | ✓ | ✓ |
| Button | ✓ | ✓ |
| ... (28 全て) | | |

---

### 2.19 `/platforms/swift/troubleshooting`

#### セクション
- 症状別 FAQ
- Hot Loader が繋がらない → ATS 設定確認、ポート確認
- `@{binding}` が更新されない → ViewModel の `@Published` 宣言確認
- クラッシュ「unrecognized selector」→ `SJUIView` の命名規則
- Build 時の warning → `attribute_definitions.json` の同期確認

#### コードサンプル
1. `lldb` で ViewModel dump するコマンド
2. 各症状への対処コード

---

## 3. 各ページ共通の必要 strings キー

prefix: `platform_swift_<page>_*`

例: `platform_swift_overview_intro_title`, `platform_swift_uikit_binding_example_caption`

概算 400 キー × 2 言語（全 18 ページ合計）。

---

## 4. クロスリンク追加先

- `/learn/installation` 末尾「各プラットフォーム詳細」→ `/platforms/swift/overview`
- `/reference/components/*` の platform 対応表行から該当コンポーネントの Swift 節へ
- `/guides/navigation` の iOS セクション → `/platforms/swift/uikit/viewcontroller` または `/platforms/swift/swiftui`
- `/concepts/hot-reload` → `/platforms/swift/hot-loader`

---

## 5. 実装チェックリスト

- [ ] 18 ページ分の spec ファイル作成（ほぼ全て新規）
- [ ] 18 ページ分の strings キー追加
- [ ] Layout 生成（`jui g project`）
- [ ] 各ページに CodeBlock 最低 3 個
- [ ] クロスリンク追加（各ページから関連 reference / guide へ ≥ 3 本）
- [ ] Coverage 表の完成（28 × 2 モード）
- [ ] `jui build` / `jui verify` / `jsonui-localize`

---

## 6. セッション分割の推奨境界

本プランは**非常に大きい**ため、セッションを以下で分割:

- **分割 A**: overview + setup + UIKit 4 ページ（4 時間）
- **分割 B**: SwiftUI 6 ページ（4 時間）
- **分割 C**: Hot Loader + Dynamic Mode + Developer Menu + Keyboard + Custom + Coverage + Troubleshooting（4 時間）

各分割は独立処理可能。
