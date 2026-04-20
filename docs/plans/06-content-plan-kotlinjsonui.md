# 06. コンテンツプラン: KotlinJsonUI セクション

> **実装アーキテクチャ（本計画書共通）:** 各ページは `docs/screens/json/platforms/kotlin/*.spec.json` で定義し、
> `jui g project` で Layout JSON + ViewModel を生成、`jui build` で Web（必須）/iOS/Android（任意） に配布する。
> 詳細は `02-tech-stack.md` / `02b-jui-workflow.md` / `17-spec-templates.md`。
>
> Layout JSON の置き場: `docs/screens/layouts/platforms/kotlin/*.json`
> サイドバー `docs/screens/layouts/common/sidebar_kotlin.json`（`platforms: ["web"]`）で include

## 1. 対象リポジトリ

`/Users/like-a-rolling_stone/resource/KotlinJsonUI`

- `library/` — 通常ビルド用ライブラリ
- `library-dynamic/` — Dynamic Mode 用
- `sample-app/` — サンプル（ドキュメントには含めず、参考リンクのみ）
- `Docs/` — 既存ドキュメント（`attribute_compatibility.md`, `dynamic-v2-rewrite-plan.md`）
- `library/src/main/kotlin/com/kotlinjsonui/` 配下:
  - `core/` / `utils/` / `binding/` / `components/` / `data/` / `views/`

## 2. ページ構成

```
/platforms/kotlin
├── /platforms/kotlin/overview                KotlinJsonUI 概要
├── /platforms/kotlin/setup                   セットアップ（Gradle / JitPack）
├── /platforms/kotlin/flavors                 Flavor 構成（normal / dynamic）
├── /platforms/kotlin/compose                 Compose モード概要
├── /platforms/kotlin/compose/safe-dynamic-view    SafeDynamicView
├── /platforms/kotlin/compose/viewmodel             ViewModel 連携
├── /platforms/kotlin/compose/binding               Compose での Binding
├── /platforms/kotlin/compose/components            KjuiButton 等のコンポーネント
├── /platforms/kotlin/xml                     XML モード概要
├── /platforms/kotlin/xml/activity            Activity / Fragment 統合
├── /platforms/kotlin/xml/binding             XML での Binding
├── /platforms/kotlin/xml/inflation           LayoutInflater 拡張
├── /platforms/kotlin/dynamic-mode            Dynamic Mode（library-dynamic 利用）
├── /platforms/kotlin/hot-loader              Hot Loader（Android 側）
├── /platforms/kotlin/custom-components       カスタムコンポーネント
├── /platforms/kotlin/coverage                サポート状況
├── /platforms/kotlin/modular-architecture    モジュール設計（既存 MODULAR_ARCHITECTURE.md 統合）
└── /platforms/kotlin/troubleshooting         トラブルシューティング
```

## 3. 各ページの要点

### 3.1 `overview`
- Android 向け JsonUI 実装（Compose / XML 両対応）
- 2 種類のライブラリ: `kotlinjsonui` と `kotlinjsonui-dynamic`
- 特徴:
  - Compose の declarative UI をそのまま JSON で生成
  - XML 版は legacy プロジェクトに統合しやすい
  - Hot Loader 対応
- アーキテクチャ図（Compose / XML / 共通 core）

### 3.2 `setup`
- Gradle:
  ```kts
  dependencies {
      implementation("com.github.Tai-Kimura.KotlinJsonUI:kotlinjsonui:X.Y.Z")
  }
  ```
- JitPack 経由（`jitpack.yml` に記載）
- `kjui_tools` のインストール（`jsonui-cli` へリンク）
- `kjui.config.json`

### 3.3 `flavors`
- 既存 `FLAVOR_CONFIGURATION.md` を統合
- `normal` / `dynamic` の違い
- Gradle `productFlavors` 設定例
- どちらを選ぶべきか

### 3.4 `compose`
- Compose における JSON 駆動 UI
- 主要 API:
  - `SafeDynamicView` — `library/src/main/kotlin/com/kotlinjsonui/components/SafeDynamicView.kt`
  - `DynamicModeToggle` — 切替 UI
- Compose の `@Composable` 関数として JSON をレンダリング
- `library/src/main/kotlin/com/kotlinjsonui/views/Kjui*.kt` 一覧:
  - KjuiButton, KjuiTextView, KjuiEditText, KjuiCircleImageView, KjuiNetworkImageView, KjuiBlurView, KjuiGradientView, KjuiSafeAreaView, KjuiSelectBox, DatePickerBottomSheet, SelectBoxBottomSheet

