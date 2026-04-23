# 20. コンテンツプラン: Reference — テキスト・入力系コンポーネント

> Scope: 4〜6 時間 / 1〜2 セッション。7 コンポーネント × 平均 3〜4 サンプル + 属性注記。
> 依存: plan 14（属性リファレンス生成パイプラインが稼働していること。未稼働の場合は本プランの成果物を `docs/data/attribute-overrides/*.json` に置く先に plan 14 §5 のスクリプト実装が必要）。

本プランでは `docs/data/attribute-overrides/` 配下に**手書きオーバーライド JSON** を作成する。UI 構造（Collection レイアウト、cell の並べ方）には触れない。spec は plan 14 のスクリプトが自動生成する。

---

## 1. 対象記事

| URL | オーバーライド JSON | 対象コンポーネント |
|---|---|---|
| `/reference/components/label` | `docs/data/attribute-overrides/label.json` | Label |
| `/reference/components/icon-label` | `docs/data/attribute-overrides/iconlabel.json` | IconLabel |
| `/reference/components/text-field` | `docs/data/attribute-overrides/textfield.json` | TextField |
| `/reference/components/text-view` | `docs/data/attribute-overrides/textview.json` | TextView |
| `/reference/components/edit-text` | `docs/data/attribute-overrides/edittext.json` | EditText |
| `/reference/components/input` | `docs/data/attribute-overrides/input.json` | Input |
| `/reference/components/button` | `docs/data/attribute-overrides/button.json` | Button |

各ファイルのスキーマは plan 14 §4 に従う:

```json
{
  "component": "<Name>",
  "description": { "en": "...", "ja": "..." },
  "usage": { "en": "...", "ja": "..." },
  "examples": [ { "title": {...}, "language": "...", "code": "...", "note": {...}? } ],
  "attributes": { "<attrName>": { "note": {...}?, "platformDiff": {...}? } },
  "relatedComponents": ["..."]
}
```

---

## 2. 各記事の内容

### 2.1 Label

#### description
- en: "Display component for rendering a single-line or multi-line text string. Label is read-only by default; use TextField or EditText for user input."
- ja: "単一行または複数行のテキストを描画する表示専用コンポーネント。ユーザー入力には TextField / EditText を使う。"

#### usage
- en: "Use Label for all static or bound text: headings, body prose, form labels, list item titles, button labels embedded in composite cells. Label does **not** handle taps — wrap it in a Button if the text should be interactive."
- ja: "見出し・本文・フォームラベル・リストアイテム・ボタン内ラベルなど、あらゆる静的／バインド済みテキストに使う。タップ処理はしないため、押下動作が必要なら Button で包む。"

#### examples（最低 5 個）

1. **Minimum** (json)
```json
{
  "type": "Label",
  "text": "Hello, JsonUI",
  "fontSize": 16,
  "fontColor": "#111827"
}
```

2. **With binding** (json) — note: `greeting` must exist on the ViewModel as `String`
```json
{
  "type": "Label",
  "text": "@{greeting}",
  "fontSize": 18,
  "fontWeight": "bold"
}
```

3. **Multi-line with lineHeight** (json)
```json
{
  "type": "Label",
  "text": "@{paragraph}",
  "fontSize": 14,
  "lineHeight": 22,
  "lines": 0,
  "width": "matchParent"
}
```

4. **Localized via @string** (json)
```json
{
  "type": "Label",
  "text": "@string/welcome_title",
  "style": "heading_1"
}
```

5. **Ellipsis** (json) — single line, truncated with `…` suffix
```json
{
  "type": "Label",
  "text": "@{productName}",
  "lines": 1,
  "ellipsize": "end",
  "width": 200
}
```

#### attributes（属性別の注記）

- `text`:
  - note(en): "Accepts literal string, `@{binding}`, `@string/key`, or mixed `"Total: @{count}"`. Unresolved bindings render as empty string in release, `[unresolved:key]` in debug."
  - note(ja): "リテラル文字列、`@{binding}`、`@string/key`、または `\"合計: @{count}\"` のような混在を受け付ける。解決できない binding はリリースでは空文字、デバッグでは `[unresolved:key]` として表示される。"

