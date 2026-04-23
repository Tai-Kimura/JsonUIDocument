# 24. コンテンツプラン: Reference — 共通 131 属性オーバーライド

> Scope: 6〜10 時間 / 2〜3 セッション。131 属性をカテゴリ 8 分割して記述する。
> 依存: plan 14, plan 20。`docs/data/attribute-categories.json` と `docs/data/attribute-order.json` も本プランで用意する。

---

## 1. 対象記事

`attribute_definitions.json` の `common` キー配下 131 属性を以下 8 カテゴリに分ける:

| URL | override file | 収録属性例 |
|---|---|---|
| `/reference/attributes/layout` | `docs/data/attribute-overrides/_common_layout.json` | width / height / weight / widthWeight / heightWeight / aspectRatio |
| `/reference/attributes/spacing` | `_common_spacing.json` | paddings / margins / topMargin / bottomMargin / leftMargin / rightMargin / insets |
| `/reference/attributes/text` | `_common_text.json` | fontSize / fontColor / fontWeight / fontFamily / lineHeight / textAlign / letterSpacing |
| `/reference/attributes/state` | `_common_state.json` | visibility / enabled / hidden / alpha / opacity / clickable / touchable |
| `/reference/attributes/binding` | `_common_binding.json` | @-binding syntax / two-way / event-binding / string-resolution |
| `/reference/attributes/event` | `_common_event.json` | onClick / onLongClick / onFocus / onBlur / onAppear / onDisappear / onChange |
| `/reference/attributes/responsive` | `_common_responsive.json` | platforms / breakpoints / responsive |
| `/reference/attributes/misc` | `_common_misc.json` | id / style / include / cornerRadius / border* / background / shadow / clipToBounds |

override JSON のスキーマはコンポーネント用とは異なる（カテゴリ別のため）:

```json
{
  "category": "layout",
  "description": { "en": "...", "ja": "..." },
  "attributes": {
    "width": {
      "summary": { "en": "...", "ja": "..." },
      "values": [
        { "value": "matchParent", "description": { "en": "...", "ja": "..." } },
        { "value": "wrapContent", "description": { "en": "...", "ja": "..." } },
        { "value": "<number>", "description": { "en": "...", "ja": "..." } }
      ],
      "examples": [ { "title": {...}, "language": "json", "code": "..." } ],
      "platformDiff": { "swift_uikit": "...", ... },
      "relatedAttributes": ["height", "weight"]
    }
  }
}
```

---

## 2. 各カテゴリの内容

### 2.1 `/reference/attributes/layout`

#### description
- en: "Layout attributes define the size and axis behavior of a component. They apply to every component regardless of type."
- ja: "レイアウト属性はコンポーネントのサイズと軸方向の挙動を決める。コンポーネント種別によらず全てに適用される。"

#### 主要属性（抜粋）

**`width` / `height`**
- summary(en): "Size along horizontal/vertical axis. Accepts number (pt/dp/px), `matchParent` (fill parent), `wrapContent` (fit content), or responsive object."
- summary(ja): "水平／垂直方向のサイズ。数値（pt/dp/px）、`matchParent`（親を満たす）、`wrapContent`（中身に合わせる）、またはレスポンシブオブジェクトを受け付ける。"
- values:
  - `matchParent`: "Fill parent along this axis. Requires parent to have a bounded size. — 親のこの軸を満たす。親が有界サイズである必要あり。"
  - `wrapContent`: "Shrink to fit content. Child-only sizing; can't shrink below children's natural size. — 内容に合わせて縮む。子より小さくはならない。"
  - `<number>`: "Fixed size in platform-native units (iOS pt / Android dp / Web px). — プラットフォームのネイティブ単位で固定サイズ。"
  - `{ xs: ..., md: ..., lg: ... }`: "Responsive per breakpoint. — ブレークポイント別に指定。"

