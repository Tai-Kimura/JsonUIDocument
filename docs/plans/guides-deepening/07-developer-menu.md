# 07 · developer-menu 新設

作成日: 2026-04-24
ステータス: 確定（user 判断 5 点反映済み）

## User 判断の反映（2026-04-24）

1. ✅ ガイド URL = `/guides/developer-menu`、英語 displayName = `"Developer menu"`、日本語 = `"開発メニュー"`。
2. ✅ CodeBlock の言語タグ対応調査済み：`CodeBlock.tsx:78-79` の `PRELOADED_LANGUAGES` に `swift` / `kotlin` 両方含まれている。Shiki の `github-dark` テーマでハイライトされる。追加作業不要。
3. ✅ スクリーンショット添付なし（本文のみ）。
4. ✅ 既存 `/guides/navigation` と `/guides/writing-layouts` の next-reads に `developer-menu` を差し込む（詳細は後述 Phase 2）。
5. ✅ Sidebar / GuidesIndex に platform badge UI を追加（**Phase 0** として先行実装）。scope は後述。

## 背景

iOS (`SwiftJsonUI`) と Android (`KotlinJsonUI`) には、アプリ root に被せて使うデバッグコンテナ `DeveloperMenuContainer` が存在する。DEBUG ビルドでのみ有効になり、次の 2 つのジェスチャを提供する:

- **Double tap** — 全画面一覧シートを開き、任意の画面にジャンプ
- **Long press** — Dynamic Mode（JSON ホットリロード）の ON/OFF を切替（ON にすると `jui hotload listen` から配信される layout を反映）

Release ビルドや `enabled: false` 指定時はジェスチャが無効化され、素の content がそのまま描画される。

実装例は `whisky-find-agent` の iOS / Android クライアントに既にある:
- iOS: `client/whisky-find-agent-ios/whisky-find-agent/whisky_find_agentApp.swift:177-258`
- Android: `client/whisky-find-agent-android/app/src/main/kotlin/com/tanosys/whisky_find_agent/MainActivity.kt:350-360`

ライブラリ本体:
- iOS: `SwiftJsonUI/Sources/SwiftJsonUI/Classes/SwiftUI/DeveloperMenu/DeveloperMenuContainer.swift`（`DeveloperScreen: Hashable { var name: String }` プロトコル + `@Binding currentScreen` + `screens: [Screen]` + `enabled` + content closure）
- Android: `KotlinJsonUI/library/src/main/kotlin/com/kotlinjsonui/core/DeveloperMenuContainer.kt`（`DeveloperScreen { val displayName: String }` インターフェース + `currentScreen: T` + `onScreenChange: (T) -> Unit` + `enabled` + composable content）

これを解説するページがドキュメントサイトに無い。

## ゴール

ガイド `/guides/developer-menu` を追加し、**iOS / Android で `DeveloperMenuContainer` をアプリ root に組み込むための最短経路** を 1 ページで網羅する。

- `DeveloperScreen` プロトコル/インターフェース準拠のさせ方
- iOS の SwiftUI App での配線（`@State` + `$currentScreen` Binding + content closure）
- Android の Compose App での配線（`NavController` の backstack から `currentScreen` を派生し、`onScreenChange` で `navController.navigate` を呼ぶ）
- Dynamic Mode トグルの挙動と `jui hotload listen` との関係
- Release ビルド時の安全性（`enabled = DEBUG` パターンと、ライブラリ側の `#if DEBUG` / `isDynamicModeAvailable` ガード）
- よくあるハマりどころ（ジェスチャ衝突 / enum 値の displayName / Android で backstack を popUpTo する理由 等）

## スコープ確定（A 採用）

独立ガイドページ `/guides/developer-menu` として 1 ページ追加。既存 6 ガイドの「1 トピック = 1 ページ」を踏襲。

## Non-goals

- **Web (React)** は対象外。`ReactJsonUI` には `DeveloperMenuContainer` の等価物が無い（ライブラリ本体を grep して不存在を確認済み）。ガイド本文でも「Web は対象外」と 1 行で明記する。
- `ViewSwitcher` / `DynamicModeManager` / `HotLoader` の内部 API を深追いしない。Dynamic Mode の説明は「ホットリロードの ON/OFF」というユーザー視点に留め、詳細は `/guides/writing-layouts` の future の hotload 節や別記事に委ねる（現状未執筆）。
- `jui init` の wizard で `DeveloperMenuContainer` を App template に勝手に差し込む挙動の変更は本 plan の範囲外（ライブラリ側の話）。
- Flutter / その他プラットフォームは現状未対応。