- `fontColor`:
  - note(en): "Accepts hex `#RGB` / `#RRGGBB` / `#RRGGBBAA`, named colors (`red`, `blue`), or design tokens `@color/primary`. Alpha in `#RRGGBBAA` is supported on all platforms."
  - note(ja): "`#RGB` / `#RRGGBB` / `#RRGGBBAA`、色名、デザイントークン `@color/primary` を受け付ける。アルファ付き `#RRGGBBAA` は全プラットフォームでサポート。"

- `fontWeight`:
  - note(en): "String values `normal` / `bold` / `semibold` / `medium` / `light` / `ultralight` / `heavy`, or numeric 100〜900. Numeric values map to platform-specific closest fonts."
  - note(ja): "文字列 `normal` / `bold` / `semibold` / `medium` / `light` / `ultralight` / `heavy`、または 100〜900 の数値。数値指定はプラットフォーム別に最も近いフォントにマップされる。"

- `lineHeight`:
  - platformDiff:
    - `swift_uikit`: "NSAttributedString の paragraphStyle.minimumLineHeight にマップ。"
    - `swift_swiftui`: "`.lineSpacing(lineHeight - fontSize)` modifier に変換。"
    - `kotlin_compose`: "LineHeightStyle.Alignment.Center + TextStyle.lineHeight として適用。"
    - `kotlin_xml`: "TextView の lineSpacingExtra（lineHeight - fontSize）。"
    - `react`: "Tailwind の `leading-[Npx]` arbitrary value に変換。"

- `lines`:
  - note(en): "`0` = unlimited (default wrap), positive integer = max lines. When truncation occurs, the `ellipsize` attribute decides which end is clipped."
  - note(ja): "`0` = 無制限（デフォルトで折り返し）、正の整数 = 最大行数。切り詰めが発生したときに `ellipsize` で末端を決定する。"

- `ellipsize`:
  - note(en): "`start` / `middle` / `end` / `none`. Platform fallback: `middle` on Android XML has no native support and falls back to `end` with a warning."
  - note(ja): "`start` / `middle` / `end` / `none`。Android XML では `middle` がネイティブ未サポートのため `end` に警告付きでフォールバック。"

- `textAlign`:
  - note(en): "`left` / `center` / `right` / `justify`. `justify` on iOS UIKit requires `NSAttributedString` path; SwiftUI silently falls back to `leading`."
  - note(ja): "`left` / `center` / `right` / `justify`。iOS UIKit の `justify` は `NSAttributedString` パスを通り、SwiftUI では silent に `leading` にフォールバックする。"

#### relatedComponents
`["TextView", "IconLabel", "Button"]`

---

### 2.2 IconLabel

#### description
- en: "Label with a leading or trailing icon glyph, typically used for button labels with icons, menu items, and status indicators."
- ja: "先頭または末尾にアイコングリフを持つラベル。アイコン付きボタン、メニュー項目、ステータス表示などに使う。"

#### usage
- en: "Prefer IconLabel over manually composing a View with Image + Label when the icon is a font glyph (SF Symbols, Material Icons). For raster images, use a horizontal View + Image + Label."
- ja: "フォントグリフ（SF Symbols / Material Icons）をアイコンに使う場合は View + Image + Label の手組みよりも IconLabel を優先。ラスター画像の場合は水平 View + Image + Label で組む。"

#### examples（最低 3 個）

1. **With SF Symbol (iOS)** (json)
```json
{
  "type": "IconLabel",
  "iconName": "star.fill",
  "iconPosition": "leading",
  "text": "Favorite",
  "fontSize": 14,
  "fontColor": "#F59E0B"
}
```

2. **With Material Icon (Android)** (json)
```json
{
  "type": "IconLabel",
  "iconName": "favorite",
  "iconPosition": "leading",
  "text": "@string/favorite",
  "fontSize": 14
}
```

3. **Trailing chevron** (json)
```json
{
  "type": "IconLabel",
  "text": "@{sectionTitle}",
  "iconName": "chevron.right",
  "iconPosition": "trailing",
  "iconSize": 12,
  "fontSize": 16
}
```

