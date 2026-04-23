# 22. コンテンツプラン: Reference — コンテナ系コンポーネント

> Scope: 4〜6 時間 / 1〜2 セッション。5 コンポーネント（View, SafeAreaView, ScrollView, Collection, TabView）。
> 依存: plan 14, plan 20（`ref_section_*`）。

コンテナ系は**他コンポーネントを内包する**のでクロスリンクが多い。サンプルは「子要素の組み立て方」を重点的に示す。

---

## 1. 対象記事

| URL | override JSON | コンポーネント |
|---|---|---|
| `/reference/components/view` | `docs/data/attribute-overrides/view.json` | View |
| `/reference/components/safe-area-view` | `.../safeareaview.json` | SafeAreaView |
| `/reference/components/scroll-view` | `.../scrollview.json` | ScrollView |
| `/reference/components/collection` | `.../collection.json` | Collection |
| `/reference/components/tab-view` | `.../tabview.json` | TabView |

---

## 2. 各記事の内容

### 2.1 View

#### description
- en: "Generic container that arranges child components vertically or horizontally. The most-used component — every JsonUI screen has a View at the root of each layout segment."
- ja: "子要素を垂直または水平に並べる汎用コンテナ。最も多用され、あらゆる JsonUI 画面の各セクションのルートに存在する。"

#### usage
- en: "Use View whenever you need to group multiple components. Choose `orientation` (vertical/horizontal). For scrollable content use ScrollView instead."
- ja: "複数の要素をまとめたいとき常に使う。`orientation` で方向を決める（vertical / horizontal）。スクロールが必要なら ScrollView を使う。"

#### examples

1. **Vertical stack** (json)
```json
{
  "type": "View",
  "orientation": "vertical",
  "child": [
    { "type": "Label", "text": "@string/title", "fontSize": 24 },
    { "type": "Label", "text": "@string/subtitle", "fontSize": 16 },
    { "type": "Button", "text": "@string/action", "onClick": "@{onAction}" }
  ]
}
```

2. **Horizontal with weight** (json) — middle element stretches
```json
{
  "type": "View",
  "orientation": "horizontal",
  "child": [
    { "type": "Image", "source": "avatar", "width": 40, "height": 40 },
    { "type": "Label", "text": "@{userName}", "weight": 1 },
    { "type": "Label", "text": "@{timestamp}", "fontColor": "#9CA3AF" }
  ]
}
```

3. **With background + corner radius** (json)
```json
{
  "type": "View",
  "background": "#F3F4F6",
  "cornerRadius": 12,
  "paddings": [16, 16, 16, 16],
  "child": [
    { "type": "Label", "text": "@string/card_body" }
  ]
}
```

4. **Conditional visibility** (json)
```json
{
  "type": "View",
  "visibility": "@{hasError ? 'visible' : 'gone'}",
  "background": "#FEE2E2",
  "paddings": [12, 12, 12, 12],
  "child": [
    { "type": "Label", "text": "@{errorMessage}", "fontColor": "#991B1B" }
  ]
}
```

#### attributes

- `orientation`:
  - note(en): "`vertical` (default) / `horizontal`. Switches child layout axis."
  - note(ja): "`vertical`（デフォルト） / `horizontal`。子要素の配置軸を決める。"

- `child`:
  - note(en): "Array of child components. Order determines layout order. Dynamic children should use Collection, not `child`."
  - note(ja): "子要素の配列。順序がレイアウト順序を決定。動的な繰り返しは `child` ではなく Collection を使う。"

- `gravity`:
  - note(en): "`left` / `center` / `right` / `top` / `bottom`. For vertical orientation applies horizontal alignment; for horizontal applies vertical."
  - note(ja): "`left` / `center` / `right` / `top` / `bottom`。垂直配置なら水平方向の揃え、水平配置なら垂直方向の揃え。"

