# 02 · navigation 深堀り

## 現状

4 section: `spec` / `web` / `ios` / `android`。各 section に heading + body Label だけ。CodeBlock 無し。本文（strings.json）は抽象的で、「spec で `userActions` と `transitions` を書く、各 platform の router に流す」程度。

## 実装現実 vs 現在の記述

**最大のギャップ**: ジェネレータは navigation コードを**生成しない**。各 platform で 100% 手書きの router layer が必要。現状の guide はこの重要事実を表に出していない。

### Spec 側（platform-agnostic）

- `userActions[]` — 人の操作と処理のマッピング。`{ action, processing }`。
- `transitions[]` — 遷移 graph。`{ trigger, condition, destination, description, type? }`。
- `type` は platform-specific オプション（`"push"` / `"sheet"` / `"modal"`）。spec には書かないのが無難だが、platform-specific spec（iOS アプリの spec など）では使われる。
- `dataFlow.viewModel.methods` に `onNavigate(url: String)` を宣言するのが **convention**。

### Web (rjui) が生成するもの

`/Users/like-a-rolling_stone/resource/jsonui-cli/rjui_tools/lib/react/data_model_generator.rb`:

```typescript
// src/generated/data/CounterData.ts  — @generated
export interface CounterData {
  // ...
  onNavigate?: (url: string) => void;
}
```

`ViewModelBase.ts` は `router: AppRouterInstance` を constructor で受け取り保持する。`onNavigate` の実装は VM Impl 側（`src/viewmodels/CounterViewModel.ts`）で **手書き**:

```typescript
navigate = (url: string): void => { this.router.push(url); };
```

**Next.js App Router 前提**。`app/counter/page.tsx` は手書き。

### iOS (sjui) が生成するもの

- UIKit: `UIViewController` subclass の skeleton + `layoutDefinition` bind。
- SwiftUI: `View` struct + `@State` binding。

Navigation は一切生成されない。ユーザが:
- UIKit: `navigationController?.pushViewController(vc, animated: true)` を handler で呼ぶ
- SwiftUI: `NavigationStack(path: $path)` + `.navigationDestination(for: Route.self) { route in ... }` + Route enum（全て hand-written）

### Android (kjui) が生成するもの

- Compose: `@Composable fun CounterScreen(data: CounterData) { ... }` の shell。
- XML: `Fragment` subclass + `layoutDefinition`。

Navigation は一切生成されない。ユーザが:
- Compose: `NavHost(navController, startDestination = "counter")` + `composable("counter") { ... }` + sealed `Route` class（hand-written）
- XML: `res/navigation/nav_graph.xml` + `findNavController().navigate(R.id.action_…)`

### Tab flows

`structure.tabView` という spec field はある（`pango_ios/facilitylistdetail.spec.json` 等で使用）。ジェネレータは tab の shell を出すが、タブ間遷移は手書き。

### Modal / sheet / back

- iOS SwiftUI: `.sheet(item:)` / `.fullScreenCover()` 手書き。UIKit: `present(vc, animated:)` 手書き。
- Android Compose: `dialog("route")` 手書き。XML: `DialogFragment` 手書き。
- Web: `router.push(url)` のみ、sheet は hand-rolled modal component。
- Back: iOS/Android は stack が勝手に pop、Web は `router.back()` または browser back。

## 目標構造

4 section 構造を捨てて **6 section + concrete code examples** にする:

1. **The contract (spec layer)** — `userActions`, `transitions`, `viewModel.methods` の 3 つを spec に書く。
2. **What the generator writes for you** — 各 platform の Data interface + VM Base stub の説明 + **"これだけしか出ない" の明示**。
3. **Wiring the Web router (Next.js App Router)** — `router.push(url)` + URL ↔ file tree mapping。
4. **Wiring iOS (SwiftUI NavigationStack)** — Route enum + NavigationStack。UIKit は付録。
5. **Wiring Android (Compose Navigation)** — sealed `Route` class + NavHost。XML+NavGraph は付録。
6. **Sheets, modals, tabs, back** — 3 platform 横断で cheatsheet。

## 新設 section の詳細

### 1. The contract (spec layer)

**body**: 「spec の navigation は 3 つの約束事で表現する。それぞれが platform-agnostic。」

