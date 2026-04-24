# Plan — Learn トラック記事の書き換え

## ゴール

Learn の 5 記事（`what-is-jsonui` / `installation` / `hello-world` / `first-screen` / `data-binding-basics`）が、実際のツール実装と整合すること。特に:

1. **Per-tool build コマンド（`sjui build` / `kjui build` / `rjui build`）を前面に出さない**。読者には `jui build` + `jui verify` を覚えてもらう方針に寄せる。
2. 残りの hard error（捏造構文 / 存在しないサブコマンド / 嘘の filename / 嘘の React VM shape / 雑な prose）をすべて塞ぐ。

本 Plan は **2026-04-24 時点の audit**（`.claude/jsonui-workflow.md` の investigate フロー）を前提にしている。installation の件数 / CLAUDE.md まわりは本 Plan 着手前に修正済み。

---

## スコープ外（本 Plan に含めない）

- `data-binding-basics.json`（監査済み、ドリフトなし）
- installation の件数まわり（D1/D2）・CLAUDE.md まわり（E2/F1）・PATH 抜け（E1）は**先行修正済み**
- 新記事の追加 / IA 変更 / 翻訳対応

---

## Phase 0 — 方針（確定済み）

- **Q1 = A** — すべて `jui init` / `jui build` / `jui verify` に寄せる。ただし記事は **「プラットフォーム共通ステップ」と「プラットフォーム別ステップ」を UI で切り替えられる形** にする。
  - 共通: `jui init`（wizard で対象プラットフォームを選択）→ Layout 執筆 → `jui build` → `jui verify --fail-on-diff`
  - プラットフォーム別: 各 platform の ViewModel 実装 → プラットフォーム固有のランタイム起動手順（Xcode / Android Studio / `npm run dev`）
  - 既存の `QuickstartStepCell` 配列は 3 tab（swift / kotlin / react）に分かれているが、これを **「共通 steps + platform-specific steps を tab で切替」** 形にリフレーム
- **Q2 = `jui hotload listen` 前提で書く** — iOS+Android 同時対応予定。`/Users/like-a-rolling_stone/resource/jsonui-cli/docs/plans` に upstream 計画書がもうすぐ landing するので、**そこで API シェイプが確定するまで Phase 2/3 の hotload 記述は pend**。Web は `npm run dev` + rjui の既存 watch で OK。
- **Q3 = A** — `jui verify --fail-on-diff` で spec validation + drift check を両方こなす扱いにし、`jui doc validate-spec` / `jsonui-doc validate spec` は記事には出さない。

---

## Phase 1 — `hello-world.json` 書き換え

ターゲット: hello-world 記事 + `HelloWorldViewModel.ts` + `docs/screens/layouts/learn/hello-world.json`（source layout）

**記事構成を共通 + platform-specific の 2 層に作り替える**:

```
[共通 section]
  Step 1: bootstrap（installation 記事からの pointer）
  Step 2: jui init                        ← NEW (platform wizard)
  Step 3: docs/screens/layouts/home.json を編集
  Step 4: jui build
  Step 5: jui verify --fail-on-diff

[platform-specific section — Tab 切替]
  Tab: iOS / Android / Web
    Step 6 (platform): ViewModel を実装
    Step 7 (platform): ランタイム起動
```

### 1a. 共通 steps（`jui` で全部やる）

- Step 2: `jui init`（wizard で platform 選択）— 生成先が `docs/screens/layouts/` に統一される
- Step 3: Layout JSON を `docs/screens/layouts/home.json` に書く — 3 tab で filename が同じになる
- Step 4: `jui build` — Swift / Kotlin / TS を配布 + 生成
- Step 5: `jui verify --fail-on-diff` — spec ↔ generated drift 検出
- 編集先: `HelloWorldViewModel.ts` に `commonSteps: QuickstartStepCell[]` を新設、既存の platform 別 `swiftSteps` / `kotlinSteps` / `reactSteps` から重複 steps を抜く

### 1b. Swift VM サンプルを実物に差し替え（G1 相当 — Swift 版）

現状 `sampleSwiftViewModel` は素の `ObservableObject` に個別 `@Published` を並べた「idealized」形で、**実際の SwiftJsonUI プロジェクトの emit 形（single Published data struct + `*ViewModelProtocol` 準拠 + `setupActionHandlers`）とまったく違う**。