#### attributes

- `iconName`:
  - platformDiff:
    - `swift_uikit`: "SF Symbol 名。未定義シンボル指定時は警告後に空画像表示。"
    - `swift_swiftui`: "同上（`Image(systemName:)`）。"
    - `kotlin_compose`: "Material Icons 名（`Icons.Filled.<Name>`）。カスタムアイコンは `R.drawable.<name>` にフォールバック。"
    - `kotlin_xml`: "`R.drawable.<name>` に直接解決。"
    - `react`: "`lucide-react` アイコン名（kebab-case）。他アイコンライブラリは converter の追加対応が必要。"
  - note(en): "Platform-specific icon set. Use `/guides/icon-name-mapping` for cross-platform naming."
  - note(ja): "プラットフォーム別アイコンセット。クロスプラットフォーム命名規則は `/guides/icon-name-mapping` を参照。"

- `iconPosition`:
  - note(en): "`leading` / `trailing`. RTL languages flip automatically on iOS and Android; React uses `dir` attribute."
  - note(ja): "`leading` / `trailing`。RTL 言語では iOS と Android が自動で反転、React は `dir` 属性で制御。"

- `iconSize`:
  - note(en): "Point/dp size. Defaults to `fontSize` × 1.2."
  - note(ja): "pt / dp 単位。省略時は `fontSize` × 1.2 が使われる。"

- `iconColor`:
  - note(en): "Separate from `fontColor`. If omitted, inherits `fontColor`."
  - note(ja): "`fontColor` とは別に指定可能。省略時は `fontColor` を継承。"

#### relatedComponents
`["Label", "Button", "Image"]`

---

### 2.3 TextField

#### description
- en: "Single-line text input for short user-entered strings. For multi-line input use TextView or EditText. For enforced formats (email, phone, numeric) pair with `inputType`."
- ja: "短い文字列を受け取る単一行の入力フィールド。複数行は TextView / EditText を使う。メール・電話・数値などフォーマット制約は `inputType` で指定。"

#### usage
- en: "TextField owns its text state via two-way binding. The ViewModel declares the property as mutable (`var text: String`) and TextField writes back on every keystroke."
- ja: "TextField は two-way binding で自身の text 状態を保持する。ViewModel 側で mutable プロパティ（`var text: String`）を宣言すると、キー入力ごとに書き戻される。"

#### examples（最低 5 個）

1. **Minimum two-way binding** (json)
```json
{
  "type": "TextField",
  "text": "@{email}",
  "hint": "@string/email_placeholder",
  "inputType": "email",
  "width": "matchParent"
}
```

2. **With validation error display** (json) — companion Label below shows `@{emailError}`
```json
{
  "type": "View",
  "orientation": "vertical",
  "child": [
    {
      "type": "TextField",
      "text": "@{email}",
      "hint": "@string/email_placeholder",
      "inputType": "email"
    },
    {
      "type": "Label",
      "text": "@{emailError}",
      "visibility": "@{emailError != nil && emailError != ''}",
      "fontColor": "#EF4444",
      "fontSize": 12
    }
  ]
}
```

3. **Password field** (json)
```json
{
  "type": "TextField",
  "text": "@{password}",
  "inputType": "password",
  "hint": "@string/password_placeholder"
}
```

4. **Numeric with max length** (json)
```json
{
  "type": "TextField",
  "text": "@{age}",
  "inputType": "number",
  "maxLength": 3,
  "hint": "18"
}
```

5. **On-submit action** (json) — ViewModel has `@event(onSubmitSearch)`
```json
{
  "type": "TextField",
  "text": "@{query}",
  "hint": "@string/search_placeholder",
  "returnKeyType": "search",
  "onReturn": "@{onSubmitSearch}"
}
```

#### ViewModel sample（Swift/Kotlin/TS の 3 言語を必ず併記）

**Swift (SwiftJsonUI)**:
```swift
class LoginViewModel: ObservableObject {
  @Published var email: String = ""
  @Published var emailError: String = ""

  func validate() {
    emailError = email.contains("@") ? "" : "Invalid email"
  }
}
```