## 共通原則（00-overview + 06-writing-layouts から踏襲）

- Spec-first: `docs/screens/json/guides/developer-menu.spec.json` を先に書いて `jui doc validate spec` pass。
- CodeBlock を積極活用。すべてのコード例は実在リポ（`SwiftJsonUI` / `KotlinJsonUI` / `whisky-find-agent`）から抜粋。擬似コード禁止。
- `jui build` zero warnings / `jui verify --fail-on-diff` を通過で完了。
- en/ja 両方同時更新。
- 新規 custom component は導入しない（CodeBlock + Label + View 縛り）。

---

## 実装現実（調査済み事実）

### 事実 1 — プロトコル/インターフェースの差

iOS と Android でほぼ同じ責務だが、メンバ名が違う:

| | iOS (SwiftJsonUI) | Android (KotlinJsonUI) |
|---|---|---|
| 型 | `protocol DeveloperScreen: Hashable` | `interface DeveloperScreen` |
| 表示名 | `var name: String` | `val displayName: String` |
| パス | `Sources/.../DeveloperMenu/DeveloperMenuContainer.swift:15-17` | `library/.../core/DeveloperMenuContainer.kt:17-19` |

whisky-find-agent の iOS では `enum Screen: String, CaseIterable, DeveloperScreen` で `var name: String { rawValue }` を実装。Android では `enum class Screen : DeveloperScreen` で `override val displayName: String get() = this.name` を実装（`this.name` は Kotlin enum の builtin property）。

### 事実 2 — container のシグネチャ差

iOS:
```swift
DeveloperMenuContainer(
    currentScreen: $currentScreen,   // SwiftUI.Binding
    screens: Screen.allCases,
    enabled: developerMenuEnabled
) { screen in
    switch screen { ... }             // 画面ごとの SwiftUI View
}
```

Android:
```kotlin
DeveloperMenuContainer(
    currentScreen = currentScreen,          // plain value, not a delegate
    screens = Screen.entries,
    onScreenChange = { screen ->            // callback, not a Binding
        navController.navigate(NavRoutes.fromScreen(screen)) { ... }
    },
    enabled = developerMenuEnabled
) { _ ->
    NavHost(navController = navController, startDestination = ...) { ... }
}
```

**重要な差**: iOS は `@Binding` で一方向に `currentScreen` を書き換えるだけだが、Android は `NavController` が backstack を所有しているので:
- `currentScreen` は backstack の先端から `NavRoutes.toScreen(route)` で都度派生する（派生関数は `MainActivity.kt:184-220` の `fun toScreen(route: String?)`）
- 画面選択は `onScreenChange` callback を経由して `navController.navigate(...)` を呼ぶ（`MainActivity.kt:354-358`）

### 事実 3 — Release ビルド時の挙動

iOS:
- `#if DEBUG` で全部くくられている。
- DEBUG かつ `enabled == false` → content のみ。
- DEBUG かつ `enabled == true` → ジェスチャ + Snackbar + Sheet。
- 非 DEBUG（Release）→ そもそも else 分岐で `content(currentScreen)` のみ。

Android:
- `DynamicModeManager.isDynamicModeAvailable`（StateFlow）が false になると早期 return して content のみ。
- `enabled == false` でも早期 return。
- ライブラリの `BuildConfig.DEBUG` ではなく **ホストアプリ側** の DEBUG 判定に寄せている（`library/.../DynamicModeManager.kt` を要確認、この plan では「ホストアプリの debug フラグ」とだけ書く）。

whisky-find-agent の iOS では `private let developerMenuEnabled = true`（常時 true — iOS は `#if DEBUG` が包むので Release でも安全）。Android では `val developerMenuEnabled = BuildConfig.DEBUG`（`MainActivity.kt:300`）で厳密にガード。ガイドでは **Android 側の `BuildConfig.DEBUG` を明示的に渡すパターンを推奨** として書く。

### 事実 4 — Dynamic Mode の意味

- 長押しで ON/OFF トグル、Snackbar で現在状態を通知。
- iOS: `ViewSwitcher.setDynamicMode(Bool)` → `ViewSwitcher.shared.isDynamic` が `@ObservedObject` 経由で content の `.id(viewSwitcher.isDynamic)` に反映されて強制 re-render。
- Android: `DynamicModeManager.setDynamicModeEnabled(context, Boolean)` → `isDynamicModeEnabled` StateFlow が `key(isDynamicModeEnabled) { content(currentScreen) }` で content を再生成。
- ON の時、`HotLoader`（iOS）/ `HotReloadManager`（Android）が listen している JSON を消費。`jui hotload listen` との関係は別記事に誘導し、このガイドでは「長押しすれば ON/OFF」の挙動だけ説明する。

