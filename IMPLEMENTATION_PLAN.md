# JsonUIDocument 実装計画

## Phase 1: 基盤構築

### 1.1 共通スタイル定義
- [ ] `src/Styles/colors.json` - カラーパレット定義
- [ ] `src/Styles/typography.json` - フォントスタイル
- [ ] `src/Styles/card.json` - カードスタイル
- [ ] `src/Styles/button_primary.json` - プライマリボタン
- [ ] `src/Styles/button_secondary.json` - セカンダリボタン
- [ ] `src/Styles/divider.json` - 区切り線
- [ ] `src/Styles/spacer_*.json` - スペーサー各種

### 1.2 多言語文字列定義

JSONで `"text": "nav_learn"` のようにsnake_caseキーを指定すると、
自動的に `{StringManager.currentLanguage.navLearn}` に変換される。

#### 文字列キー一覧

**ナビゲーション:**
| キー | English | 日本語 |
|------|---------|--------|
| `nav_learn` | Learn | 学ぶ |
| `nav_reference` | Reference | リファレンス |
| `nav_platforms` | Platforms | プラットフォーム |
| `nav_community` | Community | コミュニティ |

**ホームページ:**
| キー | English | 日本語 |
|------|---------|--------|
| `hero_title` | JsonUI | JsonUI |
| `hero_subtitle` | JSON-driven UI framework for iOS, Android, and Web | iOS、Android、Web向けJSON駆動UIフレームワーク |
| `btn_get_started` | Get Started | はじめる |
| `btn_api_reference` | API Reference | APIリファレンス |

**プラットフォームカード:**
| キー | English | 日本語 |
|------|---------|--------|
| `platform_swift_title` | SwiftJsonUI | SwiftJsonUI |
| `platform_swift_desc` | iOS/macOS with UIKit & SwiftUI | iOS/macOS UIKit & SwiftUI対応 |
| `platform_kotlin_title` | KotlinJsonUI | KotlinJsonUI |
| `platform_kotlin_desc` | Android with Compose & XML | Android Compose & XML対応 |
| `platform_react_title` | ReactJsonUI | ReactJsonUI |
| `platform_react_desc` | Web with React & Tailwind | Web React & Tailwind対応 |

**特徴セクション:**
| キー | English | 日本語 |
|------|---------|--------|
| `feature_write_once` | Write Once | 一度書けば |
| `feature_write_once_desc` | Single JSON definition works across all platforms | 1つのJSON定義で全プラットフォーム対応 |
| `feature_type_safe` | Type Safe | 型安全 |
| `feature_type_safe_desc` | Auto-generated code ensures type safety | 自動生成コードで型安全を保証 |
| `feature_hot_reload` | Hot Reload | ホットリロード |
| `feature_hot_reload_desc` | See changes instantly without rebuilding | リビルドなしで即座に変更を確認 |
| `feature_data_binding` | Data Binding | データバインディング |
| `feature_data_binding_desc` | Declarative data binding with @{} syntax | @{}構文による宣言的データバインディング |

**フッター:**
| キー | English | 日本語 |
|------|---------|--------|
| `footer_copyright` | Copyright © 2025 TANOSYS, LLC. Built with ReactJsonUI. | Copyright © 2025 TANOSYS, LLC. ReactJsonUIで構築。 |

**Learnセクション:**
| キー | English | 日本語 |
|------|---------|--------|
| `learn_getting_started` | Getting Started | はじめに |
| `learn_installation` | Installation | インストール |
| `learn_quick_start` | Quick Start | クイックスタート |
| `learn_json_basics` | JSON Basics | JSON基礎 |

**Referenceセクション:**
| キー | English | 日本語 |
|------|---------|--------|
| `ref_components` | Components | コンポーネント |
| `ref_attributes` | Attributes | 属性 |
| `ref_data_binding` | Data Binding | データバインディング |
| `ref_include` | Include System | Includeシステム |
| `ref_styles` | Styles | スタイル |

#### ファイル
- [ ] `src/Strings/en.json` - 英語文字列（上記キー全て）
- [ ] `src/Strings/ja.json` - 日本語文字列（上記キー全て）

#### 言語切り替え機能
- [ ] 言語切り替えボタン（Header内）
- [ ] `StringManager.setLanguage('ja')` で切り替え
- [ ] ブラウザのlocalStorageに保存（将来）

### 1.3 共通コンポーネント（Layouts/components/）
- [ ] `header.json` - ヘッダー（ロゴ、ナビゲーション、GitHub）
- [ ] `footer.json` - フッター（リンク集、コピーライト）
- [ ] `sidebar.json` - サイドバー（ドキュメントナビ）

