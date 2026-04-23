# 23. コンテンツプラン: Reference — メディア・装飾系コンポーネント

> Scope: 3〜5 時間 / 1 セッション。6 コンポーネント（Image, NetworkImage, GradientView, Blur, CircleView, Web）。
> 依存: plan 14, plan 20。

---

## 1. 対象記事

| URL | override JSON | コンポーネント |
|---|---|---|
| `/reference/components/image` | `docs/data/attribute-overrides/image.json` | Image |
| `/reference/components/network-image` | `.../networkimage.json` | NetworkImage |
| `/reference/components/gradient-view` | `.../gradientview.json` | GradientView |
| `/reference/components/blur` | `.../blur.json` | Blur |
| `/reference/components/circle-view` | `.../circleview.json` | CircleView |
| `/reference/components/web` | `.../web.json` | Web |

---

## 2. 各記事の内容

### 2.1 Image

#### description
- en: "Bundled/local image display. Reads from the app's resource bundle (asset catalog on iOS, `res/drawable` on Android, `public/` on Web)."
- ja: "同梱／ローカル画像を表示。アプリの resource bundle（iOS なら asset catalog、Android なら `res/drawable`、Web なら `public/`）から読み込む。"

#### usage
- en: "Use Image for static assets (icons, logos, backgrounds). For remote URLs use NetworkImage. For SF Symbols / Material Icons as text glyphs use IconLabel."
- ja: "静的アセット（アイコン、ロゴ、背景）に使う。リモート URL なら NetworkImage、フォントグリフ（SF Symbols / Material Icons）なら IconLabel を使う。"

#### examples

1. **Minimum** (json)
```json
{
  "type": "Image",
  "source": "logo",
  "width": 120,
  "height": 32
}
```

2. **Aspect-fit** (json)
```json
{
  "type": "Image",
  "source": "hero_banner",
  "width": "matchParent",
  "height": 200,
  "contentMode": "aspectFill"
}
```

3. **Tinted** (json)
```json
{
  "type": "Image",
  "source": "icon_close",
  "width": 24,
  "height": 24,
  "tintColor": "#FFFFFF"
}
```

#### attributes

- `source`:
  - platformDiff:
    - `swift_uikit`: "Asset Catalog の image 名。`@1x/@2x/@3x` 自動解決。"
    - `swift_swiftui`: "同上（`Image(\"name\")`）。"
    - `kotlin_compose`: "`R.drawable.<name>` に解決（ローカル名変換は名前マッパで）。"
    - `kotlin_xml`: "`@drawable/<name>`。"
    - `react`: "`/images/<name>.{png,svg,webp}` を解決。`public/images/` 配下。"

- `contentMode`:
  - note(en): "`aspectFit` / `aspectFill` / `fill` / `center`. Determines how image fits into declared width/height."
  - note(ja): "`aspectFit` / `aspectFill` / `fill` / `center`。画像を指定サイズにどう収めるか。"

- `tintColor`:
  - note(en): "Multiplies RGB channels with given color. Requires monochrome/template image. Ignored for full-color photos."
  - note(ja): "RGB に色を乗算。モノクロ／テンプレート画像が必要で、フルカラー写真では無視される。"

- `cornerRadius`:
  - note(en): "Rounded corners. For circular image, use CircleView wrapping Image, or set to `width/2`."
  - note(ja): "角丸。円形画像は CircleView で囲むか、`width/2` を指定する。"

#### relatedComponents
`["NetworkImage", "IconLabel", "CircleView"]`

---

### 2.2 NetworkImage

#### description
- en: "Image loaded from a URL with automatic caching, placeholder, and error handling."
- ja: "URL から自動的にロードされる画像。キャッシュ・プレースホルダ・エラー時フォールバックを備える。"

#### usage
- en: "Use NetworkImage for all user-generated or CDN-hosted images. Always provide `placeholder` — the first frame is always the placeholder."
- ja: "ユーザー生成や CDN ホストの画像すべてに使う。最初のフレームは必ずプレースホルダになるため、`placeholder` は常に指定する。"

#### examples

1. **Basic with placeholder** (json)
```json
{
  "type": "NetworkImage",
  "url": "@{user.avatarUrl}",
  "placeholder": "avatar_default",
  "errorImage": "avatar_error",
  "width": 48,
  "height": 48,
  "cornerRadius": 24
}
```

