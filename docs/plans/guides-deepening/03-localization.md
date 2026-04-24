# 03 · localization 深堀り

## 現状

4 section: `shape` / `add` / `runtime` / `scale`。heading + body Label のみ、CodeBlock なし。本文は抽象的で、具体的な key 例や platform 差分が一切ない。

## 実装現実 vs 現在の記述

**最大のギャップ 1**: `jui localize` コマンドは**存在しない**。"localize" はすべて `jui build` の `_distribute_resources()` に内包。
**最大のギャップ 2**: Android は **StringManager.kt を生成しない**。`res/values[-lang]/strings.xml` のネイティブ形式を書き出す。iOS は `Localizable.strings`、Web は `StringManager.ts` singleton。3 platform で内部表現が異なる。
**最大のギャップ 3**: runtime language switching は Web 専用（reactive）、iOS/Android はデバイス言語依存。

### strings.json の正確な shape

`/Users/like-a-rolling_stone/resource/JsonUIDocument/docs/screens/layouts/Resources/strings.json` は 256KB。shape:

```json
{
  "home": {
    "hero_title": { "en": "One spec.", "ja": "ひとつの仕様で。" },
    "hero_cta_primary": "Install in one line"   // ← flat string もあり、全言語共通 fallback
  },
  "learn_index": { ... },
  "cells_agent_row": { ... }
}
```

- 外側キー = screen namespace（layout filename から自動派生、`cells/agent_row.json` → `cells_agent_row`）
- 内側キー = snake_case key
- 値 = `{ en, ja, ...}` 形式（ISO code 自由）または flat string（全言語共通）

### Platform 別出力（実地調査結果）

**iOS (Swift)**:
- Generator: `sjui_tools/lib/core/resources/string_manager.rb`
- 出力: `ResourceManager/StringManager.swift`（または config の `resource_manager_directory`）
- 形: nested public struct
  ```swift
  public struct StringManager {
    public struct Home {
      public static func heroTitle() -> String { "home_hero_title".localized() }
    }
  }
  ```
- snake_case → camelCase 自動変換
- Runtime: `.localized()` は iOS SDK の `Localizable.strings` を読む。言語切替はデバイス設定依存。

**Android (Kotlin)**:
- **Generator は実質 disabled**: `kjui_tools/lib/core/resources/string_manager.rb` line 36 に "Disabled: StringManager.kt generation is not needed"
- 代わりに `res/values/strings.xml` + `res/values-ja/strings.xml` + ... を生成
- Access: `context.getString(R.string.home_hero_title)` — 標準 Android API
- Runtime: デバイス言語依存 + `Configuration.locale`

**Web (React/TS)**:
- Generator: `rjui_tools/lib/cli/commands/build_command.rb` の `update_string_manager()` (lines 407-617)
- 出力: `src/generated/StringManager.ts` (or `.js`)
- 形:
  ```typescript
  const strings = { en: { home_hero_title: "..." }, ja: { home_hero_title: "..." } };
  class StringManagerClass {
    private _currentLanguage: string;
    get currentLanguage(): StringMap { /* camelCase proxy */ }
    setLanguage(lang: string): void { ... }
    getString(key: string): string { ... }
  }
  export const StringManager = new StringManagerClass();
  ```
- 使用: `StringManager.currentLanguage.homeHeroTitle` （camelCase proxy）
- Runtime: `StringManager.setLanguage("ja")` で reactive に切替。Next.js コンポーネントが自動 re-render。

### Interpolation

- iOS format `%@` ⇔ Android format `%s` は **ビルド時に自動変換**（`sjui_tools/lib/core/resources/string_manager.rb` 410-414, kjui 414-419）
- Web は literal、interpolation 組み込み無し（書式指定子は文字列として保持）

### Plurals / pseudo-loc

**どちらも未対応**。plural は `item_singular` / `items_plural` を分けて VM 側で switch するしかない。

### 新言語追加手順

1. `strings.json` の全エントリに新 language code を足す（例: `"ko": "..."`）。
2. `jui.config.json` / `sjui.config.json` / `kjui.config.json` / `rjui.config.json` の `languages` array に追加。
3. `jui build` — 以下が自動で走る:
   - iOS: `ko.lproj/Localizable.strings` を生成（Xcode project 側で `ko.lproj` の参照登録は手動）
   - Android: `res/values-ko/strings.xml` を生成
   - Web: `StringManager.ts` の `strings` object に `ko` key が追加される
4. 手動確認:
   - iOS: Xcode の Project > Info > Localizations に `Korean` を追加。`.strings` ファイルの reference 自動化は sjui の Xcode project edit tool でやる（詳細は `sjui build` log に出る）。
   - Web: 即有効。`StringManager.setLanguage("ko")` で切替。
   - Android: 即有効（resource system が自動）。

