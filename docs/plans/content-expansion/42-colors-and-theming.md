# 42. コンテンツプラン: Colors & Theming（colors.json / ColorMode / ダークモード）

> Scope: 6〜9 時間 / 2 セッション（Guide + Reference で分割推奨）。
> 依存:
> - upstream `jsonui-cli/docs/plans/colors-multitheme.md` **Phase 1〜4 が完了**している（`jui sync_tool` で rjui_tools が themed 対応済み）
> - plan 14（リファレンス生成パイプライン）
> - plan 27（`/reference/json-schema`）— 本プランでスキーマ節を 1 本追加する
> - plans 33 / 34 / 35（platforms 本文）— 本プランで ColorManager 節の指示を与えるが、注入は各 platform plan のセッションで行う
>
> 本プランも他の content-expansion 同様、**UI / レイアウト構造には触れない**。テキスト・コードサンプル・strings キー・クロスリンクのみ指示する。

---

## 1. 対象記事

### 1-1. 新設

| URL | spec（新規） | layout（新規） | 想定 CodeBlock |
|---|---|---|---|
| `/guides/theming` | `docs/screens/json/guides/theming.spec.json` | `docs/screens/layouts/guides/theming.json` | ≥ 10 |
| `/reference/colors-json` | `docs/screens/json/reference/colors-json.spec.json` | `docs/screens/layouts/reference/colors-json.json` | ≥ 6 |

### 1-2. 既存記事への節追加（本プランで**本文のみ**指示、layout 変更は当該 plan 側）

| URL | 追加節 | 参照先 plan |
|---|---|---|
| `/platforms/swift/theming` | `ColorManager` API（UIKit / SwiftUI 両方） | plan 33 |
| `/platforms/kotlin/theming` | `ColorManager` API（Views / Compose）+ `res/values-night/` | plan 34 |
| `/platforms/rjui/theming` | `ColorModeProvider` / `useColorMode` / `useSystemColorMode` | plan 35 |
| `/concepts/one-layout-json` | 「色の解決」という第 3 の軸（strings と同じレイヤー）を 1 パラグラフ追加 | — |
| `/guides/localization` | 「姉妹記事: theming」1 行クロスリンク追加 | — |
| `/reference/json-schema` | `colors.json` スキーマを 1 節追加（省略版、本文は `/reference/colors-json` に誘導） | plan 27 |

完成条件:
- `/guides/theming` CodeBlock ≥ 10、プラットフォーム別切替サンプル ≥ 3、クロスリンク ≥ 5
- `/reference/colors-json` CodeBlock ≥ 6、各 meta key（`modes` / `fallback_mode` / `systemModeMapping`）に例付き
- `/platforms/*/theming` 各 CodeBlock ≥ 4

---

## 2. `/guides/theming` の書き下ろし

### 2.1 ページの目的

- en: "Register color palettes once in `colors.json` and switch between light / dark / arbitrary modes at runtime with a single API. Covers schema, auto-migration from flat color files, mode switching, system-mode binding, and per-platform ColorManager usage."
- ja: "`colors.json` に配色パレットを一度だけ登録し、light / dark / 任意モード間をランタイムで単一 API で切り替える方法を解説。スキーマ、flat からの自動マイグレーション、モード切替、システムモード連動、各プラットフォームの ColorManager 利用法を網羅する。"

### 2.2 章立て

```
1. なぜ themed colors.json か（WHY）
2. 1 分クイックスタート（既存 flat から dark 対応）
3. colors.json スキーマ
4. ColorMode は任意の数・任意の名前（高コントラスト / クリスマス例）
5. モードの切替 API（Swift / Kotlin / React）
6. システムモード連動
7. Fallback ポリシー
8. Hex 抽出の書き込み先制御
9. Layout からの参照（`"background": "primary_surface"`）
10. よくある誤り
11. 関連
```

### 2.3 各章の本文・コードサンプル

#### 1. なぜ themed か
- en: "JsonUI's original colors.json was a flat `key → #HEX` map. That works for a single theme, but multi-theme apps needed either runtime swaps (brittle) or duplicate palettes (drifts). The themed schema fixes this by nesting palettes under mode names, making the resolver mode-aware."
- ja: "従来の colors.json は `key → #HEX` のフラットマップだった。単一テーマなら十分だったが、複数テーマ対応のアプリはランタイム差し替えか重複定義を強いられた。themed スキーマはモード名の下にパレットをネストし、解決器がモード認識するようにした。"