- `distribution`:
  - note(en): "`start` / `center` / `end` / `spaceBetween` / `spaceAround` / `spaceEvenly`. Controls child distribution along the main axis."
  - note(ja): "`start` / `center` / `end` / `spaceBetween` / `spaceAround` / `spaceEvenly`。主軸方向の配分を制御。"

- `background`:
  - note(en): "Color hex, named color, or `@color/token`. For gradients use GradientView."
  - note(ja): "色 hex、色名、または `@color/token`。グラデーションは GradientView を使う。"

- `cornerRadius`:
  - note(en): "Rounded corners in pt/dp. Array `[tl, tr, br, bl]` for per-corner control."
  - note(ja): "角丸の半径（pt/dp）。`[左上, 右上, 右下, 左下]` の配列で角ごとに指定可能。"

- `borderColor` / `borderWidth`:
  - note(en): "`borderWidth` in pt/dp; `borderColor` same format as `background`. Both required for border to render."
  - note(ja): "`borderWidth` は pt/dp、`borderColor` は背景と同形式。両方指定で描画される。"

- `shadow` (object):
  - note(en): "`{ color, offsetX, offsetY, radius, opacity }`. Applied to the entire View."
  - note(ja): "`{ color, offsetX, offsetY, radius, opacity }`。View 全体に適用。"
  - platformDiff:
    - `swift_uikit`: "`layer.shadow*` プロパティにマップ。"
    - `swift_swiftui`: "`.shadow(color: ..., radius: ..., x: ..., y: ...)`。"
    - `kotlin_compose`: "`.shadow(elevation, shape)` にマップ。"
    - `kotlin_xml`: "Android では `elevation` + outline provider が必要。"
    - `react`: "CSS `box-shadow: Xpx Ypx radiuspx color` に変換。"

#### relatedComponents
`["SafeAreaView", "ScrollView", "Collection"]`

---

### 2.2 SafeAreaView

#### description
- en: "View that respects the host platform's safe area (notch, home indicator, status bar). Typically placed at the root of the screen."
- ja: "ホストプラットフォームのセーフエリア（ノッチ、ホームインジケータ、ステータスバー）を尊重する View。画面のルートに置くのが一般的。"

#### usage
- en: "Wrap the outermost content of each screen in SafeAreaView. Inside SafeAreaView, use regular View + ScrollView for normal layout."
- ja: "各画面の最外層コンテンツを SafeAreaView で包む。内部は通常の View + ScrollView でレイアウトする。"

#### examples

1. **Screen root** (json)
```json
{
  "type": "SafeAreaView",
  "child": [
    { "include": "common/header" },
    { "type": "ScrollView", "weight": 1, "child": [ ... ] },
    { "include": "common/footer" }
  ]
}
```

2. **Ignore specific edges** (json)
```json
{
  "type": "SafeAreaView",
  "edges": ["top", "bottom"],
  "child": [ ... ]
}
```

#### attributes

- `edges`:
  - note(en): "Array of edges to respect: `top` / `bottom` / `leading` / `trailing`. Omit or use `all` to respect every edge."
  - note(ja): "尊重するエッジの配列: `top` / `bottom` / `leading` / `trailing`。省略または `all` で全エッジ。"

- `background`:
  - note(en): "Fills both safe area and inside. If you want the safe area background to differ, use a regular View with the different color behind."
  - note(ja): "セーフエリアと内部の両方を塗る。異なる色にしたい場合は別の View を背面に敷く。"

- `ignoreKeyboard`:
  - note(en): "When `true`, the safe area does not shrink on keyboard appearance. Default `false`."
  - note(ja): "`true` でキーボード出現時もセーフエリアを縮めない。デフォルト `false`。"
  - platformDiff:
    - `swift_uikit`: "`UIResponder.keyboardWillShowNotification` を購読しない。"
    - `swift_swiftui`: "`.ignoresSafeArea(.keyboard)` を付与。"
    - `kotlin_compose`: "`imePadding()` を付与しない。"
    - `kotlin_xml`: "`windowSoftInputMode=adjustNothing` に相当。"
    - `react`: "Web ではキーボードが固定 UI を押し上げない、常に `false` 相当。"

