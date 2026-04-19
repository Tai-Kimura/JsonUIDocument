# JsonUI Documentation Site - 仕様設計書

## 概要

JsonUIファミリー（SwiftJsonUI、KotlinJsonUI、ReactJsonUI）の統合ドキュメントサイト。
React公式ドキュメント（https://ja.react.dev/）のデザインを参考に、ReactJsonUIを使用して構築する。

---

## サイト構成

### ページ構造

```
/                           # ホームページ（ランディング）
/learn                      # 学習ガイド
  /learn/getting-started    # はじめに
  /learn/installation       # インストール
  /learn/quick-start        # クイックスタート
  /learn/json-basics        # JSON基礎
/reference                  # APIリファレンス
  /reference/components     # コンポーネント一覧
  /reference/attributes     # 属性リファレンス
  /reference/data-binding   # データバインディング
  /reference/include        # Includeシステム
  /reference/styles         # スタイルシステム
/platforms                  # プラットフォーム別
  /platforms/swift          # SwiftJsonUI
  /platforms/kotlin         # KotlinJsonUI
  /platforms/react          # ReactJsonUI
/community                  # コミュニティ
/blog                       # ブログ・リリースノート
```

---

## デザイン仕様

### カラーパレット

```json
{
  "colors": {
    "primary": "#087EA4",       // JsonUIブランドカラー（Reactブルー系）
    "primaryDark": "#149ECA",   // ダークモード用
    "secondary": "#23272F",     // テキスト
    "secondaryLight": "#5E687E", // サブテキスト
    "background": "#FFFFFF",    // 背景
    "backgroundDark": "#23272F", // ダークモード背景
    "surface": "#F6F7F9",       // カード背景
    "surfaceDark": "#343A46",   // ダークモードカード
    "border": "#E5E7EB",        // ボーダー
    "accent": {
      "swift": "#FA7343",       // Swift オレンジ
      "kotlin": "#7F52FF",      // Kotlin パープル
      "react": "#61DAFB"        // React シアン
    }
  }
}
```

### タイポグラフィ

```json
{
  "typography": {
    "fontFamily": {
      "sans": "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "mono": "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace"
    },
    "fontSize": {
      "hero": 64,
      "h1": 40,
      "h2": 32,
      "h3": 24,
      "h4": 20,
      "body": 16,
      "small": 14,
      "caption": 12
    },
    "fontWeight": {
      "regular": "normal",
      "medium": "500",
      "semibold": "600",
      "bold": "bold"
    }
  }
}
```

---

## コンポーネント設計

### 1. ヘッダー（Header）

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo] JsonUI          Learn  Reference  Platforms  Community  │
│                                              [Search] [GitHub]  │
└─────────────────────────────────────────────────────────────────┘
```

**機能:**
- ロゴ（ホームへリンク）
- メインナビゲーション
- 検索バー
- GitHubリンク
- ダークモード切り替え（将来）

### 2. サイドバー（Sidebar）

```
┌──────────────────┐
│ Getting Started  │
│   ├─ はじめに    │
│   ├─ インストール │
│   └─ クイックスタート │
│                  │
│ コンポーネント   │
│   ├─ View        │
│   ├─ Label       │
│   ├─ Button      │
│   └─ ...         │
└──────────────────┘
```

**機能:**
- 折りたたみ可能なセクション
- 現在のページをハイライト
- スクロール連動（目次）

### 3. ホームページ（Home）

#### Hero セクション
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              JsonUI                                             │
│   JSON-driven UI framework for iOS, Android, and Web           │
│                                                                 │
│   [Get Started]  [API Reference]                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### プラットフォームカード
```
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ SwiftJsonUI │  │KotlinJsonUI │  │ ReactJsonUI │             │
│  │ iOS/macOS   │  │ Android     │  │ Web         │             │
│  │ UIKit       │  │ Compose     │  │ React       │             │
│  │ SwiftUI     │  │ XML         │  │ Tailwind    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

#### 特徴セクション
- **Write Once**: 1つのJSONで複数プラットフォーム対応
- **Type Safe**: 自動コード生成でタイプセーフ
- **Hot Reload**: リアルタイムプレビュー
- **Data Binding**: 宣言的データバインディング

#### コード例セクション
```
┌─────────────────────────────────────────────────────────────────┐
│  JSON                          │  Preview                       │
│  ─────────────────────────     │  ─────────────────────────     │
│  {                             │  ┌─────────────────────┐       │
│    "type": "View",             │  │  Welcome!           │       │
│    "child": [                  │  │  [Get Started]      │       │
│      ...                       │  └─────────────────────┘       │
│    ]                           │                                │
│  }                             │                                │
└─────────────────────────────────────────────────────────────────┘
```