whisky-find-agent の iOS は init で `HotLoader.instance.isHotLoadEnabled = true` をセット済み（`whisky_find_agentApp.swift:170`）。Android は `DynamicModeManager.setDynamicModeEnabled(this, false)` を onCreate で初期化（`MainActivity.kt:296`）。

### 事実 5 — ジェスチャのレイヤ構造

iOS は `.simultaneousGesture(LongPressGesture)` と `.simultaneousGesture(TapGesture(count: 2))` を両方同時に content に乗せている。simultaneousGesture なので content 側のタップ / スクロールを潰さない。ただし content 側が別の `.onLongPressGesture` を使うと二重解釈される可能性あり（pitfall 節で記述）。

Android は `Modifier.pointerInput(Unit) { detectTapGestures(onDoubleTap = {...}, onLongPress = {...}) }` を Scaffold の modifier に差し込む。こちらは **content に pointer event が通る前に gesture detector が先に拾う** 構造になる（Scaffold は root なので）。content 側が Scrollable を使っていても detectTapGestures は tap / long press / double tap のみ検出なので、スクロール自体とは競合しない。

### 事実 6 — Sheet / Dialog UI の差

iOS はネイティブ `.sheet(isPresented:)` + `.presentationDetents([.medium])` で半モーダル。ライブラリ内で `DeveloperMenuSheet` View を内製。

Android は `AlertDialog` + `Column` で全スクリーン一覧を垂直並べ。ライブラリ内で `DeveloperMenuDialog` Composable を内製。

両方とも「現在の画面に ●、その他に ○」で表示し、Dynamic Mode トグルも同じシートに置く。UX が概ね揃っているので、ガイドではスクリーンショット 2 枚（iOS / Android）を並べるのが望ましい。本 plan では追加 CodeBlock で示すに留め、スクリーンショット追加は後続 iteration に回す（画像 asset 周りの運用を固めてから）。

---

## Phase 0 — Platform badge 基盤（先行実装）

`/guides/developer-menu` は iOS + Android 限定。Web 非対応であることを読者が **ページを開く前に** 認識できるよう、Sidebar と GuidesIndex の両方に platform badge を出す仕組みを入れる。developer-menu の導入と同時に basis を作り、他のプラットフォーム限定ガイドが将来来た時にも使い回せる形にする。

### データ形状の拡張

**`NAV_CATALOG` entry** (`ChromeViewModel.ts`):

```ts
// before
{ id, titleKey, url }
// after
{ id, titleKey, url, platforms?: Array<"ios" | "android" | "web"> }
```

**`SidebarEntry` interface** (同じく `ChromeViewModel.ts`):

```ts
// after
interface SidebarEntry {
  id: string;
  label: string;
  url: string;
  platforms?: Array<"ios" | "android" | "web">;  // 未指定 = 表示なし（既存の挙動と互換）
}
```

**`GuidesIndexViewModel.ts` の `CATALOG`** と `ArticleCell` interface も同様に `platforms?: Array<...>` を追加。

### Sidebar custom component の拡張

`Sidebar` 自体は custom component（converter 経由）。該当コンバータを grep で位置特定:

- Converter Ruby: `jsonui-doc-web/rjui_tools/lib/react/converters/extensions/sidebar_converter.rb`
- React 実体: `jsonui-doc-web/src/components/extensions/Sidebar.tsx`
- Attribute def: `jsonui-doc-web/rjui_tools/lib/react/converters/extensions/attribute_definitions/Sidebar.json`
- Spec: `docs/components/json/sidebar.component.json`

`entries[n]` prop の shape に `platforms?: string[]` を追加するのは spec 変更を伴うので、以下の順で実装:

1. `docs/components/json/sidebar.component.json` の `props` / `slots` の `entry` data shape に `platforms?: String[]` を追加（optional なので既存利用箇所は壊さない）。
2. `attribute_definitions/Sidebar.json` を同期（`jui build` が自動で回復するか、手動か確認）。
3. `sidebar_converter.rb` を必要なら更新（attribute pass-through なら無変更で済む）。
4. `Sidebar.tsx` の entry 行レンダラに platforms 表示を追加。スタイルは既存の `reference_platform_badge` cell と合わせる：small pill, `bg-slate-700` / `text-slate-300`、iOS/Android/Web のラベル。entry の右側に inline-flex で並べる。ラベル幅が窮屈になりそうなら icon (i/a/w) のみ表示する branch も用意。

### GuidesIndex カード cell の拡張