**Kotlin (KotlinJsonUI)**:
```kotlin
class LoginViewModel : ViewModel() {
  private val _email = MutableStateFlow("")
  val email: StateFlow<String> = _email.asStateFlow()

  private val _emailError = MutableStateFlow("")
  val emailError: StateFlow<String> = _emailError.asStateFlow()

  fun onEmailChanged(new: String) {
    _email.value = new
    _emailError.value = if ("@" in new) "" else "Invalid email"
  }
}
```

**TypeScript (ReactJsonUI)**:
```typescript
export class LoginViewModel extends ViewModel {
  email = "";
  emailError = "";

  setEmail(next: string) {
    this.email = next;
    this.emailError = next.includes("@") ? "" : "Invalid email";
    this.notify();
  }
}
```

#### attributes

- `text`:
  - note(en): "Always two-way. Must bind to a mutable ViewModel property."
  - note(ja): "常に two-way。ViewModel の mutable プロパティにバインドする必要がある。"

- `inputType`:
  - note(en): "`text` / `email` / `number` / `decimal` / `password` / `phone` / `url`. Triggers keyboard type on mobile and `<input type=\"...\">` on web."
  - note(ja): "`text` / `email` / `number` / `decimal` / `password` / `phone` / `url`。モバイルではキーボード種別、Web では `<input type>` にマップされる。"

- `maxLength`:
  - note(en): "Positive integer; enforces at platform level. Paste beyond limit is truncated silently."
  - note(ja): "正の整数。プラットフォーム側で制限される。ペースト時も silent に切り詰められる。"

- `hint`:
  - note(en): "Placeholder shown when the field is empty. Accepts `@string/key`."
  - note(ja): "空欄時に表示するプレースホルダ。`@string/key` 指定可。"

- `returnKeyType`:
  - note(en): "`default` / `go` / `done` / `next` / `send` / `search`. Web maps to `enterkeyhint`."
  - note(ja): "`default` / `go` / `done` / `next` / `send` / `search`。Web では `enterkeyhint` にマップ。"

- `onReturn`:
  - note(en): "Called when user presses the return/enter key. On web, also fires on form submit."
  - note(ja): "リターン／エンターキー押下時に発火。Web ではフォーム送信時にも発火する。"

- `onFocus` / `onBlur`:
  - note(en): "Focus events. `onFocus` fires before input starts; `onBlur` fires after focus leaves."
  - note(ja): "フォーカスイベント。`onFocus` は入力開始前、`onBlur` はフォーカス離脱後に発火。"

#### relatedComponents
`["TextView", "EditText", "Input", "Label"]`

---

### 2.4 TextView

#### description
- en: "Multi-line text input for long-form user-entered strings (comments, descriptions, messages). Grows vertically with content unless constrained by `height`."
- ja: "複数行の長文入力（コメント、説明、メッセージ）用。`height` で制約されない限り、内容に応じて縦に伸びる。"

#### usage
- en: "Use TextView when expected input exceeds one line. For messaging UI, pair with a fixed-height container and Scroll."
- ja: "入力が複数行に及ぶことが想定される場合は TextView を使う。メッセージ UI では固定高さのコンテナと Scroll と組み合わせる。"

#### examples（最低 3 個）

1. **Minimum** (json)
```json
{
  "type": "TextView",
  "text": "@{description}",
  "hint": "@string/description_placeholder",
  "minLines": 3,
  "maxLines": 8,
  "width": "matchParent"
}
```

2. **Character counter** (json)
```json
{
  "type": "View",
  "orientation": "vertical",
  "child": [
    { "type": "TextView", "text": "@{bio}", "maxLength": 160, "minLines": 3 },
    { "type": "Label", "text": "@{bio.length}/160", "fontSize": 12, "fontColor": "#9CA3AF" }
  ]
}
```

3. **Auto-resize disabled** (json) — fixed height with scroll inside
```json
{
  "type": "TextView",
  "text": "@{longText}",
  "width": "matchParent",
  "height": 200,
  "autoResize": false
}
```

#### attributes