2. **Full-bleed with blur placeholder** (json)
```json
{
  "type": "NetworkImage",
  "url": "@{post.imageUrl}",
  "placeholder": "blurhash:LKO2?U%2Tw=w]~RBVZRi};RPxuwH",
  "width": "matchParent",
  "height": 240,
  "contentMode": "aspectFill"
}
```

3. **With progress indicator** (json)
```json
{
  "type": "NetworkImage",
  "url": "@{productImageUrl}",
  "showsLoadingIndicator": true,
  "width": 200,
  "height": 200
}
```

#### attributes

- `url`:
  - note(en): "Absolute or protocol-relative URL. Empty/null shows `placeholder`. Changes trigger re-download (cache-aware)."
  - note(ja): "絶対 URL または protocol-relative URL。空／null では `placeholder` を表示。変更時は再ダウンロード（キャッシュ参照あり）。"

- `placeholder`:
  - note(en): "Local image name or `blurhash:...` string. Displayed during fetch and on error (unless `errorImage` overrides)."
  - note(ja): "ローカル画像名または `blurhash:...` 文字列。fetch 中とエラー時（`errorImage` がなければ）に表示。"

- `errorImage`:
  - note(en): "Displayed on fetch failure. Defaults to `placeholder` if omitted."
  - note(ja): "fetch 失敗時に表示。省略時は `placeholder` を使う。"

- `cachePolicy`:
  - note(en): "`memory` / `disk` / `both` (default) / `none`. `disk` persists across app launches."
  - note(ja): "`memory` / `disk` / `both`（デフォルト） / `none`。`disk` はアプリ再起動後も保持。"

- `fadeInDuration`:
  - note(en): "Seconds for opacity animation on load. `0` = no animation (default 0.3)."
  - note(ja): "ロード完了時の不透明度アニメーション（秒）。`0` でアニメーションなし（デフォルト 0.3）。"

- `showsLoadingIndicator`:
  - note(en): "When `true`, overlays an Indicator during fetch. Default `false`."
  - note(ja): "`true` で fetch 中に Indicator を重ねる。デフォルト `false`。"

#### relatedComponents
`["Image", "Indicator"]`

---

### 2.3 GradientView

#### description
- en: "View with a linear or radial gradient background. Supports 2+ color stops."
- ja: "線形または放射状のグラデーション背景を持つ View。2 色以上の stop に対応。"

#### usage
- en: "Use GradientView for hero banners, card overlays, and any background that needs a smooth color transition. Do not use for solid colors — prefer View with `background`."
- ja: "ヒーローバナー、カードオーバーレイ、スムーズな色遷移が必要な背景に使う。単色背景は `background` 付きの View を使う。"

#### examples

1. **Linear vertical** (json)
```json
{
  "type": "GradientView",
  "direction": "vertical",
  "colors": ["#6366F1", "#8B5CF6"],
  "width": "matchParent",
  "height": 120
}
```

2. **Linear with stops** (json)
```json
{
  "type": "GradientView",
  "direction": "horizontal",
  "colors": ["#FBBF24", "#F59E0B", "#EF4444"],
  "stops": [0.0, 0.6, 1.0]
}
```

3. **Radial** (json)
```json
{
  "type": "GradientView",
  "type": "radial",
  "colors": ["#1E1B4B", "#000000"],
  "center": [0.5, 0.3],
  "radius": 1.0
}
```

#### attributes

- `type` (gradient type):
  - note(en): "`linear` (default) / `radial` / `conic`. `conic` is Web-only; falls back to `radial` on mobile with a warning."
  - note(ja): "`linear`（デフォルト） / `radial` / `conic`。`conic` は Web のみ、モバイルでは警告付きで `radial` にフォールバック。"

- `direction` (linear only):
  - note(en): "`horizontal` / `vertical` / `diagonal` / number (degrees). Default `vertical`."
  - note(ja): "`horizontal` / `vertical` / `diagonal` または度数（数値）。デフォルト `vertical`。"

- `colors`:
  - note(en): "Array of 2+ color strings. Evenly distributed unless `stops` is provided."
  - note(ja): "2 色以上の文字列配列。`stops` 未指定なら等分配分。"

- `stops`:
  - note(en): "Array of 0.0-1.0 values, same length as `colors`. Each stop is the position where the color peaks."
  - note(ja): "0.0〜1.0 の配列、`colors` と同じ長さ。各 stop は色がピークとなる位置。"