#### 2. クイックスタート（3 ステップ）

##### Step 1 — `jui build` で自動マイグレーション

- en: "Existing flat `colors.json` auto-migrates on next `jui build`. No manual work."
- ja: "既存の flat `colors.json` は次の `jui build` で自動的に昇格する。手作業は不要。"

Before:
```json
{
  "primary_surface": "#FFFFFF",
  "accent":          "#2563EB",
  "text":            "#0B1220"
}
```

After（`jui build` 1 回で書き戻し、idempotent）:
```json
{
  "modes": ["light", "dark"],
  "light": {
    "primary_surface": "#FFFFFF",
    "accent":          "#2563EB",
    "text":            "#0B1220"
  },
  "dark": {}
}
```

##### Step 2 — dark palette を埋める

```json
{
  "modes": ["light", "dark"],
  "light": {
    "primary_surface": "#FFFFFF",
    "accent":          "#2563EB",
    "text":            "#0B1220"
  },
  "dark": {
    "primary_surface": "#0B1220",
    "accent":          "#60A5FA",
    "text":            "#F9FAFB"
  }
}
```

##### Step 3 — アプリにモード切替を追加

React:
```tsx
import { ColorModeProvider } from "jsonui-react";

export default function RootLayout({ children }) {
  return <ColorModeProvider>{children}</ColorModeProvider>;
}
```

Swift (SwiftUI):
```swift
@main
struct MyApp: App {
  @StateObject private var colorMode = ColorManager.shared
  var body: some Scene {
    WindowGroup { ContentView().environmentObject(colorMode) }
  }
}
```

Kotlin (Compose):
```kotlin
@Composable
fun App() {
  CompositionLocalProvider(LocalColorMode provides ColorManager.currentMode) {
    // your screens
  }
}
```

#### 3. colors.json スキーマ（最小〜実用）

`{language: "json", note: "予約 meta キー"}`:
```json
{
  "modes": ["light", "dark"],
  "fallback_mode": "light",
  "systemModeMapping": { "light": "light", "dark": "dark" },

  "light": { "accent": "#2563EB" },
  "dark":  { "accent": "#60A5FA" }
}
```

**予約 meta キー表**:

| キー | 型 | 用途 |
|---|---|---|
| `modes` | `string[]` | enum の順序を明示したいとき。省略可（object 挿入順が使われる） |
| `fallback_mode` | `string` | key miss 時の fallback 優先 mode。既定は `light` または先頭 mode |
| `systemModeMapping` | `{light?: string, dark?: string}` | OS の light/dark 判定を任意モード名にマップ |

#### 4. 任意の数・任意の名前

- en: "Mode names are **not fixed**. Any top-level object key (except reserved meta keys above) becomes a ColorMode enum case."
- ja: "モード名は**固定ではない**。上記の予約 meta キーを除き、トップレベルの object キーがそのまま ColorMode enum の case になる。"

```json
{
  "modes": ["light", "dark", "high_contrast", "christmas"],
  "light":          { "accent": "#2563EB" },
  "dark":           { "accent": "#60A5FA" },
  "high_contrast":  { "accent": "#0000FF" },
  "christmas":      { "accent": "#D4AF37" }
}
```

自動生成される enum:
```ts
export type ColorMode = "light" | "dark" | "high_contrast" | "christmas";
```

#### 5. モード切替 API

| Platform | API | 備考 |
|---|---|---|
| Swift | `ColorManager.setMode(.dark)` | `@Environment(\.colorScheme)` → ColorMode helper あり |
| Kotlin (Views) | `ColorManager.setMode(ColorMode.DARK)` | `Configuration.UI_MODE_NIGHT_YES` 連動 opt-in |
| Kotlin (Compose) | `LocalColorMode.current` 参照、`CompositionLocalProvider` で上書き | `@Composable` |
| React | `ColorModeProvider mode="dark"` / `useColorMode().setMode('dark')` | Context 分岐 |