`learn_article_card.json` cell の data block に `platforms` 文字列（カンマ区切り or platform 配列）を追加。既存 6 ガイドは `platforms = ""` で既存挙動を保持し、developer-menu は `"iOS · Android"` を埋める。

小差分で済ませるため、**ラベル string を cell に直接渡す運用**を採用（`platforms` を配列にしない）:

```ts
// ArticleCell interface (GuidesIndexViewModel.ts)
interface ArticleCell {
  ...
  platforms: string;        // "" or "iOS · Android" — 空なら表示なし
}
```

Cell 側 ([learn_article_card.json]):

- data block に `{ name: "platforms", class: "String", defaultValue: "" }` を追加
- タイトル行の下、description より前に小さな pill を 1 つ:
  ```json
  { "type": "Label", "width": "wrapContent", "topMargin": 6, "paddings": [2,8,2,8], "fontSize": 11, "fontColor": "#475467", "background": "#E5E7EB", "cornerRadius": 999, "text": "@{platforms}", "visibility": "@{platforms === '' ? 'gone' : 'visible'}" }
  ```
  **注**: 上記 `visibility` 三項は rjui の eval 対応状況に依存する。eval 非対応なら VM 側で `platformsVisibility: "gone" | "visible"` を計算して cell に渡す方式に切り替え（writing-layouts guide の pitfall 節で説明した `"gone"` の DOM 排除挙動を利用）。

### Phase 0 の検証ゲート

- `jui build` zero warnings — Sidebar の spec 変更が既存 consumer を壊していないこと
- `jui verify --fail-on-diff` no drift
- `/` (Home) と `/guides` で既存 6 ガイドが badge なしで表示される（regression なし）
- `/guides/developer-menu` を追加する **前** に Phase 0 を merge することで、Phase 1 の implementation でスタイル議論が発生しないようにする

### Phase 0 の作業量

- sidebar.component.json + attribute def + Sidebar.tsx: 0.7h
- learn_article_card cell: 0.2h
- ChromeVM + GuidesIndexVM の shape 更新 + 既存エントリに `platforms: undefined` 明示: 0.3h
- 動作確認 + regression check: 0.3h
- 計 **~1.5h**

---

## 新ガイドの構造

### Meta

- `metadata.name`: `"DeveloperMenu"` (PascalCase)
- `metadata.displayName`: `"Developer menu"` / 日本語 `"開発メニュー"`
- `metadata.platforms`: `["web"]`（**docs サイトのレンダリング先は web なので `["web"]`**。記事のトピックが iOS/Android なのとは独立。writing-layouts.spec.json と同じ扱い）
- `metadata.layoutFile`: `"guides/developer-menu"`
- `metadata.createdAt`: `"2026-04-24"`
- 読了目安: **~10 min read** / 約 10 分（7 ガイドの中では短めの方）

### TOC / sections（7 項目）

1. **What it is** — `section_overview`
   - DEBUG-only container。
   - 2 ジェスチャ（double tap = 画面一覧 / long press = Dynamic Mode トグル）。
   - Release ビルド / `enabled: false` では完全 pass-through。
   - iOS + Android 対応、Web は非対応。
   - CodeBlock なし（prose + bullet のみ）。

2. **Conform your Screen enum to DeveloperScreen** — `section_conform`
   - iOS: `protocol DeveloperScreen: Hashable { var name: String { get } }`。
   - Android: `interface DeveloperScreen { val displayName: String }`。
   - **プロパティ名の違い** を並列で示す（iOS = `name`, Android = `displayName`）。
   - CodeBlock 1 (swift): `enum Screen: String, CaseIterable, DeveloperScreen { case splash = "Splash"; var name: String { rawValue } }`（whisky-find-agent から抜粋）。
   - CodeBlock 2 (kotlin): `enum class Screen : DeveloperScreen { Splash, Login, ...; override val displayName: String get() = this.name }`（whisky-find-agent から抜粋）。
   - 補足 bullet: iOS は `Hashable` 要求、Android は enum class で自動 equals があるので特別な implement 不要。

3. **iOS — wrap your App in DeveloperMenuContainer** — `section_ios`
   - `@State private var currentScreen: Screen = .splash` を持つ。
   - `WindowGroup { DeveloperMenuContainer(currentScreen: $currentScreen, ...) { screen in switch screen { ... } } }` のパターン。
   - content closure の `switch screen` 分岐で各 SwiftUI View を返す。各 View が `onNavigate: (Screen) -> Void` で `currentScreen = .foo` を書き換える。
   - CodeBlock (swift): whisky-find-agent の `whisky_find_agentApp.swift:97-258` から抜粋（長いので splash/login/registration の 3 case くらいで省略）。
   - 補足 bullet:
     - `Screen.allCases` が screens 引数。`CaseIterable` 必須。
     - `$currentScreen` は `@State` の Binding。ネストした View から書き換えると再描画される。
     - content closure の switch は **exhaustive** にすること（漏れると SwiftUI のコンパイルエラー）。