- `center` (radial/conic):
  - note(en): "`[x, y]` in 0.0-1.0 space. Default `[0.5, 0.5]` (center)."
  - note(ja): "`[x, y]` を 0.0〜1.0 空間で指定。デフォルト `[0.5, 0.5]`（中央）。"

#### relatedComponents
`["View", "Blur"]`

---

### 2.4 Blur

#### description
- en: "Applies a Gaussian blur to everything behind this view. Commonly used for frosted-glass effects on iOS."
- ja: "この View の背面にある内容にガウスぼかしをかける。iOS のフロステッドガラス効果に多用。"

#### usage
- en: "Use Blur for translucent overlays (nav bars, modals, glass cards). Place Blur **above** the content it should blur; `radius` controls strength."
- ja: "半透明オーバーレイ（ナビバー、モーダル、ガラスカード）に使う。ぼかしたい内容の**上**に配置し、`radius` で強度を調整。"

#### examples

1. **Glass navbar** (json)
```json
{
  "type": "Blur",
  "style": "light",
  "intensity": 0.8,
  "width": "matchParent",
  "height": 64
}
```

2. **Blurred background with content** (json)
```json
{
  "type": "View",
  "child": [
    { "type": "Image", "source": "hero", "width": "matchParent", "height": "matchParent" },
    { "type": "Blur", "intensity": 0.5 },
    { "type": "Label", "text": "@string/title", "fontColor": "#FFFFFF", "fontSize": 32, "gravity": "center" }
  ]
}
```

#### attributes

- `style`:
  - note(en): "`light` / `dark` / `regular` / `prominent` / `chrome`. Affects color cast."
  - note(ja): "`light` / `dark` / `regular` / `prominent` / `chrome`。ぼかしに乗せる色を決める。"

- `intensity`:
  - note(en): "0.0-1.0. Controls opacity of the blur layer (not blur strength). Use `radius` for strength."
  - note(ja): "0.0〜1.0。ぼかしレイヤーの不透明度（ぼかし強度ではない）。強度は `radius` で指定。"

- `radius`:
  - platformDiff:
    - `swift_uikit`: "`UIVisualEffectView` は固定 radius のため、要 `UIBlurEffectView` 直接操作。"
    - `swift_swiftui`: "`.blur(radius:)` で指定。"
    - `kotlin_compose`: "`.blur(radius.dp)`（Android 12+）。それ以前は警告付き fallback。"
    - `kotlin_xml`: "`RenderScript`（Android 12 以前）または `RenderEffect`（Android 12+）。"
    - `react`: "CSS `backdrop-filter: blur(Xpx)`。"

#### relatedComponents
`["GradientView", "View"]`

---

### 2.5 CircleView

#### description
- en: "Circular container. Equivalent to View with `cornerRadius: width/2`, but ensures perfect circle regardless of height."
- ja: "円形コンテナ。`cornerRadius: width/2` を指定した View と等価だが、高さに関わらず真円を保証。"

#### usage
- en: "Use CircleView for avatars, badges, and circular icons. Always specify equal `width` and `height` (or just `width`; height auto-matches)."
- ja: "アバター、バッジ、円形アイコンに使う。`width` と `height` を同値にする（`width` のみ指定で height 自動一致）。"

#### examples

1. **Avatar with image** (json)
```json
{
  "type": "CircleView",
  "width": 48,
  "child": [
    { "type": "NetworkImage", "url": "@{user.avatarUrl}", "width": 48, "height": 48 }
  ]
}
```

2. **Colored badge with number** (json)
```json
{
  "type": "CircleView",
  "width": 24,
  "background": "#EF4444",
  "child": [
    { "type": "Label", "text": "@{unreadCount}", "fontColor": "#FFFFFF", "fontSize": 12, "gravity": "center" }
  ]
}
```

#### attributes

- `width`:
  - note(en): "Also sets height if height not specified. Must be a fixed numeric value (no `matchParent` / `wrapContent`)."
  - note(ja): "height 未指定時は height も自動設定。数値指定必須（`matchParent` / `wrapContent` は不可）。"

- `background`:
  - note(en): "Same as View. For gradient circles, nest a GradientView inside."
  - note(ja): "View と同じ。グラデーション円なら GradientView をネストする。"

- `borderColor` / `borderWidth`:
  - note(en): "Same as View. Border is rendered on the circle edge, not a rectangular bounds."
  - note(ja): "View と同じ。border は矩形ではなく円周上に描画される。"

