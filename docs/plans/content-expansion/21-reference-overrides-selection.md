# 21. コンテンツプラン: Reference — 選択・状態系コンポーネント

> Scope: 5〜7 時間 / 2 セッション。10 コンポーネント（SelectBox, Switch, Toggle, Segment, Slider, Radio, CheckBox, Check, Progress, Indicator）。
> 依存: plan 14, plan 20（`ref_section_*` strings が plan 20 で用意される）。

---

## 1. 対象記事

| URL | override JSON | コンポーネント | 役割 |
|---|---|---|---|
| `/reference/components/select-box` | `docs/data/attribute-overrides/selectbox.json` | SelectBox | プルダウン選択 |
| `/reference/components/switch` | `.../switch.json` | Switch | ON/OFF トグル（iOS 風） |
| `/reference/components/toggle` | `.../toggle.json` | Toggle | ON/OFF トグル（Android 風エイリアス） |
| `/reference/components/segment` | `.../segment.json` | Segment | セグメントコントロール |
| `/reference/components/slider` | `.../slider.json` | Slider | 連続値入力 |
| `/reference/components/radio` | `.../radio.json` | Radio | 排他選択（1 件） |
| `/reference/components/check-box` | `.../checkbox.json` | CheckBox | チェック（独立） |
| `/reference/components/check` | `.../check.json` | Check | CheckBox 旧エイリアス |
| `/reference/components/progress` | `.../progress.json` | Progress | 進捗バー |
| `/reference/components/indicator` | `.../indicator.json` | Indicator | スピナー |

override JSON のフォーマットは plan 14 §4 に準拠。

---

## 2. 各記事の内容

### 2.1 SelectBox

#### description
- en: "Dropdown / picker for choosing one value from a discrete list. Renders as native picker on iOS / Android, `<select>` on Web."
- ja: "離散的な選択肢から 1 つを選ぶプルダウン／ピッカー。iOS / Android ではネイティブピッカー、Web では `<select>` としてレンダリングされる。"

#### usage
- en: "Use SelectBox when the option count is >= 5 or the options are long strings. For 2-4 short options prefer Segment. For hierarchical options use multi-stage pickers."
- ja: "選択肢が 5 つ以上、または各項目が長い場合に使う。2〜4 個の短い選択肢なら Segment を優先。階層的な選択は多段ピッカーで構成。"

#### examples

1. **Static options** (json)
```json
{
  "type": "SelectBox",
  "value": "@{country}",
  "items": [
    { "label": "Japan", "value": "JP" },
    { "label": "United States", "value": "US" },
    { "label": "United Kingdom", "value": "UK" }
  ]
}
```

2. **Bound options from ViewModel** (json)
```json
{
  "type": "SelectBox",
  "value": "@{selectedCategory}",
  "items": "@{categoryOptions}",
  "labelKey": "name",
  "valueKey": "id",
  "placeholder": "@string/select_category"
}
```

3. **With onChange handler** (json)
```json
{
  "type": "SelectBox",
  "value": "@{currency}",
  "items": "@{currencyOptions}",
  "onChange": "@{onCurrencyChanged}"
}
```

#### attributes

- `items`:
  - note(en): "Array of `{ label, value }` objects, or bound to ViewModel array. When bound, `labelKey` and `valueKey` specify which fields to use."
  - note(ja): "`{ label, value }` オブジェクトの配列、または ViewModel の配列にバインド。バインド時は `labelKey` / `valueKey` でフィールドを指定。"

- `value`:
  - note(en): "Two-way binding to the selected value (not label). Must match one of `items[].value` or be `null`/empty when nothing is selected."
  - note(ja): "選択された **値**（ラベルではない）への two-way binding。`items[].value` のいずれかと一致する必要があり、未選択時は `null` または空。"

- `placeholder`:
  - note(en): "Shown when `value` is empty. Not part of the `items` list; selecting it has no effect."
  - note(ja): "`value` が空のとき表示。`items` に含まれず、選択しても何も起こらない。"

- `onChange`:
  - note(en): "Fires after the user confirms a selection. Receives the new value as the single argument."
  - note(ja): "選択確定後に発火。新しい値を 1 引数で受け取る。"