### 4. コンポーネントページ（Component Page）

```
┌─────────────────────────────────────────────────────────────────┐
│ Sidebar │  # Label                                              │
│         │                                                       │
│         │  テキストを表示するための基本コンポーネント            │
│         │                                                       │
│         │  ## 基本的な使い方                                    │
│         │  [コード例]  [プレビュー]                              │
│         │                                                       │
│         │  ## 属性                                              │
│         │  | 属性名 | 型 | 説明 | デフォルト |                  │
│         │  |--------|-----|------|-----------|                  │
│         │                                                       │
│         │  ## プラットフォーム対応                               │
│         │  | Platform | Support |                               │
│         │                                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 5. フッター（Footer）

```
┌─────────────────────────────────────────────────────────────────┐
│  Learn           Reference        Platforms       Community     │
│  ─────           ─────────        ─────────       ─────────     │
│  Getting Started Components       SwiftJsonUI     GitHub        │
│  Quick Start     Attributes       KotlinJsonUI    Issues        │
│  JSON Basics     Data Binding     ReactJsonUI     Discussions   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  Copyright © 2025 JsonUI. Built with ReactJsonUI.              │
└─────────────────────────────────────────────────────────────────┘
```

---

## JSON Layoutファイル構造

```
src/Layouts/
├── components/           # 再利用コンポーネント
│   ├── header.json
│   ├── sidebar.json
│   ├── footer.json
│   ├── platform_card.json
│   ├── feature_card.json
│   ├── code_block.json
│   └── attribute_table.json
├── pages/
│   ├── home.json         # ホームページ
│   ├── learn/
│   │   ├── getting_started.json
│   │   ├── installation.json
│   │   └── quick_start.json
│   ├── reference/
│   │   ├── components.json
│   │   ├── view.json
│   │   ├── label.json
│   │   ├── button.json
│   │   └── ...
│   └── platforms/
│       ├── swift.json
│       ├── kotlin.json
│       └── react.json
└── sample.json           # 初期サンプル（削除予定）

src/Styles/
├── colors.json           # カラー定義
├── typography.json       # フォント定義
├── divider.json
├── spacer.json
├── spacer_16.json
├── spacer_24.json
├── spacer_32.json
├── card.json             # カードスタイル
├── button_primary.json
├── button_secondary.json
└── code_block.json
```

---

## Next.js ルーティング

```
src/app/
├── layout.tsx            # 共通レイアウト（Header, Footer）
├── page.tsx              # / （ホーム）
├── learn/
│   ├── page.tsx          # /learn
│   ├── getting-started/
│   │   └── page.tsx
│   ├── installation/
│   │   └── page.tsx
│   └── quick-start/
│       └── page.tsx
├── reference/
│   ├── page.tsx          # /reference
│   ├── components/
│   │   └── page.tsx
│   ├── [component]/      # 動的ルート
│   │   └── page.tsx
│   └── attributes/
│       └── page.tsx
├── platforms/
│   ├── page.tsx
│   ├── swift/
│   │   └── page.tsx
│   ├── kotlin/
│   │   └── page.tsx
│   └── react/
│       └── page.tsx
└── community/
    └── page.tsx
```

---

## 実装フェーズ

### Phase 1: 基盤構築
1. [x] Next.jsプロジェクト作成
2. [x] rjui_tools初期化
3. [ ] 共通スタイル定義
4. [ ] Header/Footer/Sidebarコンポーネント作成
5. [ ] 基本レイアウト構築

### Phase 2: ホームページ
1. [ ] Heroセクション
2. [ ] プラットフォームカード
3. [ ] 特徴セクション
4. [ ] コード例セクション

### Phase 3: ドキュメントページ
1. [ ] Learn セクション
2. [ ] Reference セクション（コンポーネント）
3. [ ] Platforms セクション

### Phase 4: 高度な機能
1. [ ] 検索機能
2. [ ] ダークモード
3. [ ] コードハイライト
4. [ ] インタラクティブプレビュー

---

## 技術スタック

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **UI Generation**: ReactJsonUI (rjui_tools)
- **Language**: TypeScript
- **Code Highlighting**: Prism.js or Shiki（将来）
- **Icons**: Heroicons or Lucide（将来）

---

## 参考リンク

- React公式ドキュメント: https://ja.react.dev/
- SwiftJsonUI Wiki: https://github.com/Tai-Kimura/SwiftJsonUI/wiki
- KotlinJsonUI: https://github.com/Tai-Kimura/KotlinJsonUI
- ReactJsonUI: https://github.com/Tai-Kimura/ReactJsonUI