#### relatedComponents
`["View", "Image"]`

---

### 2.6 Web

#### description
- en: "Embedded web content via WKWebView (iOS), WebView (Android), `<iframe>` (Web). Used for embedded maps, third-party widgets, HTML previews."
- ja: "WKWebView（iOS）／WebView（Android）／`<iframe>`（Web）による埋め込み Web コンテンツ。埋め込みマップ、サードパーティウィジェット、HTML プレビューなどに使う。"

#### usage
- en: "Use Web only when native components cannot achieve the goal. Prefer native for performance, security, and consistent UX. Always declare CSP / sandbox rules for untrusted URLs."
- ja: "ネイティブコンポーネントでは実現不可能なときのみ使う。パフォーマンス・セキュリティ・UX 一貫性のためネイティブを優先。信頼できない URL には CSP / sandbox を必ず設定。"

#### examples

1. **Embed URL** (json)
```json
{
  "type": "Web",
  "url": "https://www.google.com/maps/embed?pb=@{placeId}",
  "width": "matchParent",
  "height": 300
}
```

2. **Inline HTML** (json)
```json
{
  "type": "Web",
  "html": "<h1>Hello</h1><p>Inline HTML content</p>",
  "baseUrl": "https://assets.example.com/",
  "width": "matchParent",
  "height": 200
}
```

3. **Sandboxed (Web only)** (json)
```json
{
  "type": "Web",
  "url": "@{thirdPartyWidgetUrl}",
  "sandbox": "allow-scripts allow-same-origin",
  "width": "matchParent",
  "height": 400
}
```

#### attributes

- `url`:
  - note(en): "Absolute URL. Changes trigger navigation. Use `html` for inline content instead."
  - note(ja): "絶対 URL。変更で遷移発生。インライン HTML は `html` を使う。"

- `html`:
  - note(en): "Inline HTML string. `baseUrl` must be set to resolve relative paths inside HTML."
  - note(ja): "インライン HTML 文字列。HTML 内の相対パス解決のため `baseUrl` の設定が必要。"

- `baseUrl`:
  - note(en): "Base URL for resolving relative resources referenced in `html`."
  - note(ja): "`html` 内の相対リソースを解決するベース URL。"

- `onMessage`:
  - note(en): "Handler for messages posted from the page via `window.webkit.messageHandlers.jsonui.postMessage` (iOS) / `JsonUI.postMessage` (Android) / `window.parent.postMessage` (Web)."
  - note(ja): "ページ側から `window.webkit.messageHandlers.jsonui.postMessage`（iOS） / `JsonUI.postMessage`（Android） / `window.parent.postMessage`（Web）で送られたメッセージを受けるハンドラ。"

- `allowJavaScript`:
  - note(en): "Default `true`. Set to `false` for trusted-HTML-only embed (blog posts, help content)."
  - note(ja): "デフォルト `true`。信頼 HTML のみ（ブログ記事、ヘルプ）の埋め込みでは `false`。"

- `sandbox` (Web only):
  - note(en): "iframe `sandbox` attribute. `allow-scripts` / `allow-same-origin` / `allow-forms` etc."
  - note(ja): "iframe の `sandbox` 属性。`allow-scripts` / `allow-same-origin` / `allow-forms` など。"

#### relatedComponents
`["View"]`

---

## 3. 必要な strings キー

plan 20 の `ref_section_*` を再利用。追加なし。

---

## 4. クロスリンク追加先

- `/learn/first-screen`: 「画像を入れる」節から `/reference/components/image` / `/reference/components/network-image`
- `/guides/writing-your-first-spec`: 「装飾」節から `/reference/components/gradient-view` / `/reference/components/blur`

---

## 5. 実装チェックリスト

- [ ] `docs/data/attribute-overrides/image.json`
- [ ] `docs/data/attribute-overrides/networkimage.json`
- [ ] `docs/data/attribute-overrides/gradientview.json`
- [ ] `docs/data/attribute-overrides/blur.json`
- [ ] `docs/data/attribute-overrides/circleview.json`
- [ ] `docs/data/attribute-overrides/web.json`
- [ ] plan 14 スクリプト再実行
- [ ] `jui g project --file` 実行
- [ ] クロスリンク追加
- [ ] `jui build` / `jui verify` / `jsonui-localize`

---

## 6. セッション分割の推奨境界

1 セッションで完結可能（6 コンポーネント、全て独立）。