- `minLines` / `maxLines`:
  - note(en): "`minLines` fixes minimum vertical size. `maxLines` caps expansion; further input scrolls internally."
  - note(ja): "`minLines` で最小高さ固定。`maxLines` 到達後は内部スクロールに切り替わる。"

- `autoResize`:
  - note(en): "Default `true`. When `false`, the component respects the specified `height` and scrolls internally."
  - note(ja): "デフォルト `true`。`false` にすると指定した `height` を守り、内部でスクロールする。"

- `returnKeyBehavior`:
  - platformDiff:
    - `swift_uikit`: "`.newline` でも `.dismiss` でもデフォルトは newline。"
    - `swift_swiftui`: "iOS 16+ は `.submitLabel` で制御可。"
    - `kotlin_compose`: "`ImeAction` で表現、newline は `ImeAction.None`。"
    - `kotlin_xml`: "XML では `android:imeOptions` を調整。"
    - `react`: "`<textarea>` は常に newline。submit には別途ボタンが必要。"

#### relatedComponents
`["TextField", "EditText", "Input"]`

---

### 2.5 EditText

#### description
- en: "Android-native naming alias for TextField / TextView with attributes matching Android EditText conventions (singleLine, imeOptions, inputType)."
- ja: "Android ネイティブ命名のエイリアス。TextField / TextView と同等だが、Android EditText 由来の属性（singleLine, imeOptions, inputType）が使える。"

#### usage
- en: "When migrating existing Android XML layouts to JsonUI, EditText keeps attribute names consistent. For new cross-platform code, prefer TextField (single-line) or TextView (multi-line)."
- ja: "既存 Android XML を JsonUI に移行する際、属性名の互換を保つために使う。新規クロスプラットフォーム実装では TextField / TextView が推奨。"

#### examples（最低 2 個）

1. **Single-line EditText** (json)
```json
{
  "type": "EditText",
  "text": "@{name}",
  "hint": "@string/name_placeholder",
  "singleLine": true,
  "inputType": "text",
  "imeOptions": "actionNext"
}
```

2. **Migration from Android XML** (xml → json)
```xml
<EditText
  android:id="@+id/phone"
  android:hint="@string/phone_hint"
  android:inputType="phone"
  android:maxLength="11"/>
```
→
```json
{
  "type": "EditText",
  "id": "phone",
  "text": "@{phone}",
  "hint": "@string/phone_hint",
  "inputType": "phone",
  "maxLength": 11
}
```

#### attributes

- `singleLine`:
  - note(en): "`true` collapses Enter key presses into submit. Equivalent to TextField."
  - note(ja): "`true` で Enter キーを submit に変換。TextField と同等。"

- `imeOptions`:
  - note(en): "`actionNext` / `actionDone` / `actionSearch` etc. Mapped to `returnKeyType` on iOS / `enterkeyhint` on Web."
  - note(ja): "`actionNext` / `actionDone` / `actionSearch` など。iOS では `returnKeyType`、Web では `enterkeyhint` にマップ。"

#### relatedComponents
`["TextField", "TextView", "Input"]`

---

### 2.6 Input

#### description
- en: "Web-native naming alias mirroring HTML `<input>`. Provides the full set of `type` values (`text`, `email`, `number`, `date`, `color`, `file` etc.)."
- ja: "HTML `<input>` を鏡映する Web ネイティブ命名のエイリアス。`type` 属性の値（`text`, `email`, `number`, `date`, `color`, `file`）をフル指定可能。"

#### usage
- en: "Use Input when a specialized HTML input type is essential (`date`, `color`, `file`, `range`). On iOS/Android these degrade to the closest native picker."
- ja: "`date`, `color`, `file`, `range` など特殊な HTML input 型が必須な場合に使う。iOS / Android では最も近いネイティブピッカーにフォールバック。"

#### examples（最低 3 個）

1. **Date picker** (json)
```json
{
  "type": "Input",
  "inputType": "date",
  "value": "@{birthDate}",
  "min": "1900-01-01",
  "max": "2025-12-31"
}
```

2. **Color picker** (json)
```json
{
  "type": "Input",
  "inputType": "color",
  "value": "@{accentColor}"
}
```