**CodeBlock** (json — excerpt):
```json
"stateManagement": {
  "eventHandlers": [
    { "name": "onSubmit", "description": "Validate + navigate to /thanks." }
  ]
},
"userActions": [
  { "action": "Tap submit button", "processing": "onSubmit() then onNavigate('/thanks')." }
],
"transitions": [
  { "trigger": "onNavigate(url)", "condition": "url === '/thanks'", "destination": "ThanksScreen" }
],
"dataFlow": {
  "viewModel": {
    "methods": [
      { "name": "onNavigate", "params": [{"name": "url", "type": "String"}],
        "description": "Router.push(url). URL is opaque to spec." }
    ]
  }
}
```

**Callout (Label)**: 「`url` は spec から見ると opaque な文字列。spec は "ここで遷移する" という intent だけ伝え、URL の形と route table は platform 側で決める。」

### 2. What the generator writes for you

**body**: 「spec から `jui generate project` を走らせると、**ジェネレータが navigation 実装を書くことはない**。出るのは 3 つの抽象物だけ。」

**CodeBlock** (text — file list):
```text
[Web]   src/generated/data/<Screen>Data.ts      ← onNavigate?: (url: string) => void 型のスロット
        src/generated/viewmodels/<Screen>ViewModelBase.ts  ← router を constructor で受けるだけ
[iOS]   <Screen>View.swift (UIKit) / .swift (SwiftUI)  ← layoutDefinition bind、Navigation 無し
[Android] <Screen>Screen.kt (Compose) / Fragment.kt (XML)  ← shell のみ
```

**重要な一文**（Callout, 危険マーカー込み）: 「**Route enum / NavHost / NavigationStack / router.push はすべて手書き** です。`jui generate` はあなたの代わりにルーティング仕様を決めません。」

### 3. Wiring the Web router (Next.js App Router)

**body**: 「Next.js の App Router 前提。`useRouter()` から取った `router` を ViewModel constructor に渡し、VM Impl 側で `onNavigate` を実装する。」

**CodeBlock** (typescript):
```typescript
// src/viewmodels/CounterViewModel.ts   — hand-written
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { CounterViewModelBase } from "@/generated/viewmodels/CounterViewModelBase";

export class CounterViewModel extends CounterViewModelBase {
  constructor(private router: AppRouterInstance) { super(); }

  protected initializeEventHandlers() {
    this.updateData({
      onNavigate: (url: string) => this.router.push(url),
      onSubmit:   () => this.router.push("/thanks"),
    });
  }
}
```

**CodeBlock** (typescript — page):
```tsx
// src/app/counter/page.tsx — hand-written
"use client";
import { useRouter } from "next/navigation";
import { useCounterViewModel } from "@/generated/hooks/useCounterViewModel";
import { CounterViewModel } from "@/viewmodels/CounterViewModel";
import CounterLayout from "@/Layouts/counter.json";

export default function CounterPage() {
  const router = useRouter();
  const { data } = useCounterViewModel(() => new CounterViewModel(router));
  return <LayoutRenderer layout={CounterLayout} data={data} />;
}
```

**本文**: 「URL は opaque だが慣習として `/{segment}` 形式。App Router のファイルシステム（`src/app/counter/page.tsx`）が routing table になる。」

### 4. Wiring iOS (SwiftUI NavigationStack)

**body**: 「SwiftUI の NavigationStack を中心に書く。UIKit の UINavigationController は付録で触れる。」

**CodeBlock** (swift — Route enum):
```swift
// hand-written — AppRouter.swift
enum Route: Hashable {
    case counter
    case thanks
    case settings
}

struct AppView: View {
    @State private var path: [Route] = []
    var body: some View {
        NavigationStack(path: $path) {
            CounterView(onNavigate: { url in
                switch url {
                case "/thanks": path.append(.thanks)
                default: break
                }
            })
            .navigationDestination(for: Route.self) { route in
                switch route {
                case .counter:  CounterView(onNavigate: { _ in })
                case .thanks:   ThanksView()
                case .settings: SettingsView()
                }
            }
        }
    }
}
```

**Callout (sub-section "UIKit alternative")**: UINavigationController を使うなら `navigationController?.pushViewController(vc, animated: true)` を `onNavigate` handler の中で呼ぶ。Storyboard 不要。