#### relatedComponents
`["View"]`

---

### 2.3 ScrollView

#### description
- en: "Vertically (default) or horizontally scrollable container. Children that exceed the visible bounds become scrollable."
- ja: "垂直（デフォルト）または水平にスクロール可能なコンテナ。可視領域を超えた子要素がスクロール対象になる。"

#### usage
- en: "Use ScrollView for static-sized content that may overflow (forms, long articles). For large dynamic lists use Collection — it virtualizes."
- ja: "オーバーフローする可能性のある静的コンテンツ（フォーム、長文）に使う。大量の動的リストは仮想化される Collection を使う。"

#### examples

1. **Vertical scroll** (json)
```json
{
  "type": "ScrollView",
  "width": "matchParent",
  "height": "matchParent",
  "child": [
    { "type": "View", "orientation": "vertical", "child": [ ... 100 elements ... ] }
  ]
}
```

2. **Horizontal scroll with hidden scrollbar** (json)
```json
{
  "type": "ScrollView",
  "orientation": "horizontal",
  "showsScrollIndicator": false,
  "child": [
    { "type": "View", "orientation": "horizontal", "child": [ ... ] }
  ]
}
```

3. **Paging (snap per screen)** (json)
```json
{
  "type": "ScrollView",
  "orientation": "horizontal",
  "paging": true,
  "child": [
    { "type": "View", "width": "matchParent", "child": [ ... page1 ... ] },
    { "type": "View", "width": "matchParent", "child": [ ... page2 ... ] },
    { "type": "View", "width": "matchParent", "child": [ ... page3 ... ] }
  ]
}
```

#### attributes

- `orientation`:
  - note(en): "`vertical` (default) / `horizontal`. For both-axis scrolling nest two ScrollViews."
  - note(ja): "`vertical`（デフォルト） / `horizontal`。両軸スクロールは 2 つの ScrollView をネスト。"

- `paging`:
  - note(en): "`true` snaps to child boundaries (each child = one page). Usually combined with children sized to parent."
  - note(ja): "`true` で子要素境界にスナップ（子要素 1 つ = 1 ページ）。通常は子を親サイズに揃える。"

- `refreshControl` (vertical only):
  - note(en): "`{ onRefresh: '@{handler}' }`. Enables pull-to-refresh. Not available on horizontal ScrollView."
  - note(ja): "`{ onRefresh: '@{handler}' }`。プルリフレッシュを有効化。水平 ScrollView では使えない。"

- `contentInset`:
  - note(en): "`[top, right, bottom, left]`. Inner padding of scrollable content, does not affect scroll bounds on mobile."
  - note(ja): "`[top, right, bottom, left]`。スクロールコンテンツの内側パディング。モバイルでは scroll bounds に影響しない。"

- `showsScrollIndicator`:
  - note(en): "Boolean. On iOS SwiftUI requires `ios 16+` for hiding; earlier versions always show."
  - note(ja): "Boolean。iOS SwiftUI で非表示にするには `iOS 16+` が必要。それ以前は常に表示される。"

#### relatedComponents
`["Collection", "View"]`

---

### 2.4 Collection

#### description
- en: "Virtualized list/grid for dynamic arrays. Renders only visible items. Supports vertical/horizontal lists, multi-column grids, section headers, and lazy loading."
- ja: "動的配列を仮想化して描画するリスト／グリッド。可視範囲のみ描画。垂直／水平リスト、複数カラムグリッド、セクションヘッダ、遅延読み込みに対応。"

#### usage
- en: "Use Collection for any list bound to a dynamic array (search results, feeds, product grids). Each row is rendered by a cell file referenced in `sections[].cell`."
- ja: "動的配列にバインドされる任意のリスト（検索結果、フィード、商品グリッド）に使う。各行は `sections[].cell` で参照する cell ファイルが描画する。"

#### examples