4. **Android — wrap your setContent in DeveloperMenuContainer** — `section_android`
   - `rememberNavController()` で NavController を作り、`currentBackStackEntryFlow` から現在 route を監視、`NavRoutes.toScreen(route)` で `currentScreen` を派生。
   - `DeveloperMenuContainer(currentScreen = currentScreen, screens = Screen.entries, onScreenChange = { screen -> navController.navigate(NavRoutes.fromScreen(screen)) { popUpTo(...) } }, enabled = BuildConfig.DEBUG) { _ -> NavHost(...) { ... } }` の形。
   - content は `NavHost` を丸ごと入れる。container 側の引数 `_` は使わない（Android は NavController が screen を所有するため）。
   - CodeBlock (kotlin): `MainActivity.kt:293-360` から抜粋（NavHost の中身は別ガイド `/guides/navigation` に誘導するため 1 行省略）。
   - 補足 bullet:
     - `Screen.entries` は Kotlin 1.9+ の enum values API（古い SDK なら `Screen.values().toList()`）。
     - `popUpTo(NavRoutes.CHAT_SIMPLE) { inclusive = false }` のように backstack を削ってから navigate する理由（dev menu からランダムにジャンプしても backstack が肥大化しないよう）。
     - `enabled = BuildConfig.DEBUG` を明示する。ライブラリ側でも二重ガードがあるが、プロジェクトの `BuildConfig.DEBUG` を通すのが最も確実。

5. **Dynamic Mode toggle (long press)** — `section_dynamic_mode`
   - 長押し → ON/OFF トグル → Snackbar で状態通知。
   - iOS: `ViewSwitcher.setDynamicMode(Bool)` で切替、`ViewSwitcher.shared.isDynamic` 監視。
   - Android: `DynamicModeManager.setDynamicModeEnabled(context, Bool)` で切替、`isDynamicModeEnabled` StateFlow 監視。
   - ON の時、JSON ホットリロード（`jui hotload listen` 経由の layout 配信）を受ける。詳細は hotload 節へ誘導。
   - CodeBlock (swift): `HotLoader.instance.isHotLoadEnabled = true` + `ViewSwitcher.setDynamicMode(false)` の init 例（whisky-find-agent `whisky_find_agentApp.swift:168-171` から抜粋）。
   - CodeBlock (kotlin): `DynamicModeManager.setDynamicModeEnabled(this, false)` の onCreate 例（whisky-find-agent `MainActivity.kt:296` から抜粋）。
   - 補足 bullet: 開発中に JSON を変えた瞬間に画面が切り替わる、Simulator で手動 reload 不要、Layout JSON の構文エラーは起動時ログに出る。

6. **Release builds and the enabled flag** — `section_release`
   - iOS はライブラリ内で `#if DEBUG` ガード、Release では content をそのまま返す。
   - Android はホストアプリの debug 判定（`DynamicModeManager.isDynamicModeAvailable` が false なら即 return）。
   - 推奨パターン: **`enabled = DEBUG` を明示的に渡す**。二重ガードで安全性が上がるし、QA/Stage ビルドで切りたい場合にも対応できる。
   - CodeBlock (swift): `private let developerMenuEnabled = true`（DEBUG 前提ならこれで OK、`#if DEBUG` の外で使いたいなら `#if DEBUG` + `true` / `#else` + `false` の条件定義にする）。
   - CodeBlock (kotlin): `val developerMenuEnabled = BuildConfig.DEBUG`。
   - 注意: Dev menu が本番ビルドに残ってしまうと、ユーザーが偶然長押ししてホットリロード ON にした瞬間に（未配信なので）何も起きないだけで済むが、**double tap で sheet が開き全画面一覧が見える**のは情報漏洩になりうる。`enabled = BuildConfig.DEBUG` を省略しないこと。