コード例（切替ボタン）:

React:
```tsx
import { useColorMode } from "jsonui-react";

export function ColorModeToggle() {
  const { mode, setMode } = useColorMode();
  return (
    <button onClick={() => setMode(mode === "light" ? "dark" : "light")}>
      {mode === "light" ? "🌙" : "☀️"}
    </button>
  );
}
```

Swift (SwiftUI):
```swift
Button {
  let next: ColorManager.ColorMode = ColorManager.currentMode == .light ? .dark : .light
  ColorManager.setMode(next)
} label: {
  Image(systemName: ColorManager.currentMode == .light ? "moon" : "sun.max")
}
```

Kotlin (Compose):
```kotlin
@Composable
fun ColorModeToggle() {
  val mode = LocalColorMode.current
  IconButton(onClick = {
    ColorManager.setMode(if (mode == ColorMode.LIGHT) ColorMode.DARK else ColorMode.LIGHT)
  }) {
    Icon(if (mode == ColorMode.LIGHT) Icons.Default.DarkMode else Icons.Default.LightMode, null)
  }
}
```

#### 6. システムモード連動

- en: "Enabled by default. JsonUI listens to the platform's light/dark signal and updates `currentMode` automatically."
- ja: "既定で有効。JsonUI はプラットフォームの light/dark シグナルを監視し、`currentMode` を自動更新する。"

OFF にする:
```ts
// React
<ColorModeProvider followSystem={false} initialMode="light">…</ColorModeProvider>
```

```swift
// Swift
ColorManager.followSystemMode = false
ColorManager.setMode(.light)
```

`systemModeMapping` で「OS の dark は christmas モードに」といった遊びも可能:
```json
{
  "modes": ["light", "christmas"],
  "systemModeMapping": { "light": "light", "dark": "christmas" },
  "light":     { "accent": "#2563EB" },
  "christmas": { "accent": "#D4AF37" }
}
```

#### 7. Fallback ポリシー

- lenient（既定）: 要求 mode で miss → fallback mode（既定 `light` または先頭 mode）を参照 → それでも miss → `nil` / `Color.clear` / `Color.Unspecified`
- `jui build` は「key X は mode Y のみ定義」を **INFO で列挙**する（error ではない）
  → dark mode 対応を段階的に進められる

#### 8. Hex 抽出の書き込み先

layout の `"background": "#F00"` を抽出するとき:

```bash
# 既定（light に書き込み）
jui build

# dark に書き込み
jui build --extract-into=dark
```

使い所:
- light palette が完成済 → dark デザイン案を layout に置いて一気に抽出、palette に dark キーが埋まる

#### 9. Layout からの参照

layout 側は themed 対応後も**記述は同じ**。キー名で参照するだけ:
```json
{
  "type": "View",
  "background": "primary_surface",
  "child": [
    { "type": "Label", "text": "Hello", "fontColor": "text" }
  ]
}
```

解決は現在の `currentMode` に応じて自動で切り替わる。`#HEX` のハードコードが残っているとそのキーは themed にならないので注意（抽出推奨）。

#### 10. よくある誤り

- **dark palette を空のまま公開**: fallback で light の値が出る。dark で黒背景のはずが白になる。
- **layout に `#HEX` が残っている**: themed の恩恵なし。`jui build` の warning を確認。
- **Swift/Compose で色が再評価されない**: `@StateObject` / `LocalColorMode` を忘れている。宣言的 UI では必須。
- **`systemModeMapping` の typo**: 予約 meta キーとして扱われないので、モード名として enum に入ってしまう。build log で確認。

#### 11. 関連

- [`/guides/localization`](/guides/localization) — strings と同じレイヤーの resolve 機構
- [`/reference/colors-json`](/reference/colors-json) — スキーマ詳細
- [`/platforms/swift/theming`](/platforms/swift/theming) / [`/platforms/kotlin/theming`](/platforms/kotlin/theming) / [`/platforms/rjui/theming`](/platforms/rjui/theming)
- [`/concepts/one-layout-json`](/concepts/one-layout-json) — 1 layout で多モード

---

## 3. `/reference/colors-json` の書き下ろし

### 3.1 ページ種別
- Reference（flat な事実列挙）。How-to は `/guides/theming` に任せ、こちらは**仕様**に集中。