- platformDiff:
  - `swift_uikit`: "`matchParent` → AutoLayout 制約 `.widthAnchor.constraint(equalTo: superview.widthAnchor)`。数値 → pt 単位の定数制約。"
  - `swift_swiftui`: "`matchParent` → `.frame(maxWidth: .infinity)`。数値 → `.frame(width: N)`。"
  - `kotlin_compose`: "`matchParent` → `Modifier.fillMaxWidth()`。数値 → `Modifier.width(N.dp)`。"
  - `kotlin_xml`: "`matchParent` → `android:layout_width=\"match_parent\"`。数値 → `Xdp`。"
  - `react`: "`matchParent` → Tailwind `w-full`。数値 → arbitrary value `w-[Npx]`。"

- examples:
  1. Fixed width:
     ```json
     { "type": "Button", "width": 120, "height": 44 }
     ```
  2. Match parent:
     ```json
     { "type": "Button", "width": "matchParent", "height": 44 }
     ```
  3. Responsive:
     ```json
     { "type": "Collection", "columnCount": { "xs": 1, "md": 2, "lg": 3 } }
     ```

- relatedAttributes: `["weight", "widthWeight", "heightWeight", "aspectRatio"]`

**`weight` / `widthWeight` / `heightWeight`**
- summary(en): "Flexible stretch factor along parent's main axis. In a horizontal View, a child with `weight: 1` fills remaining horizontal space."
- summary(ja): "親の主軸方向に伸縮する因数。水平 View 内で `weight: 1` を持つ子が水平方向の残りを埋める。"
- note: `weight` は直接子要素のみ効果がある（孫には及ばない）。
- platformDiff:
  - `swift_swiftui`: "`.frame(maxWidth: .infinity)` の layoutPriority 連携にマップ。"
  - `kotlin_compose`: "`Modifier.weight(N)`。"
  - `kotlin_xml`: "`android:layout_weight=\"N\"`。"
  - `react`: "CSS `flex: N`。"

**`aspectRatio`**
- summary(en): "Width-to-height ratio as a number (2.0 = 2:1) or string (`16:9`). Forces the component's bounds to maintain this ratio."
- summary(ja): "幅と高さの比率。数値（2.0 = 2:1）または文字列（`16:9`）。この比率でコンポーネントの境界を維持する。"

#### クロスリンク
- `/guides/responsive-layout`（未作成）に `width` の `xs/md/lg` 記述への導線

---

### 2.2 `/reference/attributes/spacing`

#### description
- en: "Spacing attributes control the empty space around and inside a component. Margins are outside the component; paddings are inside."
- ja: "スペーシング属性はコンポーネントの周囲と内側の余白を制御する。margin は外側、padding は内側。"

#### 主要属性

**`paddings` / `padding*`**
- summary(en): "Inner space between component bounds and its content. `paddings: [top, right, bottom, left]` sets all four; individual `paddingTop` etc. override the array value for that side."
- summary(ja): "コンポーネント境界と中身の間の内側余白。`paddings: [top, right, bottom, left]` で 4 辺指定、個別の `paddingTop` 等は配列値を上書き。"
- values:
  - `[top, right, bottom, left]`: "4-element array of numbers. — 4 要素の数値配列。"
  - `<number>`: "Single value applied to all four sides. — 全辺に同じ値を適用。"
  - `[vertical, horizontal]`: "2-element array: `[tb, lr]`. — 2 要素 `[tb, lr]`。"

- examples:
  ```json
  { "type": "View", "paddings": [16, 24, 16, 24] }
  { "type": "View", "padding": 16 }
  { "type": "View", "paddings": [8, 16] }
  ```

**`margins` / `margin*`**
- summary(en): "Outer space between component bounds and siblings/parent. Same syntax as `paddings`."
- summary(ja): "コンポーネント境界と兄弟要素／親の間の外側余白。`paddings` と同じ構文。"
- note: iOS SafeAreaView 内の topMargin は safeAreaInset に加算される。

**`insets`**
- summary(en): "Shorthand for both paddings and margins (rarely used). Deprecated — prefer explicit `paddings` and `margins`."
- summary(ja): "paddings と margins の両方を指定するショートハンド（稀に使用）。非推奨、明示的な `paddings` / `margins` を推奨。"