7. **Common pitfalls** — `section_pitfalls`
   - bullet 5 本:
     - **iOS の content closure が non-exhaustive** → コンパイルエラーで気づくが、Swift の `@unknown default` を `enum` に対して使えないので `default:` を必ず書く。
     - **Android の `currentScreen` を間違って `var` 化して手で書き換え** → NavController の state と二重管理になる。必ず `navController.currentBackStackEntry.destination.route` から **派生** させる。
     - **`enabled = BuildConfig.DEBUG` を忘れる** → Release ビルドに dev menu が残る。iOS は `#if DEBUG` で守られるが、Android は `enabled = true` を素で渡すとホスト debug フラグ次第で残る可能性（ライブラリの `isDynamicModeAvailable` 判定ロジックをホスト側に委ねるため）。
     - **content 内部で独自の `onLongPressGesture` を使っている** → iOS は `simultaneousGesture` なので競合はしないが、意図しないタイミングで Dynamic Mode トグルが発火する可能性。ScrollView の中で長押しメニューを使うような UI では、dev menu が unexpectedly fire する → content 側の long press を短く（0.3s 等）しつつ dev menu の `LongPressGesture(minimumDuration: 0.5)` の方を長めにするか、専用 UI では `enabled: false` にして回避。
     - **DeveloperScreen の `name` / `displayName` を空文字にしている** → sheet/dialog の行に何も表示されず screen を選べなくなる。必ず人間可読な文字列を返す。enum の `rawValue` を使うのが最短。

### next-reads（2 card）

- `/guides/navigation` → "Wiring the navigation layer the dev menu drives into"
- `/guides/writing-layouts` → "Authoring the JSON that Dynamic Mode hot-reloads"

### Phase 2 — 既存ガイドからの相互リンク（本 plan に含める）

user 判断 4 で「任せる」との指示を受け、以下を本 plan に組み込む:

**Sidebar + GuidesIndex（必須）:**
- `ChromeViewModel.ts` の `NAV_CATALOG.guides.entries` に `{ id: "developer-menu", titleKey: "guides_developer_menu_title", url: "/guides/developer-menu", platforms: ["ios", "android"] }` を `custom-components` の後に追加
- `GuidesIndexViewModel.ts` の `CATALOG` にも同じ entry を 1 行追加（`platforms: "iOS · Android"` を string で埋める、Phase 0 の方針に合わせる）

**既存 2 guide の next-reads に差し込み:**
- `/guides/navigation` の next-reads を既存 2 枚のうち 1 枚を `developer-menu` に差し替え。候補は後続で決めるが、navigation → developer-menu が最も文脈的に繋がるので、現 next-reads のうち 1 枚（たとえば testing）を押し出して developer-menu を入れる。
  - `NavigationViewModel.ts` の `onAppear` で `nextReads` 配列を更新
  - strings.json の `guides_navigation` namespace に `next_developer_menu_title` / `next_developer_menu_description` を追加
- `/guides/writing-layouts` の next-reads も同様に 1 枚差し替え。現状 `next_custom_components` + `next_first_spec` なので、`next_first_spec` を残して `next_custom_components` を `developer-menu` に置換するのが自然（developer-menu は hotload の話を含むので writing-layouts の読者が次に欲しい情報に近い）。
  - `WritingLayoutsViewModel.ts` の `onAppear`
  - strings.json の `guides_writing_layouts` namespace に `next_developer_menu_title` / `next_developer_menu_description` を追加

**除外:**
- `custom-components` の next-reads は触らない（custom-components → developer-menu は飛躍が大きい）
- `writing-your-first-spec` の next-reads も触らない（first-spec は新規読者向けで DEBUG tool 誘導は時期尚早）
- `testing` / `localization` の next-reads は触らない（関連が弱い）

---

## 変更対象ファイル

### Phase 0（platform badge 基盤）

**編集:**
- `docs/components/json/sidebar.component.json` — entry shape に `platforms?: String[]` を追加
- `jsonui-doc-web/rjui_tools/lib/react/converters/extensions/attribute_definitions/Sidebar.json` — 同期（`jui build` が回復する想定、ずれたら手動）
- `jsonui-doc-web/rjui_tools/lib/react/converters/extensions/sidebar_converter.rb` — pass-through で済むなら無変更、必要に応じて
- `jsonui-doc-web/src/components/extensions/Sidebar.tsx` — entry 行に platform pill のレンダリングを追加
- `docs/screens/layouts/cells/learn_article_card.json` — data block に `platforms` を追加、card 内に pill Label を配置
- `jsonui-doc-web/src/viewmodels/ChromeViewModel.ts` — `NAV_CATALOG` entry shape に `platforms?` 追加、`SidebarEntry` に `platforms?` 追加、`buildNavItems()` で pass-through
- `jsonui-doc-web/src/viewmodels/GuidesIndexViewModel.ts` — `ArticleCell` に `platforms: string` 追加、`CATALOG` の shape 拡張

### Phase 1（developer-menu guide 本体）