### 5. Wiring Android (Compose Navigation)

**body**: 「Compose Navigation + sealed Route class の組合せを推奨。XML+NavGraph は付録。」

**CodeBlock** (kotlin):
```kotlin
// hand-written — AppNav.kt
sealed class Route(val path: String) {
    object Counter  : Route("counter")
    object Thanks   : Route("thanks")
    object Settings : Route("settings")
}

@Composable
fun AppNav() {
    val nav = rememberNavController()
    NavHost(nav, startDestination = Route.Counter.path) {
        composable(Route.Counter.path) {
            CounterScreen(onNavigate = { url -> nav.navigate(url.trimStart('/')) })
        }
        composable(Route.Thanks.path)   { ThanksScreen() }
        composable(Route.Settings.path) { SettingsScreen() }
    }
}
```

**Callout (sub-section "XML Navigation alternative")**: `res/navigation/nav_graph.xml` + Fragment + `findNavController().navigate(R.id.action_to_thanks)`。Safe Args plugin 使うと type-safe な arg 受け渡しが手に入る。

### 6. Sheets, modals, tabs, back

**body** (short): 「stack push 以外のよくあるパターンをまとめる。」

**Table** (Label grid):

| pattern | Web (Next.js) | iOS SwiftUI | Android Compose |
|---|---|---|---|
| Sheet | hand-rolled modal component | `.sheet(isPresented:)` | `ModalBottomSheet` |
| Full modal | route `/modal/foo` or dedicated overlay | `.fullScreenCover()` | `Dialog()` |
| Tabs | hand-rolled tab strip or URL segment | `TabView { ... }` | `TabRow { ... }` + `HorizontalPager` |
| Back | `router.back()` or browser back | automatic via NavigationStack | `nav.popBackStack()` or hardware back |

**Callout**: 「spec の `transitions[].type` = `push`/`sheet`/`modal` はアプリ spec では使われるが、docs site のような Web 主体プロジェクトでは空欄のままが普通。ここは好みの問題。」

## Spec 編集差分

`docs/screens/json/guides/navigation.spec.json`:
- TOC を 4 → 6 項目に。`toc_contract`, `toc_gen_output`, `toc_web`, `toc_ios`, `toc_android`, `toc_sheets`
- 対応 section: `section_contract`, `section_gen_output`, `section_web`, `section_ios`, `section_android`, `section_sheets`
- 既存 `section_spec`, `section_web`, `section_ios`, `section_android` は `section_contract`, `section_web`, `section_ios`, `section_android` に renumber（spec ID を変えるので strings キーも対応して変更）

## strings.json 新設キー（navigation namespace）

```
navigation_section_contract_heading/body
navigation_section_gen_output_heading/body
navigation_section_gen_output_callout_warn     (Route enum 等は手書き、の強調)
navigation_section_web_heading/body
navigation_section_web_code_vm_filename        ("src/viewmodels/CounterViewModel.ts")
navigation_section_web_code_page_filename      ("src/app/counter/page.tsx")
navigation_section_ios_heading/body
navigation_section_ios_uikit_alt_heading/body
navigation_section_android_heading/body
navigation_section_android_xml_alt_heading/body
navigation_section_sheets_heading/body
navigation_section_sheets_table_*              (6 cells x 4 rows = 24 entries)
navigation_toc_row_*                           (6 rows)
```

CodeBlock の `code` 属性は bind せず spec 内に直接 literal で埋める（writing-your-first-spec 方式に合わせる）。

## VM 差分

`NavigationViewModel.ts` — nextReadLinks のみ。変更無し。

## 検証手順

1. `.jsonui-doc-rules.json` の allowed sections に新 section ID を追加
2. strings.json に en/ja 両方追加
3. `jui doc validate spec` → `jui build` → `jui verify --fail-on-diff`
4. `/guides/navigation` をブラウザで目視：TOC が 6 項目、各 section に CodeBlock、Table の表組が壊れていない

## 作業見積り

- strings.json: 50+ keys × 2 lang ≒ 100 entries ≒ 2h
- spec 書き換え（section renumber 含む）: 1h
- code 例の検証（実在 VM ファイル snippet から quote）: 0.5h
- ブラウザ確認 + fix: 1h
- 計 **~4.5h**