### 3.2 章立て

```
1. 概要
2. ファイル位置（platform 別）
3. スキーマ定義
4. 予約 meta キー
5. 自動マイグレーション
6. 生成コード（ColorManager / ColorMode enum）
7. ビルド時の診断メッセージ
8. 関連
```

### 3.3 ファイル位置（章 2）

| Platform | パス |
|---|---|
| iOS (sjui) | `Layouts/Resources/colors.json` |
| Android (kjui) | `src/main/assets/Layouts/Resources/colors.json` + `res/values/colors.xml`（生成） + `res/values-night/colors.xml`（生成） |
| Web (rjui) | `Layouts/Resources/colors.json` + `src/generated/ColorManager.ts`（生成） |
| Docs site | `docs/screens/layouts/Resources/colors.json`（source of truth） |

### 3.4 スキーマ定義（章 3）

```jsonc
{
  // --- 予約 meta（optional） ---
  "modes": ["string", "..."],                                      // enum 順序
  "fallback_mode": "string",                                       // miss 時の fallback
  "systemModeMapping": { "light": "string", "dark": "string" },    // OS mapping

  // --- mode palettes ---
  "<modeName>": {
    "<colorKey>": "#RRGGBB" | "#RRGGBBAA" | "rgba(r,g,b,a)"
  }
}
```

- `<modeName>` = 予約 meta キー以外の任意の top-level object key
- `<colorKey>` = `snake_case` 推奨（`snake_to_camel` で accessor 名になる）
- 値: hex（3/4/6/8 桁）または rgba() 文字列

### 3.5 予約 meta キー（章 4）

[章 3.4 の meta 部分を表で展開、型・既定値・例]

### 3.6 生成コード（章 6）

Swift:
```swift
public enum ColorMode: String, CaseIterable { case light, dark }

public struct ColorManager {
  public static var currentMode: ColorMode = .light
  public static let followSystemMode = true

  public struct swiftui {
    public static var accent: Color { color(for: "accent", mode: currentMode) ?? .clear }
    public static func color(for key: String, mode: ColorMode = currentMode) -> Color? { … }

    public struct light { public static var accent: Color { … } }
    public struct dark  { public static var accent: Color { … } }
  }
}
```

Kotlin:
```kotlin
enum class ColorMode { LIGHT, DARK }

object ColorManager {
  var currentMode: ColorMode = ColorMode.LIGHT
  var followSystemMode: Boolean = true

  object compose {
    @Composable
    fun color(key: String): Color = resolve(key, LocalColorMode.current)
    val accent: Color @Composable get() = color("accent")
  }
}

val LocalColorMode = compositionLocalOf { ColorMode.LIGHT }
```

TypeScript:
```ts
export type ColorMode = "light" | "dark";
export const ColorModes = ["light", "dark"] as const;

export class ColorManager {
  static currentMode: ColorMode = "light";
  static followSystemMode = true;

  static color(key: string, mode: ColorMode = ColorManager.currentMode): string | undefined { … }

  static light = { get accent(): string { … } };
  static dark  = { get accent(): string { … } };
}
```

### 3.7 ビルド時の診断メッセージ（章 7）

| メッセージ | 条件 | 対処 |
|---|---|---|
| `INFO: colors.json migrated flat → themed` | 初回マイグレーション | 無視可、1 回きり |
| `INFO: key "<key>" only defined in mode "<m>", resolved via fallback` | 片 mode のみ定義 | 段階移行中なら OK、揃えたくなったら対応 mode に追記 |
| `WARNING: layout "<file>" has hardcoded "#HEX" for attr "<attr>"` | layout に hex 直書き | `jui build --extract-into=<mode>` で抽出 |
| `WARNING: unknown mode "<name>" referenced in systemModeMapping` | mapping 先の mode 未定義 | 該当 palette を追加するか mapping を修正 |

---

## 4. 各 `platforms/*/theming` への指示（plans 33 / 34 / 35 向けガイダンス）

各 platform plan のセッションで以下の節を注入する。本プランは**指示のみ**。

### 4.1 Swift（plan 33 付録）