#### relatedComponents
`["Segment", "Radio"]`

---

### 2.2 Switch

#### description
- en: "Binary ON/OFF control with an animated toggle thumb. Visually matches the host platform (iOS capsule / Android Material / Web custom)."
- ja: "二値 ON/OFF を切り替えるアニメーション付きトグル。見た目はホストプラットフォームに準拠（iOS カプセル / Android Material / Web カスタム）。"

#### usage
- en: "Use Switch when the action takes effect immediately (e.g., `Enable notifications`). For delayed commit (form submission) use CheckBox."
- ja: "アクションが即時反映される場合に使う（例: `通知を有効化`）。フォーム送信後に反映する場合は CheckBox を使う。"

#### examples

1. **Minimum** (json)
```json
{
  "type": "Switch",
  "value": "@{notificationsEnabled}",
  "onChange": "@{onToggleNotifications}"
}
```

2. **With label via composite View** (json)
```json
{
  "type": "View",
  "orientation": "horizontal",
  "child": [
    { "type": "Label", "text": "@string/enable_notifications", "weight": 1 },
    { "type": "Switch", "value": "@{notificationsEnabled}" }
  ]
}
```

#### attributes

- `value`:
  - note(en): "Two-way Boolean binding."
  - note(ja): "Boolean の two-way binding。"

- `onChange`:
  - note(en): "Fires with the new Boolean value. Mutually convertible with binding — use `onChange` when side effects beyond state update are needed."
  - note(ja): "新しい Boolean を引数に発火。binding と相互互換だが、状態更新以外の副作用がある場合に使う。"

- `activeColor` / `inactiveColor`:
  - platformDiff:
    - `swift_uikit`: "`UISwitch.onTintColor` / `tintColor`。"
    - `swift_swiftui`: "`.tint(activeColor)`（iOS 15+）。"
    - `kotlin_compose`: "`SwitchColors(checkedTrackColor=, uncheckedTrackColor=)`。"
    - `kotlin_xml`: "`android:thumbTint` / `android:trackTint`。"
    - `react`: "CSS variable `--switch-on-bg` / `--switch-off-bg` を上書き。"

#### relatedComponents
`["Toggle", "CheckBox"]`

---

### 2.3 Toggle

#### description
- en: "Alias for Switch with Android-style naming. Identical runtime behavior."
- ja: "Switch の Android 流命名エイリアス。実行時動作は同一。"

#### usage
- en: "Prefer Switch in new code. Toggle exists for migration from Android Jetpack Compose `Toggle` widget."
- ja: "新規コードでは Switch を推奨。Toggle は Android Jetpack Compose `Toggle` からの移行のために存在。"

#### examples（1 個でよい）

1. **Alias example** (json)
```json
{ "type": "Toggle", "value": "@{darkMode}" }
```

#### attributes
Switch と同一（クロスリンクで `/reference/components/switch` を参照）。override JSON では `attributes` キーを省略し、`"aliasOf": "Switch"` フィールドで表現（生成スクリプト側で alias 参照に変換）。

#### relatedComponents
`["Switch", "CheckBox"]`

---

### 2.4 Segment

#### description
- en: "Segmented control — mutually exclusive horizontal button group. Shows 2-5 options at a time."
- ja: "排他的な水平ボタングループ。同時に 2〜5 個の選択肢を表示。"

#### usage
- en: "Use when options are short (1-2 words) and all visible at once benefits the user (filters, toggles). Beyond 5 options use SelectBox."
- ja: "選択肢が短く（1〜2 語）、同時に全て見える方が有益な場合（フィルタ、トグル）に使う。6 つ以上なら SelectBox。"

#### examples

1. **Filter segment** (json)
```json
{
  "type": "Segment",
  "value": "@{filter}",
  "items": [
    { "label": "@string/all", "value": "all" },
    { "label": "@string/active", "value": "active" },
    { "label": "@string/done", "value": "done" }
  ],
  "onChange": "@{onFilterChanged}"
}
```

