# 34. コンテンツプラン: Platforms — KotlinJsonUI 記事本文

> Scope: 8〜12 時間 / 3 セッション。plan 06 の構造設計に対応する**本文・コードサンプル**を書き下ろす。
> 依存: plan 06（ページ構成）、plan 33（Swift 側と揃えるため）。

---

## 1. 対象記事

plan 06 §2 のページ構成に従う（plan 05 の Swift 構造と鏡映）:

| URL |
|---|
| `/platforms/kotlin/overview` |
| `/platforms/kotlin/setup` |
| `/platforms/kotlin/compose` |
| `/platforms/kotlin/compose/composable` |
| `/platforms/kotlin/compose/binding` |
| `/platforms/kotlin/compose/viewmodel` |
| `/platforms/kotlin/xml` |
| `/platforms/kotlin/xml/layout-inflation` |
| `/platforms/kotlin/xml/binding` |
| `/platforms/kotlin/xml/fragment-integration` |
| `/platforms/kotlin/hot-loader` |
| `/platforms/kotlin/dynamic-mode` |
| `/platforms/kotlin/developer-menu` |
| `/platforms/kotlin/navigation` |
| `/platforms/kotlin/custom-components` |
| `/platforms/kotlin/coverage` |
| `/platforms/kotlin/troubleshooting` |

---

## 2. 各ページの書き下ろすべき内容

### 2.1 `/platforms/kotlin/overview`

**一文定義**
- en: "KotlinJsonUI is the Android implementation of JsonUI, supporting both Jetpack Compose (modern) and XML (legacy) from a single Layout JSON."
- ja: "KotlinJsonUI は JsonUI の Android 実装。Jetpack Compose（モダン）と XML（レガシー）の両方を、単一の Layout JSON からサポート。"

**アーキテクチャ対応表**

| JsonUI concept | Compose | XML |
|---|---|---|
| Screen root | `@Composable` function | `Fragment` with inflated XML |
| ViewModel | Android `ViewModel` + `StateFlow` | 同上 |
| Binding | Compose の recomposition | `LiveData` / `StateFlow` + ObservableField |
| Layout reload | `remember { ... }` 再評価 | `requireActivity().recreate()` |

**Compose vs XML 選択ガイド**
- Compose: Android 7.0+ (API 24)、新規アプリ、迅速な開発
- XML: Android 4.x+ 対応が必要、既存 XML リソース活用

#### コードサンプル
1. Compose 版 "Hello World"（JSON + Kotlin code）
2. XML 版 "Hello World"

---

### 2.2 `/platforms/kotlin/setup`

- Requirements: Android 7.0+ (API 24) for Compose / Android 5.0+ for XML、Kotlin 1.9+、Gradle 8+
- `build.gradle.kts` への依存追加（KotlinJsonUI / Compose / Navigation）
- `kjui` CLI install（ワンライナーまたは手動）
- `kjui.config.json` 雛形
- 初回 Hello World コマンド（`kjui init`, `kjui g fragment`, `kjui watch`）
- Hot Loader 有効化（`NetworkSecurityConfig` XML）
- Troubleshooting（依存競合、minSdkVersion、R8/ProGuard）

#### コードサンプル
1. `build.gradle.kts` 依存セクション
2. `kjui.config.json` 完全雛形
3. Hot Loader 用 `network_security_config.xml`

---

### 2.3 `/platforms/kotlin/compose`

- Compose モードの全体像
- 生成される `@Composable` function と ViewModel
- Layout JSON ↔ Compose tree の対応
- Material 3 theme との統合

#### コードサンプル
1. 生成された `@Composable` function 完全形
2. `MaterialTheme { ... }` ラップ例

---

### 2.4 `/platforms/kotlin/compose/composable`

- `@Composable` function のシグネチャ
- `Modifier` chain の生成順序
- recomposition のトリガー
- `@Preview` との統合

#### コードサンプル
1. 生成 Composable の詳細リーディング
2. `@Preview` annotation 付き Composable

---

### 2.5 `/platforms/kotlin/compose/binding`

- `StateFlow.collectAsStateWithLifecycle()` パターン
- `mutableStateOf` / `derivedStateOf` の使い分け
- two-way binding（`TextField` の onValueChange）
- 条件付き recomposition の最適化

#### コードサンプル
1. `StateFlow` → Compose UI 更新の完全例
2. two-way TextField binding

---

### 2.6 `/platforms/kotlin/compose/viewmodel`

- Android `ViewModel` + `StateFlow` テンプレート
- `viewModelScope.launch` での coroutine
- `SavedStateHandle` の扱い
- Hilt / Dagger との統合

#### コードサンプル
1. フル ViewModel テンプレート（state + event + coroutine）
2. Hilt 注入の完全例

---

### 2.7 `/platforms/kotlin/xml`