3. **File upload** (json)
```json
{
  "type": "Input",
  "inputType": "file",
  "accept": "image/*",
  "multiple": true,
  "onChange": "@{onFilesSelected}"
}
```

#### attributes

- `inputType`:
  - note(en): "HTML `type` value. Non-web platforms fall back as follows: `date` → native date picker; `color` → hex text input; `file` → native file browser or `UIImagePickerController`; `range` → Slider."
  - note(ja): "HTML `type` 値。非 Web では以下にフォールバック: `date` → ネイティブ日付ピッカー、`color` → hex テキスト入力、`file` → ネイティブファイルブラウザまたは `UIImagePickerController`、`range` → Slider。"

- `accept` (file only):
  - note(en): "MIME filter. Not enforced on native platforms; UX should include client-side validation."
  - note(ja): "MIME フィルタ。ネイティブプラットフォームでは強制されないため、クライアント側での検証を併用する。"

- `min` / `max` / `step`:
  - note(en): "Numeric / date / time bounds. Enforced on web via HTML; native platforms validate on submit."
  - note(ja): "数値・日付・時刻の範囲。Web では HTML で強制、ネイティブでは submit 時に検証。"

#### relatedComponents
`["TextField", "TextView", "Slider", "SelectBox"]`

---

### 2.7 Button

#### description
- en: "Interactive component that triggers a ViewModel event handler on tap. The visual is determined by `style` and child content; the tap target is always the full bounds."
- ja: "タップで ViewModel のイベントハンドラを起動するインタラクティブコンポーネント。見た目は `style` と子要素で決まり、タップ判定は常に領域全体。"

#### usage
- en: "Always bind `onClick` to a ViewModel event. Never put navigation or business logic inside the Button JSON — that belongs in the ViewModel handler."
- ja: "`onClick` は必ず ViewModel のイベントにバインドする。遷移やビジネスロジックを Button の JSON 側に書くのは禁止（ViewModel 側に書く）。"

#### examples（最低 5 個）

1. **Text-only Button** (json)
```json
{
  "type": "Button",
  "text": "@string/save",
  "onClick": "@{onSave}",
  "style": "primary_button"
}
```

2. **Icon + Label composite** (json)
```json
{
  "type": "Button",
  "onClick": "@{onFavorite}",
  "child": [
    {
      "type": "IconLabel",
      "iconName": "heart",
      "iconPosition": "leading",
      "text": "@string/favorite",
      "fontSize": 14
    }
  ]
}
```

3. **Disabled state** (json)
```json
{
  "type": "Button",
  "text": "@string/submit",
  "onClick": "@{onSubmit}",
  "enabled": "@{formValid}"
}
```

4. **Loading state** (json) — shows label when idle, spinner when loading
```json
{
  "type": "Button",
  "onClick": "@{onRefresh}",
  "enabled": "@{!loading}",
  "child": [
    { "type": "Indicator", "visibility": "@{loading ? 'visible' : 'gone'}" },
    { "type": "Label", "text": "@string/refresh", "visibility": "@{loading ? 'gone' : 'visible'}" }
  ]
}
```

5. **With long-press** (json)
```json
{
  "type": "Button",
  "text": "@string/delete",
  "onClick": "@{onDelete}",
  "onLongClick": "@{onConfirmDelete}"
}
```

#### ViewModel handler sample（3 言語）

**Swift**:
```swift
func onSave() {
  Task {
    try await userRepository.save(user)
    router.pop()
  }
}
```

**Kotlin**:
```kotlin
fun onSave() {
  viewModelScope.launch {
    userRepository.save(user)
    router.pop()
  }
}
```

**TypeScript**:
```typescript
async onSave() {
  await this.userRepository.save(this.user);
  this.router.pop();
}
```

#### attributes

- `onClick`:
  - note(en): "Required for Button to be interactive. Must resolve to a ViewModel event handler. Unbound Button emits a build warning."
  - note(ja): "Button をインタラクティブにするため必須。ViewModel のイベントハンドラに解決される必要がある。未バインドの場合ビルド警告。"