---

### 2.3 `/reference/attributes/text`

#### description
- en: "Text attributes apply to any component that renders text (Label, Button, TextField, TextView, EditText, Input, IconLabel)."
- ja: "テキスト属性はテキストを描画する任意のコンポーネント（Label, Button, TextField, TextView, EditText, Input, IconLabel）に適用される。"

#### 主要属性

**`fontSize`**
- summary(en): "Font size in platform-native units (iOS pt / Android sp / Web px). Integer or float."
- summary(ja): "フォントサイズ（iOS pt / Android sp / Web px）。整数または小数。"
- note: Android では `sp` 単位（ユーザーの画面文字サイズ設定に応じてスケーリング）。
- platformDiff:
  - `swift_uikit`: "UIFont.systemFont(ofSize: N)。"
  - `swift_swiftui`: "`.font(.system(size: N))`。"
  - `kotlin_compose`: "`TextStyle(fontSize = N.sp)`。"
  - `kotlin_xml`: "`android:textSize=\"Nsp\"`。"
  - `react`: "Tailwind の arbitrary value `text-[Npx]` または `text-{size}` tier。"

**`fontColor`**
- summary(en): "Text color. Accepts hex `#RGB`/`#RRGGBB`/`#RRGGBBAA`, named colors, or `@color/token`."
- summary(ja): "テキスト色。hex `#RGB`/`#RRGGBB`/`#RRGGBBAA`、色名、`@color/token` を受け付ける。"

**`fontWeight`**
- summary(en): "Font weight. String (`normal`, `bold`, `semibold`, `medium`, `light`, `ultralight`, `heavy`) or numeric 100-900."
- summary(ja): "フォントウェイト。文字列 (`normal`, `bold`, `semibold`, `medium`, `light`, `ultralight`, `heavy`) または 100〜900 の数値。"

**`fontFamily`**
- summary(en): "Font family name. Platform-registered fonts only; custom fonts must be registered in `fonts/` per platform."
- summary(ja): "フォントファミリ名。プラットフォームに登録済みのフォントのみ。カスタムフォントはプラットフォーム毎に `fonts/` で登録が必要。"

**`lineHeight`**
- summary(en): "Line height in pt/dp/px. For text blocks spanning multiple lines."
- summary(ja): "行の高さ（pt/dp/px）。複数行テキストで使用。"
- platformDiff: plan 20 §2.1 参照。

**`textAlign`**
- summary(en): "`left` / `center` / `right` / `justify`."
- summary(ja): "`left` / `center` / `right` / `justify`。"
- note: `justify` は iOS UIKit で `NSAttributedString` パスが必要、SwiftUI は silent に `leading` に fallback。

**`letterSpacing`**
- summary(en): "Character spacing (tracking) in pt/dp/px. Positive values add space, negative values squeeze."
- summary(ja): "文字間隔（pt/dp/px）。正値で間隔を広げ、負値で詰める。"

---

### 2.4 `/reference/attributes/state`

#### description
- en: "State attributes control visibility, interaction, and opacity. Most are Boolean or tri-state."
- ja: "状態属性は可視性、インタラクション、不透明度を制御する。ほとんどが Boolean または三値。"

#### 主要属性

**`visibility`**
- summary(en): "`visible` / `invisible` / `gone`. `invisible` reserves space; `gone` removes from layout entirely."
- summary(ja): "`visible` / `invisible` / `gone`。`invisible` はスペースを確保したまま非表示、`gone` はレイアウトから完全に除外。"
- values:
  - `visible`: "Default. Renders normally."
  - `invisible`: "Not rendered but occupies space (as if invisible placeholder)."
  - `gone`: "Not rendered and does not occupy space. Siblings shift to fill."

**`enabled`**
- summary(en): "Boolean. When `false`, component ignores user interaction and applies `.disabled` styling."
- summary(ja): "Boolean。`false` でユーザー操作を無視し、`.disabled` スタイルを適用。"