**新規作成:**
- `docs/screens/json/guides/developer-menu.spec.json`
- `docs/screens/layouts/guides/developer-menu.json`（source of truth、hand-edit）
- `jsonui-doc-web/src/viewmodels/guides/DeveloperMenuViewModel.ts`
- `jsonui-doc-web/src/hooks/guides/useDeveloperMenuViewModel.ts`
- `jsonui-doc-web/src/app/guides/developer-menu/page.tsx`

**編集:**
- `docs/screens/layouts/Resources/strings.json` — `guides_developer_menu` namespace を追加（~55 keys × en/ja）
- `jsonui-doc-web/src/viewmodels/ChromeViewModel.ts` — `NAV_CATALOG.guides.entries` に `{ id: "developer-menu", ..., platforms: ["ios", "android"] }` を追加
- `jsonui-doc-web/src/viewmodels/GuidesIndexViewModel.ts` — `CATALOG` に 1 行追加（`platforms: "iOS · Android"`）

### Phase 2（cross-link）

**編集:**
- `jsonui-doc-web/src/viewmodels/guides/NavigationViewModel.ts` — next-reads 1 枚を developer-menu に差し替え
- `jsonui-doc-web/src/viewmodels/guides/WritingLayoutsViewModel.ts` — next-reads の `next_custom_components` を `next_developer_menu` に差し替え
- `docs/screens/layouts/Resources/strings.json` — `guides_navigation` と `guides_writing_layouts` の namespace に `next_developer_menu_title` / `next_developer_menu_description` を追加（en/ja）

**触らない:**
- `.jsonui-doc-rules.json` — 新 custom component を追加しないので変更不要
- `jui.config.json` — 設定変更なし
- 他 4 guide（writing-your-first-spec / testing / localization / custom-components）の spec / layout / strings

---

## strings.json 新設キー（`guides_developer_menu` namespace）

大きな塊（全部で ~55 entries × 2 lang）:

- 共通: `breadcrumb`, `title`, `lead`, `read_time`, `next_heading`, `footer_copyright`, `toc_title`
- Section 1 (overview): `section_overview_heading`, `section_overview_body`, `section_overview_bullet_doubletap`, `section_overview_bullet_longpress`, `section_overview_bullet_release`, `section_overview_bullet_platforms`
- Section 2 (conform): `section_conform_heading`, `section_conform_body`, `section_conform_bullet_ios`, `section_conform_bullet_android`
- Section 3 (ios): `section_ios_heading`, `section_ios_body`, `section_ios_bullet_allcases`, `section_ios_bullet_binding`, `section_ios_bullet_exhaustive`
- Section 4 (android): `section_android_heading`, `section_android_body`, `section_android_bullet_entries`, `section_android_bullet_popupto`, `section_android_bullet_buildconfig`
- Section 5 (dynamic_mode): `section_dynamic_mode_heading`, `section_dynamic_mode_body`, `section_dynamic_mode_bullet_toggle`, `section_dynamic_mode_bullet_hotload`, `section_dynamic_mode_bullet_error`
- Section 6 (release): `section_release_heading`, `section_release_body`, `section_release_bullet_ios`, `section_release_bullet_android`, `section_release_bullet_warning`
- Section 7 (pitfalls): `section_pitfalls_heading`, `section_pitfalls_body`, `section_pitfalls_bullet_exhaustive`, `section_pitfalls_bullet_dualstate`, `section_pitfalls_bullet_buildconfig`, `section_pitfalls_bullet_gesture`, `section_pitfalls_bullet_displayName`
- next-reads: `next_navigation_title/description`, `next_writing_layouts_title/description`
- TOC: 7 × `toc_row_*`

CodeBlock 内容は strings.json 外、layout JSON 内に直接 literal で埋める（既存 6 ガイドと同じ運用）。

### 新設キー — 既存 guide 側への追加

cross-link のため `next_developer_menu_title` / `next_developer_menu_description` を以下 namespace にも追加（後続 iteration の option、本 plan では扱わない）:
- `guides_navigation`
- `guides_writing_layouts`

---

## 実装順

### Phase 0 — Platform badge 基盤

1. `docs/components/json/sidebar.component.json` の entry shape に `platforms?: String[]` を追加
2. `jui doc validate spec` で spec 変更を validate
3. `jui build` で `attribute_definitions/Sidebar.json` を再生成 → 差分確認
4. `Sidebar.tsx` に platform pill レンダラを追加（iOS / Android / Web のラベル）
5. `learn_article_card.json` cell の data block に `platforms` を追加、pill Label を配置
6. `ChromeViewModel.ts` / `GuidesIndexViewModel.ts` の catalog shape 拡張、既存全 entry に `platforms` 未指定（undefined）が通ることを確認
7. `jui build` zero warnings / `jui verify --fail-on-diff` no drift / 既存ページ regression check