- XML モードの全体像
- 生成される Fragment + XML layout
- Layout JSON ↔ Android XML の変換

#### コードサンプル
1. 生成された XML layout 全文
2. 対応する Fragment クラス

---

### 2.8 `/platforms/kotlin/xml/layout-inflation`

- `onCreateView` での inflation
- Data Binding ライブラリとの統合
- `LayoutInflater` カスタマイズ

#### コードサンプル
1. Data Binding 付き Fragment
2. Custom `LayoutInflater.Factory`

---

### 2.9 `/platforms/kotlin/xml/binding`

- `ObservableField` / `LiveData` / `StateFlow` からの binding
- `android:text="@{viewModel.title}"` 構文
- two-way binding（`android:text="@={viewModel.input}"`）

#### コードサンプル
1. Data Binding XML 完全例
2. ViewModel 側の `MutableLiveData`

---

### 2.10 `/platforms/kotlin/xml/fragment-integration`

- `NavHostFragment` との統合
- backstack 管理
- Fragment lifecycle と ViewModel scope

#### コードサンプル
1. `navigation.xml` + Fragment 連携
2. Fragment lifecycle フック

---

### 2.11 `/platforms/kotlin/hot-loader`

- Hot Loader の仕組み（ADB 経由または WebSocket）
- `kjui hotload start/stop/status`
- エミュレータ / 実機での接続
- `NetworkSecurityConfig` 設定
- トラブルシューティング

#### コードサンプル
1. `Application` クラスでの Hot Loader 起動
2. `network_security_config.xml`

---

### 2.12 `/platforms/kotlin/dynamic-mode`

- Dynamic Mode の全体像
- Compose での実装（`DynamicComposable(layoutPath:)`）
- XML での実装（`DynamicFragment`）
- 配信戦略

#### コードサンプル
1. Dynamic Compose 描画
2. CDN fetch パターン

---

### 2.13 `/platforms/kotlin/developer-menu`

- Debug build でのメニュー表示
- 提供機能: Layout tree dump、ViewModel dump、Hot Loader URL 変更
- `BuildConfig.DEBUG` ガード

#### コードサンプル
1. Developer Menu 初期化
2. カスタム機能追加

---

### 2.14 `/platforms/kotlin/navigation`

**注**: plan 29 (guides/navigation) と重複しないように、Kotlin 固有の詳細のみ扱う:
- Jetpack Compose Navigation の型付きルート（2024 の SafeArgs）
- NavGraph の XML 定義詳細
- DeepLink 用 `<intent-filter>` の書き方
- Back stack entry の引数受け渡し

#### コードサンプル
1. Typed Compose Navigation routes
2. NavGraph XML deep link 定義

---

### 2.15 `/platforms/kotlin/custom-components`

- Compose `@Composable` カスタム
- XML `CustomView` 実装
- 登録方法（`JsonUIViewCreator.register`）

#### コードサンプル
1. Compose カスタム Composable
2. XML CustomView

---

### 2.16 `/platforms/kotlin/coverage`

| Component | Compose | XML |
|---|---|---|
| Label | ✓ | ✓ |
| Button | ✓ | ✓ |
| ... | | |

---

### 2.17 `/platforms/kotlin/troubleshooting`

- Gradle sync 失敗 → `KotlinJsonUI` version の確認
- Hot Loader が繋がらない → `NetworkSecurityConfig` 確認
- `StateFlow` collection しても UI 更新されない → `collectAsStateWithLifecycle` 使用確認
- R8/ProGuard エラー → `consumer-rules.pro` 追加
- ViewModel が Fragment 再生成で再作成される → `viewModels()` delegate 確認

---

## 3. 必要 strings キー

prefix: `platform_kotlin_<page>_*`

概算 400 キー × 2 言語。

---

## 4. クロスリンク追加先

- `/learn/installation` → `/platforms/kotlin/overview`
- `/reference/components/*` の Android 列から該当ページへ
- `/guides/navigation` の Android 節 → `/platforms/kotlin/navigation`
- `/concepts/hot-reload` → `/platforms/kotlin/hot-loader`

---

## 5. 実装チェックリスト

- [ ] 17 ページ分の spec ファイル作成
- [ ] 17 ページ分の strings キー追加
- [ ] Layout 生成
- [ ] 各ページ CodeBlock ≥ 3
- [ ] Coverage 表完成
- [ ] クロスリンク追加
- [ ] `jui build` / `jui verify` / `jsonui-localize`

---

## 6. セッション分割の推奨境界

- **分割 A**: overview + setup + Compose 4 ページ（4 時間）
- **分割 B**: XML 4 ページ + Navigation（4 時間）
- **分割 C**: Hot Loader + Dynamic + Developer Menu + Custom + Coverage + Troubleshooting（4 時間）