### Gotchas

- bug report `2026-04-23-rjui-array-element-localize.md`: 配列内の string prop が localize されない bug → 修正済み。
- bug report `2026-04-23-rjui-custom-string-props-localize.md`: custom component の string prop が StringManager を通らない → 修正済み。
- 編集した `strings.json` は hand-written 部分も `jui build` で**保護される**（Hash 多言語値を literal string で上書きしない safety）。
- 未定義 key: iOS/Android はクラッシュリスク（resource not found）、Web は `getString(key)` が key 自体を返す（dev で目視検出）。

## 目標構造

4 section → **6 section**:

1. **The bilingual shape** — strings.json の exact layout。
2. **How keys are named** — screen namespace + snake_case の convention、実在 key を quote。
3. **What each platform emits** — iOS/Android/Web で出力が違うことを table で明示。
4. **Runtime switching (Web)** — `StringManager.setLanguage()` の reactive モデル。
5. **Adding a new language** — 5 step check list。
6. **Limits (plurals, interpolation, pseudo-loc)** — 誠実に "ここは未対応" を書く。

## 新設 section 詳細

### 1. The bilingual shape

**body**: 「`strings.json` は 2 階層の JSON。外側は screen namespace、内側は snake_case key、値は `{ en, ja, ... }` の多言語 object か flat string。」

**CodeBlock** (json):
```json
{
  "home": {
    "hero_title": {
      "en": "One spec. Native iOS, Android, and Web.",
      "ja": "ひとつの仕様で、iOS・Android・Webを描く。"
    },
    "hero_cta_primary": {
      "en": "Install in one line",
      "ja": "ワンライナーで導入"
    }
  },
  "cells_agent_row": {
    "placeholder_response_empty": "Response will appear here."
  }
}
```

**Callout**: 「flat string は全言語共通の fallback（まだ翻訳されていない文字列）。後で `{ en, ja }` に昇格できる。」

### 2. How keys are named

**body**: 「namespace は layout filename から自動派生。subdirectory は `_` で連結される。」

**Table** (Label grid):

| layout file | namespace |
|---|---|
| `home.json` | `home` |
| `learn/hello-world.json` | `learn_hello_world` |
| `cells/agent_row.json` | `cells_agent_row` |
| `guides/localization.json` | `guides_localization` |

**body**: 「key は snake_case。`jui build` が layout の `text` / `hint` / `placeholder` / `label` / `prompt` を自動抽出して namespace に追記する。手書きキーも `strings.json` に直接追加できる。」

### 3. What each platform emits

**body**: 「build 時、3 platform で異なるファイルが出る。同じ strings.json から出るが、形式は native 寄り。」

**Table**:

| | 生成ファイル | Access |
|---|---|---|
| iOS | `ResourceManager/StringManager.swift` + `ja.lproj/Localizable.strings` | `StringManager.Home.heroTitle()` |
| Android | `res/values/strings.xml` + `res/values-ja/strings.xml` | `context.getString(R.string.home_hero_title)` |
| Web | `src/generated/StringManager.ts` | `StringManager.currentLanguage.homeHeroTitle` |

**CodeBlock** (swift — iOS excerpt):
```swift
// @generated — do not edit
public struct StringManager {
  public struct Home {
    public static func heroTitle() -> String {
      return "home_hero_title".localized()
    }
  }
}
```

**CodeBlock** (xml — Android excerpt):
```xml
<!-- res/values-ja/strings.xml — @generated -->
<resources>
    <string name="home_hero_title">ひとつの仕様で、iOS・Android・Webを描く。</string>
</resources>
```

**CodeBlock** (typescript — Web excerpt):
```typescript
// @generated
const strings = {
  en: { home_hero_title: "One spec. Native iOS, Android, and Web." },
  ja: { home_hero_title: "ひとつの仕様で、iOS・Android・Webを描く。" },
};
// usage
StringManager.currentLanguage.homeHeroTitle;
```

**Callout**: 「Android のみ StringManager.kt は**生成されない**。Android 標準の R.string 経由。これは意図的で、Android の native localization 機構（Configuration.locale, resource fallback chain）と競合しないため。」

### 4. Runtime switching (Web)

**body**: 「`StringManager.setLanguage(lang)` が Web でのみ reactive に機能する。iOS/Android はデバイス言語が source of truth。」