2. **Icon segment** (json)
```json
{
  "type": "Segment",
  "value": "@{viewMode}",
  "items": [
    { "icon": "list.bullet", "value": "list" },
    { "icon": "square.grid.2x2", "value": "grid" }
  ]
}
```

#### attributes

- `items[].icon`:
  - note(en): "Optional icon per segment. When both `label` and `icon` are set, icon displays above label (mobile) or left of label (web, wide screens)."
  - note(ja): "セグメント単位のアイコン。`label` と `icon` 両方指定時は、モバイルではラベル上、Web 広幅ではラベル左。"

- `variant`:
  - note(en): "`default` / `compact` / `capsule`. `capsule` matches iOS 14+ modern picker style."
  - note(ja): "`default` / `compact` / `capsule`。`capsule` は iOS 14+ の現代的ピッカー風。"

#### relatedComponents
`["SelectBox", "Radio"]`

---

### 2.5 Slider

#### description
- en: "Continuous numeric input over a defined range. Can be constrained to steps for discrete values."
- ja: "指定範囲の連続数値入力。`step` を設定すれば離散値にも対応。"

#### usage
- en: "Use Slider for values where rough precision is acceptable (volume, brightness, opacity). For exact integers use TextField with `inputType: number`."
- ja: "大まかな精度で十分な値（音量、輝度、不透明度）に使う。厳密な整数入力なら `inputType: number` の TextField を使う。"

#### examples

1. **Volume slider** (json)
```json
{
  "type": "Slider",
  "value": "@{volume}",
  "min": 0,
  "max": 100,
  "step": 1,
  "onChange": "@{onVolumeChanged}"
}
```

2. **Dual-thumb range (platform permitting)** (json)
```json
{
  "type": "Slider",
  "value": "@{priceRange}",
  "min": 0,
  "max": 50000,
  "step": 500,
  "range": true
}
```
- note: `range: true` は iOS SwiftUI 15+ / Android Compose / Web で対応。UIKit / Android XML では 2 つの Slider を並べる。

#### attributes

- `value`:
  - note(en): "Two-way numeric binding. When `range: true`, bind to `{ lower, upper }` object."
  - note(ja): "数値の two-way binding。`range: true` では `{ lower, upper }` オブジェクトにバインド。"

- `min` / `max` / `step`:
  - note(en): "Inclusive bounds. `step` of `0` means continuous (sub-pixel). Default step: `(max - min) / 100`."
  - note(ja): "端点を含む境界。`step: 0` は連続値（サブピクセル）。デフォルト step は `(max - min) / 100`。"

- `showValue`:
  - note(en): "If `true`, a Label showing the current value is rendered above the thumb. Platform-native on iOS / Android; CSS overlay on Web."
  - note(ja): "`true` でつまみ上に現在値の Label を表示。iOS / Android はネイティブ、Web は CSS オーバーレイ。"

#### relatedComponents
`["Progress", "Input"]`

---

### 2.6 Radio

#### description
- en: "Mutually exclusive selection within a group. Behaves as a standalone radio button; grouping is established via shared `group` attribute."
- ja: "グループ内で排他的に 1 件を選択。単体のラジオボタンとして動作し、`group` 属性で同じグループに属するものを定義する。"

#### usage
- en: "Use Radio when 2-5 options must all be visible simultaneously and mutually exclusive. For 6+ use SelectBox."
- ja: "排他的かつ全選択肢を同時表示したい 2〜5 個で使う。6 個以上は SelectBox。"

#### examples

1. **Radio group with 3 options** (json)
```json
{
  "type": "View",
  "orientation": "vertical",
  "child": [
    { "type": "Radio", "group": "size", "value": "S", "selected": "@{size}", "label": "@string/small" },
    { "type": "Radio", "group": "size", "value": "M", "selected": "@{size}", "label": "@string/medium" },
    { "type": "Radio", "group": "size", "value": "L", "selected": "@{size}", "label": "@string/large" }
  ]
}
```

#### attributes

- `group`:
  - note(en): "String identifier. All Radio instances with the same `group` within a parent View form a mutually-exclusive set. Parent lookup walks ancestors until first Scroll or Collection."
  - note(ja): "文字列識別子。同一親 View 配下で同じ `group` を持つ Radio が排他グループを形成。親の探索は最初の Scroll または Collection まで遡る。"