- `onLongClick`:
  - note(en): "Long-press event. Default threshold: iOS 500ms / Android 500ms / Web 600ms. Returning `false` from handler allows propagation (Android only)."
  - note(ja): "長押しイベント。閾値は iOS 500ms / Android 500ms / Web 600ms。ハンドラから `false` を返すと伝播（Android のみ）。"

- `enabled`:
  - note(en): "Boolean binding. When `false`, taps are ignored and the button dims to the disabled style."
  - note(ja): "Boolean binding。`false` のときタップが無視され、disabled スタイルで減光表示される。"

- `hapticFeedback`:
  - platformDiff:
    - `swift_uikit`: "`UIImpactFeedbackGenerator(.light)` を発火。"
    - `swift_swiftui`: "iOS 17+ は `.sensoryFeedback(.impact)`。"
    - `kotlin_compose`: "`HapticFeedback.performHapticFeedback(HapticFeedbackType.LongPress)`。"
    - `kotlin_xml`: "`view.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY)`。"
    - `react`: "`navigator.vibrate(10)`（モバイル Web のみ、未サポート端末では no-op）。"

- `ripple` (Android / Web):
  - note(en): "Visual ripple effect on tap. Not available on iOS; use `style` + pressed-state overlay for equivalent feel."
  - note(ja): "タップ時のリップルエフェクト。iOS では使えないため、`style` と press 状態オーバーレイで代替する。"

#### relatedComponents
`["IconLabel", "Label", "Indicator"]`

---

## 3. 必要な strings キー

各コンポーネント記事で共通のセクション見出しを日英 2 言語で:

| prefix | key | 内容 |
|---|---|---|
| `ref_section_` | `description` | "Description" / "概要" |
| `ref_section_` | `usage` | "When to use" / "使いどころ" |
| `ref_section_` | `examples` | "Examples" / "コード例" |
| `ref_section_` | `attributes` | "Attributes" / "属性" |
| `ref_section_` | `platform_diff` | "Platform differences" / "プラットフォーム差分" |
| `ref_section_` | `related` | "Related components" / "関連コンポーネント" |

これらは既に存在している可能性が高いので、不足分のみ追加。

コンポーネント本文内の文字列は**すべて override JSON 内にインラインで日英記述**するため、別途 strings キーは不要（generation pipeline が ViewModel にインジェクトする）。

---

## 4. クロスリンク追加先

- `/learn/hello-world`: 「次のステップ」節に `/reference/components/label` / `/reference/components/button` を追加
- `/learn/data-binding-basics`: 「関連」節に `/reference/components/text-field` / `/reference/components/button` を追加
- `/guides/writing-your-first-spec`: 「よく使うコンポーネント」節に上記 7 コンポーネントの URL を列挙

---

## 5. 実装チェックリスト

- [ ] `docs/data/attribute-overrides/label.json` 作成（上記 §2.1 を貼り付け）
- [ ] `docs/data/attribute-overrides/iconlabel.json` 作成（§2.2）
- [ ] `docs/data/attribute-overrides/textfield.json` 作成（§2.3）
- [ ] `docs/data/attribute-overrides/textview.json` 作成（§2.4）
- [ ] `docs/data/attribute-overrides/edittext.json` 作成（§2.5）
- [ ] `docs/data/attribute-overrides/input.json` 作成（§2.6）
- [ ] `docs/data/attribute-overrides/button.json` 作成（§2.7）
- [ ] plan 14 のスクリプトを実行 → 7 コンポーネントの spec 再生成
- [ ] `jui g project --file` で 7 個の layout + ViewModel 再生成
- [ ] クロスリンク 3 箇所追加
- [ ] `jui build` 0 warnings
- [ ] `jui verify --fail-on-diff`
- [ ] `jsonui-localize`

---

## 6. セッション分割の推奨境界

本プランが 1 セッションで重い場合、以下で分割:

- **分割 A**: Label / IconLabel / Button（基本 3 点セット、2 時間）
- **分割 B**: TextField / TextView / EditText / Input（入力系 4 点セット、3 時間）

分割 A → B の順推奨（Label を先に確立するとクロスリンクの整合がとりやすい）。