**`alpha` / `opacity`**
- summary(en): "0.0-1.0. Translucency of the component. `alpha: 0` is visually hidden but still receives touches — use `visibility` to disable entirely."
- summary(ja): "0.0〜1.0。コンポーネントの不透明度。`alpha: 0` は視覚的には見えないが touch を受け付ける。完全に無効化するには `visibility` を使う。"

**`clickable` / `touchable`**
- summary(en): "Boolean. When `false`, even `onClick` handlers are not invoked. Use to disable interaction without visual change."
- summary(ja): "Boolean。`false` で `onClick` ハンドラすら呼ばれない。見た目を変えず操作のみ無効化したいときに使う。"

**`hidden`**
- summary(en): "Shorthand for `visibility: 'gone'`. Deprecated — prefer explicit `visibility`."
- summary(ja): "`visibility: 'gone'` のショートハンド。非推奨、明示的な `visibility` を推奨。"

---

### 2.5 `/reference/attributes/binding`

#### description
- en: "Binding attributes link JSON values to ViewModel state via the `@{...}` syntax. There are three kinds: value binding, string resolution, and event binding."
- ja: "Binding 属性は `@{...}` 構文で JSON 値と ViewModel の状態を繋ぐ。値 binding、文字列解決、イベント binding の 3 種類がある。"

#### 主要構文

**`@{expression}` — value binding**
- summary(en): "Resolves at render time against the ViewModel. Read-only by default; becomes two-way on editable components (TextField, Switch, SelectBox etc.)."
- summary(ja): "レンダリング時に ViewModel に対して解決される。デフォルトは read-only、編集可能コンポーネント（TextField、Switch、SelectBox など）では two-way。"
- examples:
  ```json
  { "type": "Label", "text": "@{userName}" }
  { "type": "Label", "text": "Hello, @{userName}!" }
  { "type": "Label", "text": "@{isVip ? 'VIP' : 'Guest'}" }
  ```

**`@string/key` — string resolution**
- summary(en): "Resolves at render time from `strings.json` for the current locale. Required for any user-facing text that needs localization."
- summary(ja): "`strings.json` の現ロケールから解決される。ユーザー向けの多言語化必須テキストに使用。"
- examples:
  ```json
  { "type": "Label", "text": "@string/welcome_title" }
  { "type": "Button", "text": "@string/action_save" }
  ```

**`@event(handler)` — event binding (attribute-form)**
- summary(en): "Alternative to `onClick: '@{handler}'`. Less common but allows parameterized events: `@event(onSelect, itemId)`."
- summary(ja): "`onClick: '@{handler}'` の別形式。パラメータ付きイベントに便利: `@event(onSelect, itemId)`。"

**Binding direction**
- One-way (read-only): Label, Image, background, fontColor etc.
- Two-way: TextField.text, Switch.value, SelectBox.value, Radio.selected, CheckBox.checked, Slider.value
- Event-only: `onClick`, `onChange`, `onSubmit` etc. — bind to ViewModel methods.

**Expression syntax**
- Access: `@{user.name}`, `@{items[0].title}`
- Boolean: `@{isEnabled && !isLoading}`
- Ternary: `@{count > 0 ? 'has items' : 'empty'}`
- Coalesce: `@{displayName ?? 'Unknown'}`
- Methods: `@{items.count}`, `@{query.length}`

#### relatedAttributes
`["onClick", "onChange", "visibility", "enabled"]`

---

### 2.6 `/reference/attributes/event`

#### description
- en: "Event attributes bind user interactions to ViewModel methods. All are optional; their omission disables the corresponding interaction."
- ja: "イベント属性はユーザー操作を ViewModel のメソッドにバインドする。全て任意、省略すれば該当操作は無効。"

#### 主要属性

**`onClick`**
- summary(en): "Tap / click. Fires on single tap, after any gesture recognition delay (roughly 0-50 ms)."
- summary(ja): "タップ／クリック。ジェスチャ認識後（約 0〜50ms）、シングルタップで発火。"
- Required on Button to be interactive.