セクション構成:
1. `ColorManager.swiftui.xxx` / `ColorManager.uikit.xxx` の違い
2. `@StateObject ColorManager.shared` での購読
3. `ColorModeObservable` + `@EnvironmentObject` パターン
4. `@Environment(\.colorScheme)` からの derive helper
5. UIKit の `UITraitCollection.userInterfaceStyle` 監視

コード例 ≥ 4 個（上の 4 パターンに 1 個ずつ）。

### 4.2 Kotlin（plan 34 付録）

セクション構成:
1. `ColorManager.views.xxx` / `ColorManager.compose.xxx` の違い
2. Views 層: `ColorManager.setMode()` → attach された View の再描画契機（`invalidate()` 等）
3. Compose 層: `LocalColorMode` CompositionLocal、`@Composable` 化されたアクセサ
4. `isSystemInDarkTheme()` 連動
5. `res/values-night/colors.xml` の自動生成とカスタム override の共存

コード例 ≥ 4 個。

### 4.3 React（plan 35 付録）

セクション構成:
1. `<ColorModeProvider>` の配置（RootLayout 直下推奨）
2. `useColorMode()` hook（`mode` / `setMode` / `followSystem`）
3. `useSystemColorMode()` — `prefers-color-scheme` media query
4. SSR / Static Export 時の挙動（初回レンダリングは `initialMode`、マウント後にシステム判定 → ちらつき防止のため `suppressHydrationWarning` 推奨）
5. 既存 CSS variable との併用（Tailwind の dark class との共存戦略）

コード例 ≥ 4 個。

---

## 5. 必要な strings キー

### 5.1 `/guides/theming`

`guides_theming_` prefix:

| key | 用途 |
|---|---|
| `guides_theming_title` | ページタイトル |
| `guides_theming_why_title` / `why_body` | 章 1 |
| `guides_theming_quickstart_title` / `quickstart_step1_title` / `step1_body` / ... `step3_body` | 章 2 |
| `guides_theming_schema_title` / `schema_body` | 章 3 |
| `guides_theming_arbitrary_modes_title` / `arbitrary_modes_body` | 章 4 |
| `guides_theming_switch_api_title` / `switch_api_body` | 章 5 |
| `guides_theming_system_title` / `system_body` | 章 6 |
| `guides_theming_fallback_title` / `fallback_body` | 章 7 |
| `guides_theming_extract_title` / `extract_body` | 章 8 |
| `guides_theming_layout_ref_title` / `layout_ref_body` | 章 9 |
| `guides_theming_pitfalls_title` / `pitfalls_body` | 章 10 |
| `guides_theming_related_title` | 章 11 |

合計 ~28 キー × en / ja。

### 5.2 `/reference/colors-json`

`reference_colors_json_` prefix:

| key | 用途 |
|---|---|
| `reference_colors_json_title` | ページタイトル |
| `reference_colors_json_overview` | 章 1 |
| `reference_colors_json_location_title` / `location_body` | 章 2 |
| `reference_colors_json_schema_title` / `schema_body` | 章 3 |
| `reference_colors_json_reserved_title` / `reserved_body` | 章 4 |
| `reference_colors_json_migration_title` / `migration_body` | 章 5 |
| `reference_colors_json_generated_title` / `generated_body` | 章 6 |
| `reference_colors_json_diagnostics_title` / `diagnostics_body` | 章 7 |

合計 ~16 キー × en / ja。

### 5.3 既存記事への追加キー

- `concepts_one_layout_json_theming_note` — 章 1 行追加分
- `guides_localization_sibling_theming` — クロスリンク行
- `reference_json_schema_colors_json_section_title` / `section_body` — plan 27 の補足

---

## 6. クロスリンク追加先

**新設ページから既存への out-link**:
- `/guides/theming` → `/guides/localization` / `/concepts/one-layout-json` / `/reference/colors-json` / `/platforms/{swift,kotlin,rjui}/theming`
- `/reference/colors-json` → `/guides/theming` / `/reference/json-schema` / `/reference/cli-commands`（`jui build --extract-into` 節）

