# 29. コンテンツプラン: Guides — Navigation

> Scope: 4〜6 時間 / 1〜2 セッション。`/guides/navigation` を「プラットフォーム別完全実装ガイド」として完成させる。
> 依存: plan 22 (TabView)、plan 28 (first-screen で触れた navigation の基礎)。

---

## 1. 対象記事

| URL | spec | Layout | 現状 |
|---|---|---|---|
| `/guides/navigation` | `docs/screens/json/guides/navigation.spec.json` | `docs/screens/layouts/guides/navigation.json` | 骨組みのみ、CodeBlock 0 |

完成条件: CodeBlock ≥ 12（プラットフォーム 3 種 × パターン 4 種）、クロスリンク ≥ 4。

---

## 2. コンテンツ構造

### 2.1 ページの目的
- en: "Implement navigation across JsonUI's three platforms. Spec is platform-agnostic; this guide shows the corresponding code for each."
- ja: "JsonUI の 3 プラットフォームで navigation を実装。spec は platform-agnostic、本ガイドは各プラットフォームの対応コードを示す。"

### 2.2 Spec 側の navigation 記述

#### `userActions` と `transitions`

```json
{
  "userActions": [
    { "name": "goToProfile", "triggers": [{ "elementId": "profile_button", "event": "onClick" }] },
    { "name": "openSettings", "triggers": [{ "elementId": "settings_button", "event": "onClick" }] },
    { "name": "backToHome", "triggers": [{ "elementId": "back_button", "event": "onClick" }] }
  ],
  "transitions": [
    { "from": "goToProfile", "to": "/user/profile", "style": "push" },
    { "from": "openSettings", "to": "/settings", "style": "modal" },
    { "from": "backToHome", "to": "pop" }
  ]
}
```

`style` の種類:
- `push` — スタックに積む（右からスライド、iOS デフォルト）
- `modal` — モーダル表示（下からスライドアップ）
- `replace` — 現画面を置き換え
- `pop` — 1 画面戻る
- `popToRoot` — 最初まで戻る

### 2.3 パターン 1: Push Navigation

#### iOS SwiftUI (NavigationStack)

```swift
import SwiftUI

struct RootView: View {
  @StateObject var vm = HomeViewModel()
  @State private var path = NavigationPath()

  var body: some View {
    NavigationStack(path: $path) {
      HomeScreen(vm: vm)
        .navigationDestination(for: Route.self) { route in
          switch route {
          case .profile(let id): ProfileScreen(userId: id)
          case .settings: SettingsScreen()
          }
        }
    }
    .environmentObject(Router(path: $path))
  }
}

// ViewModel
class HomeViewModel: ObservableObject {
  @EnvironmentObject var router: Router

  func goToProfile() {
    router.push(.profile(id: currentUserId))
  }
}
```

#### iOS UIKit (UINavigationController)

```swift
class HomeViewController: SJUIViewController {
  override func viewDidLoad() {
    super.viewDidLoad()
    viewModel = HomeViewModel(router: Router(navigationController: navigationController))
  }
}

class HomeViewModel {
  let router: Router

  init(router: Router) {
    self.router = router
  }

  func goToProfile() {
    let vc = ProfileViewController(userId: currentUserId)
    router.push(vc)
  }
}

class Router {
  weak var navigationController: UINavigationController?

  func push(_ vc: UIViewController) {
    navigationController?.pushViewController(vc, animated: true)
  }
}
```

#### Android Jetpack Compose (NavHost)

```kotlin
@Composable
fun AppNavigation() {
  val navController = rememberNavController()
  val router = remember { Router(navController) }

  NavHost(navController = navController, startDestination = "home") {
    composable("home") {
      HomeScreen(vm = viewModel { HomeViewModel(router) })
    }
    composable("profile/{userId}") { entry ->
      val userId = entry.arguments?.getString("userId") ?: ""
      ProfileScreen(userId = userId)
    }
  }
}

class HomeViewModel(private val router: Router) : ViewModel() {
  fun goToProfile() {
    router.push("profile/${currentUserId}")
  }
}

class Router(private val navController: NavController) {
  fun push(route: String) = navController.navigate(route)
}
```

#### Android XML (NavGraph)

`res/navigation/nav_graph.xml`:
```xml
<navigation xmlns:android="http://schemas.android.com/apk/res/android"
            xmlns:app="http://schemas.android.com/apk/res-auto"
            android:id="@+id/nav_graph"
            app:startDestination="@id/homeFragment">
  <fragment android:id="@+id/homeFragment"
            android:name="com.example.HomeFragment">
    <action android:id="@+id/action_home_to_profile"
            app:destination="@id/profileFragment"/>
  </fragment>
  <fragment android:id="@+id/profileFragment"
            android:name="com.example.ProfileFragment">
    <argument android:name="userId" app:argType="string"/>
  </fragment>
</navigation>
```