**`onLongClick`**
- summary(en): "Long press. Default threshold ~500ms."
- summary(ja): "長押し。既定閾値約 500ms。"

**`onFocus` / `onBlur`**
- summary(en): "Focus events on input components. `onFocus` before first keystroke; `onBlur` after focus moves elsewhere."
- summary(ja): "入力コンポーネントのフォーカスイベント。`onFocus` は最初のキー入力前、`onBlur` はフォーカス離脱後。"

**`onAppear` / `onDisappear`**
- summary(en): "Lifecycle events. `onAppear` on mount/re-mount; `onDisappear` on unmount. Useful for analytics and lazy data fetch."
- summary(ja): "ライフサイクルイベント。`onAppear` はマウント／再マウント時、`onDisappear` はアンマウント時。アナリティクスや遅延データ取得に有用。"

**`onChange`**
- summary(en): "Value change. Fires after the user commits a change (not while typing). Receives the new value as a single parameter."
- summary(ja): "値変更。ユーザーが変更を確定した後（タイプ中は発火しない）。新しい値を 1 引数で受け取る。"

**`onSubmit` / `onReturn`**
- summary(en): "Return key press on TextField. Fires only when `returnKeyType` is set."
- summary(ja): "TextField のリターンキー押下。`returnKeyType` 指定時のみ発火。"

#### Event handler signatures（3 言語）

**Swift**
```swift
// Simple
func onSave() { ... }

// With parameter
func onItemSelected(id: String) { ... }

// Async
func onSubmit() async throws { ... }
```

**Kotlin**
```kotlin
// Simple
fun onSave() { ... }

// With parameter
fun onItemSelected(id: String) { ... }

// Coroutine
fun onSubmit() {
  viewModelScope.launch { ... }
}
```

**TypeScript**
```typescript
onSave(): void { ... }
onItemSelected(id: string): void { ... }
async onSubmit(): Promise<void> { ... }
```

---

### 2.7 `/reference/attributes/responsive`

#### description
- en: "Responsive attributes adjust values based on screen size (breakpoints) or host platform."
- ja: "レスポンシブ属性は画面サイズ（ブレークポイント）またはホストプラットフォームに応じて値を変える。"

#### 主要属性

**`platforms`**
- summary(en): "Array of platforms this component should render on: `ios` / `android` / `web`. If the current platform is not in the list, the component is omitted."
- summary(ja): "このコンポーネントを描画すべきプラットフォーム配列: `ios` / `android` / `web`。現プラットフォームが含まれなければコンポーネントは省略される。"
- examples:
  ```json
  { "include": "common/sidebar", "platforms": ["web"] }
  { "type": "Image", "source": "ios_screenshot", "platforms": ["ios"] }
  ```

**Responsive value syntax**
- summary(en): "Most size/layout attributes (width, height, columnCount, fontSize, paddings) accept an object `{ xs, sm, md, lg, xl }` mapping breakpoint → value."
- summary(ja): "大半のサイズ・レイアウト属性（width, height, columnCount, fontSize, paddings）が `{ xs, sm, md, lg, xl }` オブジェクトを受け付け、ブレークポイント → 値の対応になる。"
- Breakpoints (configurable in `jsonui-doc-web/tailwind.config.js`):
  - `xs`: 0-479px
  - `sm`: 480-767px
  - `md`: 768-1023px
  - `lg`: 1024-1279px
  - `xl`: 1280px+
- examples:
  ```json
  {
    "type": "Collection",
    "columnCount": { "xs": 1, "md": 2, "lg": 3, "xl": 4 }
  }
  ```

---

### 2.8 `/reference/attributes/misc`

その他 30 ほどの共通属性を短く記述。抜粋:

- **`id`**: コンポーネントの一意識別子。ViewModel から参照する場合と UI テスト selector として必須。
- **`style`**: プリセットスタイル名。`docs/screens/styles/*.json` で定義。複数 style の配列指定可。
- **`include`**: 別 layout ファイルをインライン展開。`"include": "common/header"` 相当。
- **`cornerRadius`**: 角丸半径。数値または `[tl, tr, br, bl]`。
- **`borderWidth` / `borderColor` / `borderStyle`**: ボーダー。`borderStyle` は `solid` / `dashed` / `dotted`。
- **`background`**: 背景色または `@color/token`。グラデーションは GradientView。
- **`shadow`**: `{ color, offsetX, offsetY, radius, opacity }` オブジェクト。
- **`clipToBounds`**: Boolean。子要素の overflow を自身の bounds で切り取る。
- **`zIndex`**: 重なり順。大きい値が手前。

---

## 3. 必要な strings キー

`attr_section_*` prefix で以下を 2 言語:

- `attr_section_summary` / `attr_section_values` / `attr_section_examples` / `attr_section_platform_diff` / `attr_section_related`

---

## 4. `docs/data/attribute-categories.json` の整備

各属性がどのカテゴリに属するかの対応表を用意する。スキーマ:

```json
{
  "width": "layout",
  "height": "layout",
  "weight": "layout",
  "paddings": "spacing",
  "fontSize": "text",
  "fontColor": "text",
  "visibility": "state",
  "onClick": "event",
  "platforms": "responsive",
  "id": "misc"
  // ... 131 個全て
}
```

plan 14 の生成スクリプトはこのファイルを読んで `/reference/attributes/{category}` ページに各属性を振り分ける。

---

## 5. `docs/data/attribute-order.json`

各コンポーネントページ（plan 20/21/22/23 で定義）で属性を表示する順序:

```json
{
  "defaultOrder": [
    "text", "value", "checked", "selected",
    "fontSize", "fontColor", "fontWeight",
    "source", "url", "icon",
    "width", "height", "weight",
    "paddings", "margins",
    "background", "cornerRadius", "border*", "shadow",
    "visibility", "enabled", "alpha",
    "onClick", "onLongClick", "onChange", "onFocus", "onBlur",
    "id", "style", "platforms"
  ],
  "overrides": {
    "Label": ["text", "fontSize", "fontColor", ...],
    "Button": ["text", "onClick", "enabled", ...]
  }
}
```

---

## 6. クロスリンク追加先

- `/learn/data-binding-basics` → `/reference/attributes/binding`
- `/learn/first-screen` → `/reference/attributes/layout`, `/reference/attributes/spacing`
- `/guides/writing-your-first-spec` → `/reference/attributes/event`
- `/concepts/data-binding` → `/reference/attributes/binding`
- 各コンポーネントページ (plan 20-23) → `/reference/attributes/<カテゴリ>`

---

## 7. 実装チェックリスト

- [ ] `docs/data/attribute-categories.json`（131 属性 → カテゴリ対応表）
- [ ] `docs/data/attribute-order.json`
- [ ] `docs/data/attribute-overrides/_common_layout.json`
- [ ] `docs/data/attribute-overrides/_common_spacing.json`
- [ ] `docs/data/attribute-overrides/_common_text.json`
- [ ] `docs/data/attribute-overrides/_common_state.json`
- [ ] `docs/data/attribute-overrides/_common_binding.json`
- [ ] `docs/data/attribute-overrides/_common_event.json`
- [ ] `docs/data/attribute-overrides/_common_responsive.json`
- [ ] `docs/data/attribute-overrides/_common_misc.json`
- [ ] plan 14 のスクリプトに `/reference/attributes/{category}` 生成分岐を追加
- [ ] `jui g project` 実行
- [ ] クロスリンク追加（6 箇所）
- [ ] `jui build` / `jui verify` / `jsonui-localize`

---

## 8. セッション分割の推奨境界

- **分割 A**: layout / spacing / state（基本レイアウト 3 カテゴリ、3 時間）
- **分割 B**: text / binding / event（ロジック寄り 3 カテゴリ、3 時間）
- **分割 C**: responsive / misc + categories.json / order.json 整備（3 時間）
