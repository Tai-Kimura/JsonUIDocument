# 30. コンテンツプラン: Guides — Localization

> Scope: 3〜5 時間 / 1 セッション。`/guides/localization` を完成。
> 依存: plan 27 (json-schema の strings 節)、plan 24 (binding 属性 `@string/key`)。

---

## 1. 対象記事

| URL | spec | Layout | 現状 |
|---|---|---|---|
| `/guides/localization` | `docs/screens/json/guides/localization.spec.json` | `docs/screens/layouts/guides/localization.json` | 骨組みのみ、CodeBlock 0 |

完成条件: CodeBlock ≥ 10、プラットフォーム別サンプル ≥ 3、クロスリンク ≥ 3。

---

## 2. コンテンツ構造

### 2.1 ページの目的
- en: "Register multi-language strings once in `strings.json` and have them resolved consistently on iOS, Android, and Web. Covers static text, dynamic interpolation, pluralization, and locale switching."
- ja: "`strings.json` に多言語文字列を一度登録し、iOS / Android / Web で一貫して解決。静的テキスト、動的補間、複数形、ロケール切替を網羅。"

### 2.2 基本フロー

#### Step 1: strings.json にキーを追加

```json
{
  "en": {
    "welcome_title": "Welcome, Alice!",
    "action_save": "Save",
    "action_cancel": "Cancel"
  },
  "ja": {
    "welcome_title": "こんにちは、アリスさん！",
    "action_save": "保存",
    "action_cancel": "キャンセル"
  }
}
```

ファイルパス:
- Master: `docs/strings/strings.json`（キー定義）
- Per-language: `docs/strings/en.json`, `docs/strings/ja.json`（値のみ）

#### Step 2: Layout から参照

```json
{
  "type": "Label",
  "text": "@string/welcome_title"
}
```

#### Step 3: `jsonui-localize` で検証

```bash
$ jsonui-localize
✓ All @string/ references resolved
✓ No orphan keys in strings.json
✓ All locales have coverage
```

### 2.3 プラットフォーム別実装

#### iOS (StringManager)

```swift
import SwiftJsonUI

// Auto-generated from strings.json
enum L {
  static let welcomeTitle = StringManager.shared.string(for: "welcome_title")
  static let actionSave = StringManager.shared.string(for: "action_save")
}

// Manual use
let title = StringManager.shared.string(for: "welcome_title")
label.text = title
```

locale 切替:
```swift
StringManager.shared.setLocale("ja")
NotificationCenter.default.post(name: .localeDidChange, object: nil)
```

#### Android (R.string)

```kotlin
// Auto-generated from strings.json → res/values/strings.xml
val title = getString(R.string.welcome_title)

// With arguments (plurals, etc.)
val itemsText = resources.getQuantityString(
  R.plurals.items_count,
  count,
  count
)
```

locale 切替:
```kotlin
val config = resources.configuration
config.setLocale(Locale.JAPAN)
createConfigurationContext(config)
```

#### Web (useTr hook)

```tsx
import { useTr } from "@jsonui/react";

function WelcomeScreen() {
  const t = useTr();
  return <h1>{t("welcome_title")}</h1>;
}
```

locale 切替:
```tsx
const { setLocale } = useLocale();
<button onClick={() => setLocale("ja")}>日本語</button>
```

### 2.4 補間（プレースホルダ）

#### strings.json
```json
{
  "en": { "greeting": "Hello, {name}! You have {count} messages." },
  "ja": { "greeting": "こんにちは、{name}さん！メッセージが {count} 件あります。" }
}
```

#### Layout から参照
```json
{
  "type": "Label",
  "text": "@string/greeting",
  "stringArgs": { "name": "@{userName}", "count": "@{unreadCount}" }
}
```

#### iOS
```swift
let text = StringManager.shared.format("greeting", args: ["name": userName, "count": unreadCount])
```

#### Android
```kotlin
val text = getString(R.string.greeting, userName, unreadCount)
```

#### Web
```tsx
const text = t("greeting", { name: userName, count: unreadCount });
```

### 2.5 複数形（ICU MessageFormat）

#### strings.json
```json
{
  "en": {
    "items_count": {
      "one": "1 item",
      "other": "{count} items"
    }
  },
  "ja": {
    "items_count": {
      "other": "{count} 件"
    }
  }
}
```

ja は複数形の区別がないため `other` のみ必要。en は `one` と `other` 必須。ロシア語など 3 形以上を持つ言語は `one` / `few` / `many` / `other` を用意。

#### 使用
```json
{ "type": "Label", "text": "@string/items_count", "stringArgs": { "count": "@{itemCount}" } }
```