- `selected`:
  - note(en): "Two-way binding to the group's selected value. All Radios in the group share the same binding target."
  - note(ja): "グループの選択値への two-way binding。グループ内の全 Radio が同じバインド先を共有。"

- `label`:
  - note(en): "Inline label rendered to the right of the radio circle. For custom label layout, omit `label` and wrap Radio + Label in a horizontal View."
  - note(ja): "ラジオ丸の右に表示するインラインラベル。独自配置が必要なら `label` を省略し、水平 View で Radio + Label を並べる。"

#### relatedComponents
`["Segment", "SelectBox", "CheckBox"]`

---

### 2.7 CheckBox

#### description
- en: "Binary or tristate (on / off / indeterminate) checkbox. Unlike Radio, CheckBoxes are independent even when visually grouped."
- ja: "二値または三値（ON / OFF / 不定）のチェックボックス。Radio と異なり、見た目がグループでも各 CheckBox は独立。"

#### usage
- en: "Use CheckBox for zero-or-more selections (terms-of-service, interests, multi-select lists). For exclusive one-of-N use Radio."
- ja: "0〜N 個の選択（利用規約、興味、複数選択リスト）に使う。排他的な 1 件選択は Radio。"

#### examples

1. **Single checkbox** (json)
```json
{
  "type": "CheckBox",
  "checked": "@{agreeToTerms}",
  "label": "@string/accept_terms"
}
```

2. **Indeterminate parent** (json)
```json
{
  "type": "CheckBox",
  "checked": "@{allSelected}",
  "indeterminate": "@{someSelected && !allSelected}",
  "label": "@string/select_all"
}
```

#### attributes

- `checked`:
  - note(en): "Two-way Boolean binding. If `indeterminate` is true, `checked` is visually hidden by the indeterminate glyph."
  - note(ja): "Boolean の two-way binding。`indeterminate: true` のとき `checked` の見た目は不定グリフで上書きされる。"

- `indeterminate`:
  - note(en): "Renders a dash/tilde glyph instead of the check. Tapping always moves to `checked: true`, clearing indeterminate."
  - note(ja): "チェックの代わりにダッシュ記号を表示。タップすると必ず `checked: true` に移り、indeterminate は解除される。"

- `label`:
  - note(en): "Inline label. Tapping the label is equivalent to tapping the checkbox."
  - note(ja): "インラインラベル。ラベルタップもチェックボックスと同じ動作。"

#### relatedComponents
`["Check", "Switch", "Radio"]`

---

### 2.8 Check

#### description
- en: "Alias for CheckBox. Identical runtime behavior."
- ja: "CheckBox のエイリアス。実行時動作は同一。"

#### usage
- en: "Prefer CheckBox in new code. Check exists for shorter notation and legacy spec compatibility."
- ja: "新規コードでは CheckBox を推奨。Check は短記法と旧 spec 互換のために存在。"

#### examples

1. **Minimum** (json)
```json
{ "type": "Check", "checked": "@{subscribe}" }
```

#### attributes
CheckBox と同一（`"aliasOf": "CheckBox"`）。

#### relatedComponents
`["CheckBox"]`

---

### 2.9 Progress

#### description
- en: "Linear or circular progress indicator. Determinate when `value` is set; indeterminate (animated) when `value` is null or omitted."
- ja: "線形または円形の進捗インジケータ。`value` を指定すると確定進捗、省略または null で不定進捗（アニメーション）。"

#### usage
- en: "Use Progress for multi-second tasks where the user benefits from seeing elapsed fraction. For brief (<1s) waits use Indicator."
- ja: "数秒以上かかるタスクで進捗率を示すと有益な場合に使う。1 秒未満の短い待機なら Indicator を使う。"

#### examples

1. **Determinate linear** (json)
```json
{
  "type": "Progress",
  "value": "@{uploadProgress}",
  "max": 100,
  "variant": "linear"
}
```