### Phase 1 — developer-menu guide 本体

8. `jui doc init spec --name DeveloperMenu` で spec skeleton
9. spec を編集し `jui doc validate spec` pass
10. strings.json に `guides_developer_menu` namespace を追加（en/ja 両方）
11. layout JSON を `docs/screens/layouts/guides/developer-menu.json` に書き下ろす
    - 既存 guide (writing-layouts.json) を template にコピー → 7 section を置き換え
    - CodeBlock を 7〜8 本埋め込み（`language: "swift"` / `language: "kotlin"`）
12. ViewModel (`DeveloperMenuViewModel.ts`) 作成 — nextReadLinks の catalog を定義（writing-layouts VM をコピーベース）
13. Hook (`useDeveloperMenuViewModel.ts`) 作成
14. page.tsx を `src/app/guides/developer-menu/page.tsx` に作成
15. `NAV_CATALOG.guides.entries` と `GuidesIndexViewModel.CATALOG` に developer-menu の行を追加（`platforms: ["ios", "android"]` / `"iOS · Android"`）
16. `jui build` → zero warnings 確認
17. `jui verify --fail-on-diff` → no drift 確認
18. `/guides/developer-menu` をブラウザで目視確認（en/ja 両方）
19. Sidebar と Guides index で iOS / Android badge が表示されることを確認

### Phase 2 — cross-link

20. `guides_navigation` namespace に `next_developer_menu_title/description` を追加、`NavigationViewModel.ts` の `nextReads` を更新
21. `guides_writing_layouts` namespace に `next_developer_menu_title/description` を追加、`WritingLayoutsViewModel.ts` の `nextReads` を更新
22. `/guides/navigation` と `/guides/writing-layouts` を目視で next-reads 表示確認
23. `jui build` / `jui verify --fail-on-diff` 再走

各 Phase 間で git diff を確認し、他セッションが触っている範囲（learn-track 周辺）に干渉しないこと。Phase を分けて commit することで blast radius を小さく保つ。

---

## 検証ゲート

- `jui doc validate spec --file docs/screens/json/guides/developer-menu.spec.json` → is_valid true
- `jui build` → zero warnings（他セッション由来 warning は既知なので区別して報告）
- `jui verify --fail-on-diff` → no drift
- Browser で 7 section + TOC + next-reads が正しく表示
- 日本語 / 英語の切替で両方表示される（`StringManager.setLanguage('ja')` で確認）
- CodeBlock の swift / kotlin が copy 可能で改行維持されている
- Sidebar で Guides セクションに "Developer menu" / "開発メニュー" が表示される
- Guides index (/) で Developer menu カードが表示されクリックで遷移する

---

## 作業見積り

| Phase | 内訳 | 時間 |
|---|---|---|
| Phase 0 | sidebar spec + converter + React + cell + VM shape | ~1.5h |
| Phase 1 | spec / VM / hook / page.tsx | ~0.5h |
| Phase 1 | layout JSON + CodeBlock 埋め込み（swift/kotlin） | ~1.5h |
| Phase 1 | strings.json ~55 keys × 2 lang = 110 entries | ~2h |
| Phase 1 | Sidebar / GuidesIndex 追加 + 動作確認 | ~0.3h |
| Phase 1 | build / verify / ブラウザ確認 + fix loop | ~1h |
| Phase 2 | cross-link 2 箇所（strings + VM） | ~0.5h |
| **計** | | **~7.3h** |

---

## 補足：本 plan で閉じていない事項

全て user 判断 1〜5 で closed した上で、以下は **実装中に検出した場合のみ対応** とする:

- **Sidebar custom component 拡張時に converter scaffolding の更新が必要か** — Phase 0 で `jui build` を走らせた後 `attribute_definitions/Sidebar.json` が自動同期するか確認し、同期されなければ手動追記。ライブラリ側のバグであれば報告 (`jsonui-cli/docs/bugs/`) に回す。
- **Rjui の `visibility` 三項 eval 対応** — Phase 0 の learn_article_card cell で `visibility: "@{platforms === '' ? 'gone' : 'visible'}"` が動かなければ、VM 側で `platformsVisibility` を計算する方式にフォールバック。どちらでも動作自体は同じ。
- **iOS の DEBUG gating パターンの推奨形** — whisky-find-agent は `private let developerMenuEnabled = true` と素直に書いているが、本 guide では `#if DEBUG` + `true` / `#else` + `false` の条件定義も紹介するか、素直な例のみにするかは本文執筆時に決める（pitfall 節と重複するため素直版 1 つに絞る方針が有力）。