ViewModel:
```kotlin
class HomeViewModel(private val navController: NavController) : ViewModel() {
  fun goToProfile() {
    navController.navigate(
      HomeFragmentDirections.actionHomeToProfile(currentUserId)
    )
  }
}
```

#### Web React Router

```tsx
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/user/profile" element={<ProfileScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

// ViewModel
export class HomeViewModel extends ViewModel {
  constructor(private navigate: NavigateFunction) {
    super();
  }

  goToProfile() {
    this.navigate(`/user/profile?id=${this.currentUserId}`);
  }
}

// Screen
export function HomeScreen() {
  const navigate = useNavigate();
  const vm = useMemo(() => new HomeViewModel(navigate), [navigate]);
  // ...
}
```

#### Web Next.js (App Router)

```tsx
// app/page.tsx
"use client";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const vm = useMemo(() => new HomeViewModel(router), [router]);
  // ...
}

// ViewModel
export class HomeViewModel extends ViewModel {
  constructor(private router: AppRouterInstance) { super(); }

  goToProfile() {
    this.router.push(`/user/profile?id=${this.currentUserId}`);
  }
}
```

### 2.4 パターン 2: Modal

#### iOS SwiftUI
```swift
.sheet(isPresented: $vm.showSettings) {
  SettingsScreen()
}
```

#### iOS UIKit
```swift
func openSettings() {
  let vc = SettingsViewController()
  vc.modalPresentationStyle = .formSheet
  present(vc, animated: true)
}
```

#### Android Compose
```kotlin
if (vm.showSettings) {
  ModalBottomSheet(onDismissRequest = { vm.dismissSettings() }) {
    SettingsContent()
  }
}
```

#### Web
```tsx
{vm.showSettings && (
  <Modal onClose={() => vm.dismissSettings()}>
    <SettingsScreen />
  </Modal>
)}
```

### 2.5 パターン 3: Tab Bar

spec 側:
```json
{
  "type": "TabView",
  "activeIndex": "@{activeTab}",
  "position": "bottom",
  "tabs": [
    { "label": "@string/home", "icon": "house", "route": "/home" },
    { "label": "@string/search", "icon": "magnifyingglass", "route": "/search" },
    { "label": "@string/profile", "icon": "person", "route": "/profile" }
  ]
}
```

各プラットフォームでの実装（iOS TabView / Android BottomNavigation / React 独自実装）を 3 言語で示す。

### 2.6 パターン 4: Deep Link

#### iOS SwiftUI
```swift
.onOpenURL { url in
  router.handleDeepLink(url)
}
```

#### Android
```xml
<!-- AndroidManifest.xml -->
<activity android:name=".MainActivity">
  <intent-filter>
    <action android:name="android.intent.action.VIEW"/>
    <category android:name="android.intent.category.DEFAULT"/>
    <category android:name="android.intent.category.BROWSABLE"/>
    <data android:scheme="myapp" android:host="profile"/>
  </intent-filter>
</activity>
```

#### Web
```tsx
// Query string parsing built into routers
useEffect(() => {
  const params = new URLSearchParams(location.search);
  const userId = params.get("userId");
  if (userId) vm.loadProfile(userId);
}, [location]);
```

### 2.7 戻り値の受け取り

Screen A → B と遷移、B から戻るときに値を渡すパターン。

spec 側:
```json
{
  "transitions": [
    { "from": "selectCountry", "to": "/country-picker", "returns": "@{selectedCountry}" }
  ]
}
```

各プラットフォーム実装（SwiftUI の Binding、Compose の SavedStateHandle、React の state lift）を 3 言語で示す。

### 2.8 よくある誤り

- `NavigationStack` / `NavController` の複数インスタンス化で state が失われる
- Android で `popBackStack()` を forget して無限スタック
- Web で `<BrowserRouter>` と `<HashRouter>` を混在
- TabView の `activeIndex` を正しく ViewModel に戻していない

---

## 3. 必要な strings キー

prefix: `guide_navigation_*`

- `_intro_*`
- `_pattern_{push,modal,tab,deeplink,return}_{title,body}`
- `_platform_{ios_swiftui,ios_uikit,android_compose,android_xml,web_router,web_next}_{title}`
- `_pitfalls_*`

概算 80 キー × 2 言語。

---

## 4. クロスリンク追加先

- `/learn/first-screen` 末尾「次へ」→ `/guides/navigation`
- `/platforms/swift/*` の navigation ページから本ガイドへ
- `/reference/components/tab-view` → 本ガイド「パターン 3」へ

---

## 5. 実装チェックリスト

- [ ] spec metadata 更新
- [ ] strings キー追加
- [ ] 各パターン × 各プラットフォームの CodeBlock（12 個以上）
- [ ] クロスリンク追加
- [ ] `jui build` / `jui verify` / `jsonui-localize`

---

## 6. セッション分割の推奨境界

- **分割 A**: パターン 1 (push) + パターン 2 (modal)（3 時間、6 CodeBlock）
- **分割 B**: パターン 3 (tab) + パターン 4 (deep link) + 戻り値 + pitfalls（2〜3 時間）