### 3.5 `compose/safe-dynamic-view`
- API リファレンス（シグネチャ + 使用例）
- fallback / error handling
- ViewModel 接続例

### 3.6 `compose/viewmodel`
- Android Architecture Components の ViewModel
- `StateFlow` / `MutableStateFlow` と JSON binding
- `by remember` との組み合わせ

### 3.7 `compose/binding`
- `@{}` 構文の Compose 版解釈
- 双方向 binding（TextField）

### 3.8 `compose/components`
- 全コンポーネントを `/reference/components/*` に任せ、ここでは「Compose 実装固有の注意点」のみ
- 例: `NetworkImage` の画像ローダは Coil ベース

### 3.9 `xml`
- XML モード概要
- `library` 配下の `res/` リソースと統合
- `LayoutInflater` ベースのビュー構築

### 3.10 `xml/activity`
- Activity / Fragment 統合
- Intent パラメータのバインド方法

### 3.11 `xml/binding`
- DataBinding ライブラリとの共存
- カスタム binding adapter（存在する場合）

### 3.12 `xml/inflation`
- JSON → View の生成フロー
- 独自 `ViewFactory` への登録

### 3.13 `dynamic-mode`
- 横断解説は `13-content-plan-dynamic-hot-reload.md`
- KotlinJsonUI として:
  - `library-dynamic` を依存に追加
  - `DynamicModeToggle` コンポーネント
  - `BuildConfig.DEBUG` との組み合わせ

### 3.14 `hot-loader`
- `kjui_tools/lib/hotloader/` の `server.js`, `ip_monitor.rb` 経由
- エミュレータ / 実機での接続方法
- LAN 制約、WSL での注意

### 3.15 `custom-components`
- `kjui g view` / `kjui g component` の挙動
- カスタム Composable を converter にマップする方法
- `kjui_tools/lib/compose/` の converter 設計への参照

### 3.16 `coverage`
- 既存 `attribute_check.md` / `Docs/attribute_compatibility.md` を統合生成
- 属性 × モード（Compose / XML）の対応表

### 3.17 `modular-architecture`
- 既存 `MODULAR_ARCHITECTURE.md` をそのまま取り込み
- モジュール分割と依存関係図

### 3.18 `troubleshooting`
- Gradle sync 失敗
- JitPack ビルドエラー
- Hot Loader がエミュレータで繋がらない
- Compose の Recomposition が発生しない

## 4. サイドバー `src/Layouts/components/sidebar_kotlin.json`

構成は `05-content-plan-swiftjsonui.md` と同形式。省略（該当セクションのリンクを列挙）。

## 5. Strings 追加キー

`ref_kotlin_*` プレフィックスで統一。ページ数に応じて約 18 キー × 2 言語。

## 6. コード例の一次ソース

- `sample-app/` 配下（簡易コードのみ抽出）
- `library/src/main/kotlin/.../views/Kjui*.kt` のシグネチャ
- `kjui_tools/lib/compose/converters/` の変換例（インプット JSON vs アウトプット Kotlin）

## 7. スクリーンショット

- エミュレータでの Compose 画面
- Dynamic Mode トグル中 GIF
- XML モードでのビュー結果

## 8. 実装チェックリスト

- [ ] `docs/screens/json/platforms/kotlin/*.spec.json` 約 18 枚（`jui g screen` 一括生成）
- [ ] 各 spec に対し `jui g project --file ...` で Layout + ViewModel を生成
- [ ] `docs/screens/layouts/platforms/kotlin/*.json` を手作業で仕上げ
- [ ] `jsonui-doc-web/src/app/platforms/kotlin/**/page.tsx` ルート
- [ ] `docs/screens/layouts/common/sidebar_kotlin.json`（`platforms: ["web"]`）
- [ ] Strings `ref_kotlin_*` を `Resources/strings.json` に追加
- [ ] 各コンポーネント詳細は `/reference/components/*` へリンクで済ませる
- [ ] `MODULAR_ARCHITECTURE.md` と `FLAVOR_CONFIGURATION.md` を本文 or 引用へ統合
- [ ] Phase 5c で Android ショーケースにも配布（Compose モード推奨）