### 1.4 Next.js レイアウト
- [ ] `src/app/layout.tsx` - Header/Footer統合

---

## Phase 2: ホームページ

### 2.1 ホームページJSON
- [ ] `src/Layouts/pages/home.json`

### 2.2 セクション構成
- [ ] Hero セクション（タイトル、サブタイトル、CTAボタン）
- [ ] プラットフォームカード（Swift/Kotlin/React）
- [ ] 特徴セクション（Write Once, Type Safe, Hot Reload, Data Binding）
- [ ] コード例セクション（JSON + プレビュー）

### 2.3 再利用コンポーネント
- [ ] `platform_card.json` - プラットフォームカード
- [ ] `feature_card.json` - 特徴カード

### 2.4 Next.js ページ
- [ ] `src/app/page.tsx` - ホームページ

---

## Phase 3: Learnセクション

### 3.1 ページJSON
- [ ] `src/Layouts/pages/learn/getting_started.json`
- [ ] `src/Layouts/pages/learn/installation.json`
- [ ] `src/Layouts/pages/learn/quick_start.json`
- [ ] `src/Layouts/pages/learn/json_basics.json`

### 3.2 Next.js ページ
- [ ] `src/app/learn/page.tsx`
- [ ] `src/app/learn/getting-started/page.tsx`
- [ ] `src/app/learn/installation/page.tsx`
- [ ] `src/app/learn/quick-start/page.tsx`
- [ ] `src/app/learn/json-basics/page.tsx`

---

## Phase 4: Referenceセクション

### 4.1 コンポーネントドキュメント
- [ ] `src/Layouts/pages/reference/components.json` - 一覧
- [ ] `src/Layouts/pages/reference/view.json`
- [ ] `src/Layouts/pages/reference/label.json`
- [ ] `src/Layouts/pages/reference/button.json`
- [ ] `src/Layouts/pages/reference/image.json`
- [ ] `src/Layouts/pages/reference/text_field.json`
- [ ] 他コンポーネント...

### 4.2 その他リファレンス
- [ ] `src/Layouts/pages/reference/attributes.json`
- [ ] `src/Layouts/pages/reference/data_binding.json`
- [ ] `src/Layouts/pages/reference/include.json`
- [ ] `src/Layouts/pages/reference/styles.json`

### 4.3 Next.js ページ
- [ ] `src/app/reference/page.tsx`
- [ ] `src/app/reference/components/page.tsx`
- [ ] `src/app/reference/[component]/page.tsx` - 動的ルート
- [ ] `src/app/reference/attributes/page.tsx`

---

## Phase 5: Platformsセクション

### 5.1 プラットフォーム別ページ
- [ ] `src/Layouts/pages/platforms/swift.json`
- [ ] `src/Layouts/pages/platforms/kotlin.json`
- [ ] `src/Layouts/pages/platforms/react.json`

### 5.2 Next.js ページ
- [ ] `src/app/platforms/page.tsx`
- [ ] `src/app/platforms/swift/page.tsx`
- [ ] `src/app/platforms/kotlin/page.tsx`
- [ ] `src/app/platforms/react/page.tsx`

---

## Phase 6: 高度な機能（将来）

- [ ] 検索機能
- [ ] ダークモード対応
- [ ] コードハイライト（Shiki/Prism）
- [ ] インタラクティブプレビュー
- [ ] バージョン切り替え

---

## 実装順序

1. **Phase 1.1** - スタイル定義（colors, card, button等）
2. **Phase 1.2** - 多言語文字列（nav項目、ボタンテキスト等）
3. **Phase 1.3** - Header/Footer JSON作成
4. **Phase 1.4** - layout.tsx統合
5. **Phase 2** - ホームページ完成
6. **Phase 3-5** - ドキュメントページ順次追加

---

## ディレクトリ構造（目標）

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── learn/
│   ├── reference/
│   ├── platforms/
│   └── community/
├── Layouts/
│   ├── components/
│   │   ├── header.json
│   │   ├── footer.json
│   │   ├── sidebar.json
│   │   ├── platform_card.json
│   │   └── feature_card.json
│   └── pages/
│       ├── home.json
│       ├── learn/
│       ├── reference/
│       └── platforms/
├── Styles/
│   ├── colors.json
│   ├── card.json
│   ├── button_primary.json
│   └── ...
├── Strings/
│   ├── en.json
│   └── ja.json
└── generated/
    ├── components/
    └── StringManager.js
```