1. **Simple vertical list** (json)
```json
{
  "type": "Collection",
  "items": "@{users}",
  "cellIdProperty": "id",
  "sections": [ { "cell": "cells/user_row" } ]
}
```

2. **Grid 2 columns** (json)
```json
{
  "type": "Collection",
  "items": "@{photos}",
  "columnCount": 2,
  "itemSpacing": 8,
  "lineSpacing": 8,
  "sections": [ { "cell": "cells/photo_card" } ]
}
```

3. **Sectioned list with header** (json)
```json
{
  "type": "Collection",
  "items": "@{sectionedMessages}",
  "sections": [
    {
      "header": "cells/date_header",
      "cell": "cells/message_row",
      "headerProperty": "date",
      "itemsProperty": "items"
    }
  ]
}
```

4. **Horizontal carousel** (json)
```json
{
  "type": "Collection",
  "items": "@{featuredProducts}",
  "orientation": "horizontal",
  "sections": [ { "cell": "cells/product_card" } ]
}
```

5. **Infinite scroll** (json)
```json
{
  "type": "Collection",
  "items": "@{articles}",
  "onEndReached": "@{onLoadMore}",
  "endReachedThreshold": 0.5,
  "sections": [ { "cell": "cells/article_row" } ]
}
```

#### attributes

- `items`:
  - note(en): "Bound to ViewModel array. Each element must have a stable identifier (see `cellIdProperty`) for efficient reconciliation."
  - note(ja): "ViewModel の配列にバインド。各要素は安定した ID（`cellIdProperty` 参照）を持つ必要があり、これで差分更新される。"

- `cellIdProperty`:
  - note(en): "Key name to use as stable identifier. Defaults to `id`. Required for correct reordering animations."
  - note(ja): "安定 ID として使うキー名。デフォルト `id`。並び替えアニメーションを正しくするために必須。"

- `sections`:
  - note(en): "Array of section definitions. Each has `cell` (required), optional `header` / `footer` / `headerProperty` / `footerProperty` / `itemsProperty`."
  - note(ja): "セクション定義の配列。`cell`（必須）に加え、`header` / `footer` / `headerProperty` / `footerProperty` / `itemsProperty` が任意。"

- `columnCount`:
  - note(en): "For grid layouts. Default 1 (list). Responsive: accepts `{ xs: 1, md: 2, lg: 3 }` object for breakpoint-based columns."
  - note(ja): "グリッドレイアウト時のカラム数。デフォルト 1（リスト）。レスポンシブ: `{ xs: 1, md: 2, lg: 3 }` オブジェクトでブレークポイント別に指定可。"

- `itemSpacing` / `lineSpacing`:
  - note(en): "`itemSpacing` separates cells on the cross axis (between columns). `lineSpacing` separates on the main axis (between rows)."
  - note(ja): "`itemSpacing` は交差軸（カラム間）、`lineSpacing` は主軸（行間）の間隔。"

- `lazy`:
  - note(en): "`true` (default) — virtualizes. `false` renders all rows at once (use only for short, known-bounded lists)."
  - note(ja): "`true`（デフォルト）で仮想化。`false` は全行を一度に描画（短く長さ既知のリストでのみ使う）。"

- `onEndReached`:
  - note(en): "Handler fired when user scrolls past `endReachedThreshold` (0.0-1.0, default 0.3) of remaining content."
  - note(ja): "残コンテンツの `endReachedThreshold`（0.0〜1.0、デフォルト 0.3）を超えたときに発火するハンドラ。"

- `refreshControl`:
  - note(en): "Same as ScrollView: `{ onRefresh: '@{handler}' }`."
  - note(ja): "ScrollView と同じ: `{ onRefresh: '@{handler}' }`。"

- `emptyView`:
  - note(en): "Cell to render when `items` is empty. Accepts a path like `cells/empty_state`."
  - note(ja): "`items` が空のとき描画する cell。`cells/empty_state` のようなパスを指定。"

#### relatedComponents
`["ScrollView", "View"]`

---

### 2.5 TabView