**実コード調査結果**（`/Users/like-a-rolling_stone/resource/whisky-find-agent/client/whisky-find-agent-ios/whisky-find-agent/ViewModel/LoginViewModel.swift` と `ChangeEmailSheetViewModel.swift` を基準）:

- base: `class HomeViewModel: ObservableObject, HomeViewModelProtocol`（`HomeViewModelProtocol` は `@generated`）
- 状態: `@Published var data = HomeData()`（**個別 @Published ではなく struct 1 つ**）
- イベント: `data.onTap` などクロージャを `setupActionHandlers()` で配線し、`init()` から呼ぶ
- 状態更新: `data.tapCount += 1` の直接代入で OK（Published struct なので変更検知される）

**新サンプル**（記事用の minimal 版）:

```swift
import Foundation

class HomeViewModel: ObservableObject, HomeViewModelProtocol {
    @Published var data = HomeData()

    init() {
        setupActionHandlers()
    }

    private func setupActionHandlers() {
        data.onTap = { [weak self] in
            self?.data.tapCount += 1
        }
    }
}
```

- `HomeViewModelProtocol` / `HomeData` は `jui build` が生成する（記事内で注記）
- prose (`step_viewmodel_swift_instruction`): 「`@generated` な Protocol に準拠させて `setupActionHandlers` でイベントを配線する」「State は単一 `@Published var data` に集約される」に差し替え
- 編集先: `HelloWorldViewModel.ts` の `sampleSwiftViewModel` 定数 + `strings.json` の `step_viewmodel_swift_instruction`

### 1c. Kotlin VM サンプルを実物に差し替え（G1 相当 — Kotlin 版）

現状 `sampleKotlinViewModel` は素の `ViewModel()` + 個別 `MutableStateFlow<String>` / `<Int>` を並べる「idealized」形。**実コードは `AndroidViewModel` + `@HiltViewModel` + single StateFlow-of-data-struct + protocol 準拠 + Hilt injection**。

**実コード調査結果**（`whisky-find-agent-android/.../viewmodel/LoginViewModel.kt` と `LanguagePickerSheetViewModel.kt` を基準）:

- base: `@HiltViewModel class HomeViewModel @Inject constructor(application: Application) : AndroidViewModel(application), HomeViewModelProtocol`
- 状態: `private val _data = MutableStateFlow(HomeData()); override val data: StateFlow<HomeData> = _data.asStateFlow()`（**個別 MutableStateFlow ではなく struct 1 つ**）
- イベント: `init { setupActionHandlers() }` でクロージャを `_data.update { it.copy(onTap = …) }` 経由で配線
- 状態更新: `_data.update { it.copy(tapCount = it.tapCount + 1) }` 経由

**新サンプル**:

```kotlin
@HiltViewModel
class HomeViewModel @Inject constructor(
    application: Application,
) : AndroidViewModel(application), HomeViewModelProtocol {

    private val _data = MutableStateFlow(HomeData())
    override val data: StateFlow<HomeData> = _data.asStateFlow()

    init {
        setupActionHandlers()
    }

    private fun setupActionHandlers() {
        _data.update { current ->
            current.copy(onTap = {
                _data.update { it.copy(tapCount = it.tapCount + 1) }
            })
        }
    }
}
```

- Hilt 前提がきつい場合は代替に `class HomeViewModel : ViewModel(), HomeViewModelProtocol` + 非 Hilt 版も考えられるが、**jui がデフォルト emit する形が Hilt 前提**なので記事も Hilt 側に合わせる（prose で「prod な Android プロジェクトは Hilt を想定。非 Hilt 版は guides/ を参照」と断る）
- prose (`step_viewmodel_kotlin_instruction`): 「`@HiltViewModel` + `AndroidViewModel` + `@generated` Protocol 準拠」「State は single StateFlow<Data> に集約」「`collectAsStateWithLifecycle` で Compose 側が購読」に差し替え
- 編集先: `HelloWorldViewModel.ts` の `sampleKotlinViewModel` 定数 + `strings.json` の `step_viewmodel_kotlin_instruction`

### 1d. React VM サンプルを実物に差し替え（G1 / G2）