**既存記事への in-link**:
- `/guides/localization` 冒頭の「姉妹記事」に `/guides/theming` リンク
- `/concepts/one-layout-json`「解決の 3 レイヤー（structure / strings / colors）」1 パラグラフに theming リンク
- `/reference/json-schema` の「関連ファイル」節に `/reference/colors-json` リンク
- `/reference/cli-commands` の `jui build` 節に `--extract-into` フラグ説明 + theming リンク
- `/tools/cli` overview に「テーマ切替」セクションから theming リンク
- Sidebar（chrome spec）の Guides セクションに `/guides/theming` を追加、Reference セクションに `/reference/colors-json` を追加

---

## 7. 実装チェックリスト

### `/guides/theming`
- [ ] spec 新設（`docs/screens/json/guides/theming.spec.json`）+ metadata description
- [ ] layout 新設（`docs/screens/layouts/guides/theming.json`）
- [ ] strings キー 28 本 × en / ja 追加
- [ ] CodeBlock ≥ 10 を layout に埋め込み
- [ ] 関連節のクロスリンク ≥ 5
- [ ] `jui build` 0 warnings
- [ ] `jui verify --fail-on-diff`
- [ ] `jsonui-localize`
- [ ] smoke test: 画面レンダリング確認

### `/reference/colors-json`
- [ ] spec 新設 + layout 新設
- [ ] strings キー 16 本 × en / ja
- [ ] CodeBlock ≥ 6
- [ ] `jui build` 0 warnings
- [ ] `jui verify --fail-on-diff`
- [ ] `jsonui-localize`
- [ ] Reference sidebar に項目追加（chrome spec 編集）

### 既存記事への注入
- [ ] `/guides/localization` 冒頭に sibling リンク
- [ ] `/concepts/one-layout-json` に theming パラグラフ
- [ ] `/reference/json-schema` に colors.json 節
- [ ] `/reference/cli-commands` の `jui build` 節に `--extract-into`
- [ ] Sidebar（chrome spec）に 2 URL 追加 + strings キー更新
- [ ] `jui build` 0 warnings / `jui verify` / `jsonui-localize`（全部まとめて最後に）

### plans 33 / 34 / 35 への引き継ぎ
- [ ] 各 platform plan の "次セッション" 節に「§4.x の theming 節を追加」旨の TODO を追記
  - 実装は各 platform plan のセッションで行う（本プランでは**指示のみ**）

---

## 8. セッション分割の推奨境界

- **セッション 1**（3〜4 時間）: `/guides/theming` 完成 + `/concepts/one-layout-json` パラグラフ追加 + sidebar 更新
- **セッション 2**（3〜5 時間）: `/reference/colors-json` 完成 + `/reference/json-schema` 節追加 + `/reference/cli-commands` 節追加 + `/guides/localization` sibling リンク

plans 33 / 34 / 35 の platform 本文は本プランの対象外（当該 plan のセッションで回収）。

---

## 9. 前提チェック（セッション開始時に確認）

着手前に以下を確認する:

1. `jsonui-cli/docs/bugs/reports/` に colors-multitheme の fix 完了報告書があるか
2. `jui sync_tool` が rjui_tools に themed ColorManager を配っているか（`rjui_tools/lib/core/resources/color_manager.rb` に mode 処理が入っているか）
3. `docs/screens/layouts/Resources/colors.json` が themed 形式に migrate 済か（もしまだなら `jui build` 1 回で自動昇格）
4. ReactJsonUI（consumer ランタイム）に `ColorModeProvider` / `useColorMode` が実装済か
5. [42a-dark-mode-palette.md](42a-dark-mode-palette.md) の palette が `docs/screens/layouts/Resources/colors.json` に landed 済か（初回 `jui build` 実施済）

未完了なら本プランは着手しない。先に upstream 完了を待つ。

---

## 10. 既存 content-expansion plans との関係

- plan 27（json-schema）: 本プランが colors.json 節を提供する（plan 27 は「参照先 `/reference/colors-json` に誘導」で済ませる）
- plans 33 / 34 / 35（platforms）: 本プランが **theming 節の仕様**を提供する。実装は当該 plan のセッション
- plan 30（localization）: 姉妹記事として相互リンク。資料構成が似ているので本プランは plan 30 の章立てを踏襲
- plan 25（CLI reference）: `jui build --extract-into` フラグが本プランで言及される