#### description
- en: "Tab bar with multiple pages. Each tab's content is a separate child View or include; only the active tab renders."
- ja: "複数ページを持つタブバー。各タブは独立した子 View または include で、アクティブなタブのみ描画される。"

#### usage
- en: "Use TabView for top-level screen switching where users expect a persistent bottom bar (iOS) or top bar (Android Material tabs)."
- ja: "ユーザーが常設タブバーを期待する最上位画面切替に使う（iOS ならボトム、Android Material ならトップ）。"

#### examples

1. **3 tabs bottom bar** (json)
```json
{
  "type": "TabView",
  "activeIndex": "@{activeTab}",
  "position": "bottom",
  "tabs": [
    { "label": "@string/home", "icon": "house", "include": "screens/home" },
    { "label": "@string/search", "icon": "magnifyingglass", "include": "screens/search" },
    { "label": "@string/profile", "icon": "person", "include": "screens/profile" }
  ]
}
```

2. **Top material tabs** (json)
```json
{
  "type": "TabView",
  "activeIndex": "@{categoryIndex}",
  "position": "top",
  "variant": "underline",
  "tabs": [
    { "label": "@string/all", "include": "views/all_list" },
    { "label": "@string/active", "include": "views/active_list" },
    { "label": "@string/done", "include": "views/done_list" }
  ]
}
```

#### attributes

- `activeIndex`:
  - note(en): "Two-way Int binding. Writes back on tab tap."
  - note(ja): "Int の two-way binding。タブタップで書き戻される。"

- `position`:
  - note(en): "`top` / `bottom`. Defaults differ per platform: iOS → `bottom`, Android → `top`, Web → `top`."
  - note(ja): "`top` / `bottom`。既定はプラットフォーム別: iOS → `bottom`、Android → `top`、Web → `top`。"

- `variant`:
  - note(en): "`pill` / `underline` / `capsule` / `icon-text`. Visual style; does not change behavior."
  - note(ja): "`pill` / `underline` / `capsule` / `icon-text`。見た目のみを変える。"

- `tabs[].include`:
  - note(en): "Layout file path. Content is loaded lazily — tabs not yet visited don't instantiate their ViewModel."
  - note(ja): "Layout ファイルパス。未訪問のタブは ViewModel を生成しない（遅延読み込み）。"

- `onTabChange`:
  - note(en): "Optional handler called after `activeIndex` updates. Use for analytics."
  - note(ja): "`activeIndex` 更新後に呼ばれる任意ハンドラ。アナリティクス等に使う。"

#### relatedComponents
`["View", "ScrollView", "Collection"]`

---

## 3. 必要な strings キー

plan 20 の `ref_section_*` を再利用。追加なし。

---

## 4. クロスリンク追加先

- `/learn/first-screen`: 「画面の骨組み」節から `/reference/components/safe-area-view` / `/reference/components/view` / `/reference/components/scroll-view` を参照
- `/guides/writing-your-first-spec`: 「リストの作り方」節から `/reference/components/collection`
- `/guides/navigation`: 「タブバー」節から `/reference/components/tab-view`

---

## 5. 実装チェックリスト

- [ ] `docs/data/attribute-overrides/view.json`
- [ ] `docs/data/attribute-overrides/safeareaview.json`
- [ ] `docs/data/attribute-overrides/scrollview.json`
- [ ] `docs/data/attribute-overrides/collection.json`
- [ ] `docs/data/attribute-overrides/tabview.json`
- [ ] plan 14 スクリプト再実行
- [ ] `jui g project --file` 実行
- [ ] クロスリンク追加
- [ ] `jui build` 0 warnings
- [ ] `jui verify --fail-on-diff`
- [ ] `jsonui-localize`

---

## 6. セッション分割の推奨境界

- **分割 A**: View / SafeAreaView（基礎 2 点、2 時間）
- **分割 B**: ScrollView / Collection（リスト 2 点、3 時間）
- **分割 C**: TabView（1 点、1 時間）