- 現状 (`sampleReactViewModel`): `class HomeViewModel extends ViewModel { … this.notify() … }` — 実在しない ViewModel base class
- 新: このリポジトリの実 VM パターン（`InstallationViewModel.ts` / `HelloWorldViewModel.ts` など）に合わせる

```typescript
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { HomeData } from "@/generated/data/HomeData";

export class HomeViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => HomeData;
  protected _setData: (
    data: HomeData | ((prev: HomeData) => HomeData),
  ) => void;

  get data() { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => HomeData,
    setData: (data: HomeData | ((prev: HomeData) => HomeData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.onAppear();
  }

  updateData = (updates: Partial<HomeData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  onAppear = () => {
    this.updateData({
      message: "Hello, JsonUI!",
      tapCount: 0,
      onTap: this.handleTap,
    });
  };

  handleTap = () => {
    this.updateData({ tapCount: this.data.tapCount + 1 });
  };
}
```

- prose (`step_viewmodel_react_instruction`): 「`extends ViewModel`」「`this.notify()`」表現を全削除し、「constructor で `(router, getData, setData)` を受け取る / `updateData((prev) => …)` で状態を更新する / `onAppear` で初期 seed する」に差し替え
- 編集先: `HelloWorldViewModel.ts` の `sampleReactViewModel` 定数 + `strings.json` の `step_viewmodel_react_instruction`

### 1e. ランタイム起動 step（Q2 = hotload listen 前提、ただし upstream 計画書待ち）

**現状**（debug 時の仮）:

| platform | 新 code（upstream 計画書 landing 後に再確認）|
|---|---|
| iOS | `jui hotload listen\nopen my-app.xcodeproj\n# In Xcode: ⌘R to run the simulator. Subsequent layout edits live-reload via hotload.` |
| Android | `jui hotload listen\n./gradlew installDebug\n# Open Android Studio and press Run. Subsequent layout edits live-reload via hotload.` |
| Web | `npm run dev\n# Open http://localhost:3000. rjui watch keeps layouts in sync.` |

- `jui hotload listen` は **iOS+Android 同時対応予定**。API シェイプ（flag, daemon 挙動, log 形式）が確定するまで CodeBlock の一段目は commit しない
- 該当 upstream plan: `/Users/like-a-rolling_stone/resource/jsonui-cli/docs/plans/` に近日 landing
- 現時点の次善: `jui build` だけを示して「live-reload の手順は近日別途追記」と prose に一行入れる
- 編集先: `HelloWorldViewModel.ts` の `swiftSteps[5]` / `kotlinSteps[5]` / `reactSteps[5]` CodeBlock `code` + `strings.json` の `step_build_{swift,kotlin,react}_instruction`

### 1f. `next_data_binding_description` の捏造構文を削除（C1）

- 現状: 「@{} / @string/ / @event() syntaxes」
- 新: 「`@{identifier}` の 1 種類。value binding と event binding の両方を兼ねる」
- 編集先: `strings.json` の `learn_hello_world_next_data_binding_description`

---

## Phase 2 — `first-screen.json` 書き換え

ターゲット: first-screen 記事

### 2a. Ship CodeBlock を直す（A1 + A2）

現状:

```
jui generate project --file recent-activity.spec.json
jui build --watch
jui verify --fail-on-diff
git add docs/screens/ jsonui-doc-web/src/
git commit -m "Ship recent-activity"
```

新（推奨 Q3=A 前提）:

```
jui generate project --file recent-activity.spec.json
jui build
jui verify --fail-on-diff
git add docs/screens/ jsonui-doc-web/src/
git commit -m "Ship recent-activity"
```

- `--watch` を削除（`jui build` にフラグが存在しない）
- `jui doc validate-spec` は `jui verify --fail-on-diff` に含まれるので別コマンドを出さない
- 編集先: source layout `docs/screens/layouts/learn/first-screen.json` の `section_ship` CodeBlock

### 2b. `section_spec_body` の prose 修正（A2）

- 現状: 「Validate with `jui doc validate-spec` before moving on」
- 新: 「`jui verify --fail-on-diff` で spec validation + drift check を両方走らせて OK」
- 編集先: `strings.json` の `learn_first_screen_section_spec_body`

### 2c. "Hot reload" に触れている箇所