### 2.6 複雑な条件分岐

#### ネスト形式
```json
{
  "en": {
    "status_message": {
      "select": "@status",
      "cases": {
        "pending": "Waiting...",
        "processing": "Processing your order...",
        "done": "Order complete!",
        "other": "Status: {status}"
      }
    }
  }
}
```

使用:
```json
{ "type": "Label", "text": "@string/status_message", "stringArgs": { "status": "@{orderStatus}" } }
```

### 2.7 フォーマッタ（数値・日付・通貨）

strings 側で明示:
```json
{
  "en": {
    "price_display": "Price: {amount, number, currency}",
    "created_at": "Created: {date, date, long}"
  }
}
```

プラットフォーム別のフォーマッタ:
- iOS: `NumberFormatter` / `DateFormatter` 経由で解決
- Android: ICU MessageFormat ネイティブサポート
- Web: `Intl.NumberFormat` / `Intl.DateTimeFormat`

### 2.8 新しい言語の追加

1. `docs/strings/<lang>.json` を作成
2. `jui.config.json` の `locales` 配列に追加:
   ```json
   { "locales": ["en", "ja", "zh-CN", "ko"] }
   ```
3. `jsonui-localize` で整合性を検証（欠落キーがないか）
4. プラットフォーム別の locale 登録:
   - iOS: `Info.plist` の `CFBundleLocalizations` に追加
   - Android: `res/values-<lang>/strings.xml` が自動生成される
   - Web: 自動反映（ビルド時に locales をバンドル）

### 2.9 strings キー命名規則

| Prefix | 用途 | 例 |
|---|---|---|
| `<screen>_*` | 画面固有 | `learn_hello_world_title` |
| `<component>_*` | コンポーネント固有 | `code_block_copy_tooltip` |
| `action_*` | ボタン文言（共通） | `action_save`, `action_cancel`, `action_next` |
| `nav_*` | ナビ関連 | `nav_home`, `nav_back` |
| `form_error_*` | フォームエラー | `form_error_required`, `form_error_invalid_email` |
| `common_*` | 汎用（曜日、月、単位） | `common_weekday_mon`, `common_month_jan` |
| `a11y_*` | アクセシビリティラベル | `a11y_close_button` |

**禁止**:
- 記事の本文をそのままキーにしない（`"title_hello_world_very_long_headline"` ではなく `"hello_world_title"`）
- 日本語キー（`"ようこそ"`）
- スペース混入（`"welcome message"` ではなく `"welcome_message"`）

### 2.10 よくある誤り

- `@string/` の書き忘れ → `"text": "welcome_title"` としてリテラル表示
- `stringArgs` の型ミスマッチ → `{count}` に `String` を渡す → プラットフォームによっては crash
- 複数形の言語別形式不足（en に `one` しかなく `other` 欠落 → jsonui-localize エラー）
- ハードコード英語（`"Save"` を直書き）→ 多言語展開不能
- locale 切替後に既存 ViewModel が re-render されない → 明示的に notify が必要

### 2.11 既存コードからの移行

iOS (`NSLocalizedString`):
```swift
// Before
label.text = NSLocalizedString("welcome_title", comment: "")

// After (with SwiftJsonUI)
label.text = L.welcomeTitle
```

Android (`R.string`):
```kotlin
// 変更不要、R.string.welcome_title のまま使える
// strings.json が res/values/strings.xml を自動生成
```

Web (i18next):
```tsx
// Before
const { t } = useTranslation();
<h1>{t("welcome_title")}</h1>

// After
const t = useTr();
<h1>{t("welcome_title")}</h1>
```

---

## 3. 必要な strings キー

prefix: `guide_localization_*`

- `_intro_*`
- `_flow_step_{1,2,3}_*`
- `_platform_{ios,android,web}_{title,body}`
- `_interpolation_*`, `_pluralization_*`, `_formatter_*`
- `_add_language_*`
- `_naming_*`, `_pitfalls_*`
- `_migration_*`

概算 70 キー × 2 言語。

---

## 4. クロスリンク追加先

- `/learn/first-screen` 「文字列の扱い」節
- `/reference/attributes/binding` の `@string/` 説明から本ガイドへ
- `/reference/json-schema` の strings 節から本ガイドへ

---

## 5. 実装チェックリスト

- [ ] spec metadata 更新
- [ ] strings キー追加
- [ ] CodeBlock ≥ 10
- [ ] 移行コード例 3 プラットフォーム
- [ ] クロスリンク追加
- [ ] `jui build` / `jui verify` / `jsonui-localize`

---

## 6. セッション分割の推奨境界

1 セッションで完結可能。