2. **Indeterminate circular** (json)
```json
{
  "type": "Progress",
  "variant": "circular",
  "size": 48
}
```

#### attributes

- `value`:
  - note(en): "Numeric 0 to `max`. Omit or set to `null` for indeterminate. Smoothly interpolates on change."
  - note(ja): "0〜`max` の数値。省略または `null` で不定。変化時は滑らかに補間される。"

- `variant`:
  - note(en): "`linear` (default) or `circular`."
  - note(ja): "`linear`（デフォルト）または `circular`。"

- `size`:
  - note(en): "For `circular`, the outer diameter (pt/dp). For `linear`, the thickness (height)."
  - note(ja): "`circular` では外径（pt/dp）、`linear` では太さ（高さ）。"

#### relatedComponents
`["Indicator", "Slider"]`

---

### 2.10 Indicator

#### description
- en: "Activity spinner for indefinite, short-duration waits (loading, network fetching). Always animated, no progress value."
- ja: "不定・短時間の待機用スピナー（ローディング、ネットワーク取得）。常にアニメーション、進捗値なし。"

#### usage
- en: "Use Indicator to signal 'something is happening' when you don't know the duration. For progress % use Progress."
- ja: "所要時間不明で「何かが進行中」だと示したいときに使う。進捗 % が分かるなら Progress。"

#### examples

1. **Inline spinner** (json)
```json
{ "type": "Indicator", "size": 20 }
```

2. **Conditional display** (json)
```json
{
  "type": "Indicator",
  "visibility": "@{loading ? 'visible' : 'gone'}",
  "size": 40,
  "color": "#2563EB"
}
```

#### attributes

- `size`:
  - note(en): "Outer diameter. Default 20 on mobile, 16 on web (inline)."
  - note(ja): "外径。モバイル既定 20、Web インライン 16。"

- `color`:
  - note(en): "Spinner stroke color. Defaults to current theme's `accent` color."
  - note(ja): "スピナーの線色。省略時は現テーマの `accent`。"

- `thickness`:
  - note(en): "Stroke thickness in pt/dp. Default `size / 10`."
  - note(ja): "線の太さ（pt/dp）。デフォルト `size / 10`。"

#### relatedComponents
`["Progress"]`

---

## 3. 必要な strings キー

plan 20 で追加した `ref_section_*` を再利用。本プラン固有の追加キーは不要（各コンポーネント固有の文言は override JSON にインラインで日英記述）。

---

## 4. クロスリンク追加先

- `/learn/data-binding-basics`: 「選択状態の binding」節から `/reference/components/select-box` / `/reference/components/switch` へ
- `/guides/testing`: 「UI 要素の操作方法」節から `/reference/components/check-box` / `/reference/components/radio` / `/reference/components/slider` へ

---

## 5. 実装チェックリスト

- [ ] `docs/data/attribute-overrides/selectbox.json`
- [ ] `docs/data/attribute-overrides/switch.json`
- [ ] `docs/data/attribute-overrides/toggle.json`（`aliasOf: Switch`）
- [ ] `docs/data/attribute-overrides/segment.json`
- [ ] `docs/data/attribute-overrides/slider.json`
- [ ] `docs/data/attribute-overrides/radio.json`
- [ ] `docs/data/attribute-overrides/checkbox.json`
- [ ] `docs/data/attribute-overrides/check.json`（`aliasOf: CheckBox`）
- [ ] `docs/data/attribute-overrides/progress.json`
- [ ] `docs/data/attribute-overrides/indicator.json`
- [ ] plan 14 のスクリプト再実行
- [ ] `jui g project --file` で 10 個の spec を生成
- [ ] クロスリンク追加
- [ ] `jui build` 0 warnings
- [ ] `jui verify --fail-on-diff`
- [ ] `jsonui-localize`

---

## 6. セッション分割の推奨境界

- **分割 A**: SelectBox / Segment / Radio / SelectBox / Slider（選択系 4 点、3 時間）
- **分割 B**: Switch / Toggle / CheckBox / Check（トグル・チェック 4 点、2 時間）
- **分割 C**: Progress / Indicator（状態表示 2 点、1 時間）