Q2 が「`jui hotload listen` が iOS+Android 同時対応」前提になったので、first-screen に `--watch` 風の記述があれば:

- upstream の `jui hotload listen` 計画書が landing したら記述を置き換える（`/Users/like-a-rolling_stone/resource/jsonui-cli/docs/plans/`）
- それまでは hot-reload 関連行を削除し、`concepts/hot-reload` への pointer のみ残す

要 grep 確認 — audit 時点で断定できず

---

## Phase 3 — `what-is-jsonui.json` 書き換え

ターゲット: what-is-jsonui 記事

### 3a. `section_pieces` の 3-tab CodeBlock header 文言修正

- 現状: 各 tab の header に「generated by sjui build / kjui build / rjui build」と書いている
- 新: 「generated by `jui build` → iOS/Android/Web」の単一出典に統一

  - 具体的には "Swift generated by sjui build" → "Swift (emitted by `jui build`)" 等に単純化

- 編集先: `strings.json` の `section_pieces_*` group

### 3b. `section_one` の minimal spec に "simplified sketch" ラベル（I1）

- 現状: CodeBlock が簡略化された 3 行で、実 validator は通らない
- 新: CodeBlock の上の prose に「この例は構造を伝えるための省略版。実際の spec は `metadata` / `stateManagement` / `dataFlow` の三層構造を持つ（`docs/plans/17-spec-templates.md` 参照）」を1行足す
- 編集先: `strings.json` の `learn_what_is_jsonui_section_one_body` または簡易版プレフィクス行

---

## Phase 4 — 検証

各 Phase の編集後に以下を走らせる:

1. `jui_build` MCP — **warning 0 で通ること**
2. `jui_verify --fail-on-diff` MCP — **drift 0 で通ること**
3. `jsonui-localize` skill — user-visible string の登録漏れが無いこと
4. `doc_validate_spec` MCP — 該当 spec (`installation.spec.json` / `hello-world.spec.json` / `first-screen.spec.json` / `what-is-jsonui.spec.json`) の schema 健全性
5. （任意）`npm run dev` で `http://localhost:3000/learn/hello-world` 等を実ブラウザで目視確認

---

## 期待される diff 概要

| 編集対象 | おおよその変更規模 |
|---|---|
| `src/viewmodels/learn/HelloWorldViewModel.ts` | CodeBlock 3 箇所（build コマンド）+ React VM サンプル全面差し替え（～30 行）|
| `docs/screens/layouts/learn/hello-world.json`（source layout）| 共通 section の新設（`jui init` / `jui build` / `jui verify`）+ 既存 3 tab の重複 step 抜き + Tab を platform-specific 層だけに絞る構造変更 |
| `docs/screens/layouts/learn/first-screen.json`（source layout）| ship CodeBlock `code` 1 箇所 |
| `docs/screens/layouts/learn/what-is-jsonui.json`（source layout）| section_pieces の CodeBlock header に相当する構造があれば調整（要 grep）|
| `docs/screens/layouts/Resources/strings.json` | 5〜10 key の prose 差し替え（`section_pieces_*`, `step_build_*_instruction`, `step_viewmodel_react_instruction`, `next_data_binding_description`, `section_one_body` 等）|
| `docs/screens/json/learn/*.spec.json` | 該当 spec の `description` 欄に VM API / CLI 言及があれば更新 |

`@generated` 側の `jsonui-doc-web/src/Layouts/` 以下は `jui build` の後追いで自動更新。

---

## 順序

1. ~~Phase 0（Q1-Q3 の user 確認）~~ — 確定（Q1=A + 共通/platform 切替 / Q2 = `jui hotload listen` 前提・upstream 待ち / Q3=A）
2. Phase 1（hello-world）→ build & verify
3. Phase 2（first-screen）→ build & verify
4. Phase 3（what-is-jsonui）→ build & verify
5. Phase 4（通し検証）

Phase 1-3 は独立して commit 可能。1 PR ずつ / まとめて / どちらでも user の運用次第。

**ブロッカー**:
- `jui hotload listen` の API シェイプが確定するまで、Phase 1 Step 7（ランタイム起動）と Phase 2c（hot-reload 言及）の最終版 CodeBlock は書き切れない。暫定で `jui build` のみを示して commit するか、upstream plan の landing 後に一気に書くか、ここは user 判断。