**CodeBlock** (typescript):
```typescript
// In a language toggle button
"use client";
import { StringManager } from "@/generated/StringManager";
import { useRouter } from "next/navigation";

export function LanguageToggle() {
  const router = useRouter();
  return (
    <button onClick={() => {
      const next = StringManager.language === "ja" ? "en" : "ja";
      StringManager.setLanguage(next);
      router.refresh();  // re-render current route
    }}>
      {StringManager.language === "ja" ? "EN" : "JA"}
    </button>
  );
}
```

**Callout (iOS/Android)**: 「iOS は Settings > 一般 > 言語と地域 で、Android は Settings > System > Languages で。アプリ内 toggle は手書きコードが要る（`Locale.preferredLanguages` / `AppCompatDelegate.setApplicationLocales()`）。」

### 5. Adding a new language (e.g., Korean)

**body**: 「5 step。spec/schema 変更は不要。」

**CodeBlock** (json — step 1):
```jsonc
// docs/screens/layouts/Resources/strings.json
{
  "home": {
    "hero_title": {
      "en": "One spec.",
      "ja": "ひとつの仕様で。",
      "ko": "하나의 사양."   // ← add this
    }
  }
}
```

**CodeBlock** (json — step 2):
```json
// jui.config.json / rjui.config.json / sjui.config.json / kjui.config.json
{ "languages": ["en", "ja", "ko"], "default_language": "en" }
```

**CodeBlock** (bash — step 3):
```bash
jui build
# → ja.lproj/ and ko.lproj/ appear for iOS
# → res/values-ja/ and res/values-ko/ for Android
# → StringManager.ts gets a `ko` branch
```

**body (steps 4-5)**:
- iOS: Xcode > Project > Info > Localizations に Korean を追加（GUI one-time action）。
- Web: `StringManager.setLanguage("ko")` で切替 UI を追加。
- Android: 自動。デバイス言語が ko に合えば即反映。

### 6. Limits

**body**: 「現時点で未対応のものを明示する。」

**Callout** (warn):
- **Plurals**: ICU MessageFormat 風の plural rule は未対応。`item_singular` / `items_plural` を keys で分けて VM で switch する。
- **Pseudo-localization**: auto-prefix/suffix での missing translation 検出 tool 無し。
- **Interpolation syntax diff**: iOS `%@` と Android `%s` は build 時に自動変換。Web は literal（format なし）、positional 指定子 `%1$@` / `%1$s` もサポート。

## Spec 編集差分

`docs/screens/json/guides/localization.spec.json`:
- TOC 4 → 6: `toc_shape`, `toc_naming`, `toc_platforms`, `toc_runtime`, `toc_new_lang`, `toc_limits`
- sections: `section_shape`, `section_naming`, `section_platforms`, `section_runtime`, `section_new_lang`, `section_limits`

## strings.json 新設キー（localization namespace）

```
localization_section_shape_heading/body
localization_section_naming_heading/body
localization_section_naming_table_* (layout_file, namespace, 4 rows × 2 cols = 8)
localization_section_platforms_heading/body
localization_section_platforms_table_* (platform, gen_file, access, 4 rows × 3 cols = 12)
localization_section_platforms_android_callout
localization_section_runtime_heading/body
localization_section_runtime_ios_android_callout
localization_section_new_lang_heading/body
localization_section_new_lang_step4_note
localization_section_new_lang_step5_note
localization_section_limits_heading
localization_section_limits_plurals
localization_section_limits_pseudo
localization_section_limits_interpolation
localization_toc_row_* (6 rows)
```

既存キー（`section_shape`, `section_add`, `section_runtime`, `section_scale`）は rename が必要（`section_shape` は維持、`section_add` → `section_new_lang`, `section_runtime` は同名で維持、`section_scale` は削除 or `section_limits` に改名）。**rename は危険なので、新キーを足して古いキーは strings.json 上残置、spec 側の参照だけ新キーに切替**。

## VM 差分

`LocalizationViewModel.ts` — nextReadLinks のみ。変更なし。

## 検証手順

1. Android 生成物の確認: `kjui_tools` の最新挙動で StringManager.kt が disabled 状態か再確認（上記調査は April 2026 時点）
2. Web の `StringManager.language` API が存在し getter/setter の signature が仕様通りか確認（`src/generated/StringManager.ts` を実地確認）
3. `jui build` → zero warnings / `jui verify --fail-on-diff` → no drift
4. ブラウザで `/guides/localization` 目視。CodeBlock 5 本、Table 2 本、Callout 3 本が揃うこと

## 作業見積り

- 調査: Web の StringManager 実コード確認（rjui の現在 HEAD）0.3h
- strings.json: 60+ keys × 2 lang ≒ 120 entries ≒ 2.5h
- spec: 1h
- ブラウザ確認 + fix: 1h
- 計 **~5h**

