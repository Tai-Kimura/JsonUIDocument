# 28. コンテンツプラン: Learn セクション拡充（4 記事）

> Scope: 6〜8 時間 / 2 セッション。`installation` 除く 4 記事（what-is-jsonui / hello-world / first-screen / data-binding-basics）を完成レベルまで引き上げる。
> 依存: plan 20, 24（属性リファレンス完成が望ましいが、完成前でも本文は書ける）。

---

## 1. 対象記事

| URL | spec | Layout | 現状 |
|---|---|---|---|
| `/learn/what-is-jsonui` | `docs/screens/json/learn/what-is-jsonui.spec.json` | `docs/screens/layouts/learn/what-is-jsonui.json` | 概観のみ、CodeBlock 1 |
| `/learn/hello-world` | `docs/screens/json/learn/hello-world.spec.json` | `docs/screens/layouts/learn/hello-world.json` | 骨組みあり、CodeBlock 0 |
| `/learn/first-screen` | `docs/screens/json/learn/first-screen.spec.json` | `docs/screens/layouts/learn/first-screen.json` | 骨組みあり、CodeBlock 5 |
| `/learn/data-binding-basics` | `docs/screens/json/learn/data-binding-basics.spec.json` | `docs/screens/layouts/learn/data-binding-basics.json` | 骨組みあり、CodeBlock 4 |

各記事の完成条件: CodeBlock ≥ 6、プラットフォーム別サンプル ≥ 3（iOS/Android/Web）、クロスリンク ≥ 3。

---

## 2. `/learn/what-is-jsonui`

### 2.1 ページの目的
- en: "First-touch page for visitors who have not used JsonUI. In ~3 minutes, convey: what JsonUI is, why it matters, what it competes with, and what to read next."
- ja: "JsonUI 未経験者のファーストタッチ。3 分で「何か」「なぜ重要か」「何と競合するか」「次に何を読むか」を伝える。"

### 2.2 セクション構成

#### 導入: "One JSON, three platforms"
- 本文 (en): "JsonUI lets you describe a screen once in JSON, and it compiles to SwiftUI/UIKit on iOS, Jetpack Compose / XML on Android, and React on the web. Your ViewModel is the single source of state; your Layout JSON is the single source of UI."
- 本文 (ja): "JsonUI では画面を JSON で一度定義するだけで、iOS の SwiftUI/UIKit、Android の Jetpack Compose/XML、Web の React に変換される。ViewModel が状態の単一ソースであり、Layout JSON が UI の単一ソースとなる。"
- **図**（代わりに text diagram）:
  ```
              ┌───────────────┐
              │  screen spec  │──┐
              └───────┬───────┘  │
                      │          │ (jui g project)
                      ▼          ▼
              ┌───────────────┐  ┌─────────────┐
              │ Layout JSON   │  │  ViewModel  │
              └───────┬───────┘  │  stubs      │
                      │          │ (3 langs)   │
              ┌───────┴───────┐  └─────────────┘
              ▼       ▼       ▼
            iOS   Android   Web
         (SwiftUI)(Compose)(React)
  ```

#### なぜ JsonUI か

3 つの観点:

1. **One ViewModel, three platforms** — ビジネスロジックを 1 回書けば全プラットフォームで動く。ViewModel は protocol-based で、platform-specific な差分は自動生成。
2. **Design-ready reference** — コンポーネント・属性の全仕様が spec 化され、AI エージェントが生成ミスをしにくい（plan 14 の自動生成 reference ページを引用）。
3. **Live code** — Hot Loader で開発中に iOS / Android / Web 全てを即時反映。

#### 何と競合するか

| Alternative | JsonUI との違い |
|---|---|
| React Native | JsonUI は各プラットフォームの**ネイティブ UI**を生成する（RN は独自ランタイム） |
| Flutter | JsonUI は宣言的 JSON のみ、コード自動生成でネイティブにコミット |
| SwiftUI/Compose 独立実装 | JsonUI は 1 仕様で 3 プラットフォーム出力、ViewModel 一本化 |

#### JsonUI のアーキテクチャ要素

- **Spec** — 画面の目的・データフロー・状態を宣言
- **Layout JSON** — 実際の UI 配置
- **ViewModel** — 状態と振る舞い
- **Strings** — 多言語リソース
- **Converter** — プラットフォーム別コード生成器

#### 次に読むもの（完了のための 3 リンク）

- `/learn/installation` — 3 分でインストール
- `/learn/hello-world` — 初めての JsonUI 画面
- `/concepts/why-spec-first` — なぜ spec-first アーキテクチャを選んだか

### 2.3 コードサンプル（最低 2 個）

1. **Same JSON, three platforms visual** (json)
```json
{
  "type": "View",
  "orientation": "vertical",
  "paddings": [24, 24, 24, 24],
  "child": [
    { "type": "Label", "text": "Hello, JsonUI", "fontSize": 32, "fontWeight": "bold" },
    { "type": "Button", "text": "Tap me", "onClick": "@{onTap}" }
  ]
}
```

2. **Generated output on three platforms** — side-by-side code blocks
  - **iOS (SwiftUI)**:
    ```swift
    VStack {
      Text("Hello, JsonUI").font(.system(size: 32, weight: .bold))
      Button("Tap me", action: viewModel.onTap)
    }
    .padding(24)
    ```
  - **Android (Compose)**:
    ```kotlin
    Column(modifier = Modifier.padding(24.dp)) {
      Text("Hello, JsonUI", fontSize = 32.sp, fontWeight = FontWeight.Bold)
      Button(onClick = viewModel::onTap) { Text("Tap me") }
    }
    ```
  - **Web (React)**:
    ```tsx
    <div className="flex flex-col p-6">
      <h1 className="text-3xl font-bold">Hello, JsonUI</h1>
      <button onClick={viewModel.onTap}>Tap me</button>
    </div>
    ```

### 2.4 strings 追加キー

prefix: `learn_what_is_jsonui_*`

- `_hero_title`, `_hero_subtitle`
- `_one_json_section_title`, `_one_json_section_body`
- `_why_jsonui_title`, `_why_jsonui_point_{1,2,3}_{title,body}`
- `_competitors_table_header_*`
- `_architecture_title`, `_architecture_body`
- `_next_steps_title`

---

## 3. `/learn/hello-world`

### 3.1 ページの目的
- en: "From `jui init` to a running Hello-World screen on all three platforms in under 10 minutes. Every step must produce visible output."
- ja: "`jui init` から Hello-World 画面を 3 プラットフォーム全てで動かすまでを 10 分で。各ステップで可視的な結果が出ること。"

### 3.2 セクション構成

#### 前提
- JsonUI CLI インストール済み（`/learn/installation` 完了）
- Claude Code または VSCode が起動済み

#### ステップ 1: プロジェクト作成
```bash
$ mkdir my-first-app && cd my-first-app
$ jui init --platforms web,ios,android --project-name HelloWorld
✓ Created jui.config.json
✓ Initialized jsonui-doc-web/
✓ Initialized jsonui-doc-ios/
✓ Initialized jsonui-doc-android/
```

#### ステップ 2: 画面 spec を作成
```bash
$ jui g screen --name HelloWorld --route /
? Display name: Hello World
? Description: First JsonUI screen
✓ Created docs/screens/json/hello-world.spec.json
```

生成された spec の中身を**完全に**掲載:

```json
{
  "type": "screen_spec",
  "version": "1.0",
  "metadata": {
    "name": "HelloWorld",
    "displayName": "Hello World",
    "description": "First JsonUI screen",
    "platforms": ["web", "ios", "android"],
    "layoutFile": "hello-world"
  },
  "stateManagement": {
    "uiVariables": [
      { "name": "message", "type": "String", "initial": "Hello, JsonUI!" },
      { "name": "tapCount", "type": "Int", "initial": "0" }
    ],
    "eventHandlers": [
      { "name": "onTap" }
    ]
  }
}
```

#### ステップ 3: Layout を作成
```bash
$ jui g project --file docs/screens/json/hello-world.spec.json
✓ Generated docs/screens/layouts/hello-world.json
✓ Generated viewmodels: HelloWorldViewModel.{ts,swift,kt}
```

生成された Layout:
```json
{
  "type": "SafeAreaView",
  "id": "hello_world_root",
  "child": [
    {
      "type": "View",
      "orientation": "vertical",
      "gravity": "center",
      "paddings": [24, 24, 24, 24],
      "child": [
        { "type": "Label", "text": "@{message}", "fontSize": 32, "fontWeight": "bold" },
        { "type": "Label", "text": "Tapped @{tapCount} times", "fontSize": 16, "topMargin": 8 },
        { "type": "Button", "text": "Tap me", "onClick": "@{onTap}", "topMargin": 16 }
      ]
    }
  ]
}
```

#### ステップ 4: ViewModel にロジックを追加

生成された ViewModel に `onTap` 実装を追加。3 言語全て掲載:

**TypeScript**:
```typescript
export class HelloWorldViewModel extends ViewModel {
  message = "Hello, JsonUI!";
  tapCount = 0;

  onTap() {
    this.tapCount += 1;
    this.notify();
  }
}
```

**Swift**:
```swift
class HelloWorldViewModel: ObservableObject {
  @Published var message: String = "Hello, JsonUI!"
  @Published var tapCount: Int = 0

  func onTap() {
    tapCount += 1
  }
}
```

**Kotlin**:
```kotlin
class HelloWorldViewModel : ViewModel() {
  private val _message = MutableStateFlow("Hello, JsonUI!")
  val message: StateFlow<String> = _message.asStateFlow()

  private val _tapCount = MutableStateFlow(0)
  val tapCount: StateFlow<Int> = _tapCount.asStateFlow()

  fun onTap() {
    _tapCount.value += 1
  }
}
```

#### ステップ 5: 実行

**Web**:
```bash
$ cd jsonui-doc-web && npm run dev
```
→ ブラウザで http://localhost:3000 を開くと画面表示。

**iOS**:
```bash
$ cd jsonui-doc-ios && sjui hotload start
$ open HelloWorld.xcodeproj
# Xcode で ⌘R を押す
```

**Android**:
```bash
$ cd jsonui-doc-android && kjui watch
# Android Studio で ▶ を押す
```

#### ステップ 6: 変更してホットリロードを確認

`hello-world.json` の Label を `"text": "Hello, 世界!"` に変更し、保存。全プラットフォームで即時反映されることを確認。

#### よくある誤り

- **`@{message}` が文字列 `@{message}` として表示される**: ViewModel の `data` ブロックで `"name": "message"` 宣言が抜けている
- **iOS で Hot Loader が繋がらない**: `sjui hotload status` で接続確認、`Info.plist` の App Transport Security 設定確認
- **Android で Compose preview が出ない**: `kjui watch` が起動していない、または `@Preview` アノテーションが欠落

#### 次に読むもの

- `/learn/first-screen` — もっと凝った画面を作る
- `/learn/data-binding-basics` — ViewModel ↔ UI の bind を深掘り
- `/guides/writing-your-first-spec` — spec 設計の tips

### 3.3 strings 追加キー

prefix: `learn_hello_world_*`

- `_step_{1..6}_{title,body}`
- `_step_3_expected_output`, `_step_4_vm_title`
- `_pitfalls_{1..3}_{title,body}`
- `_next_steps_*`

---

## 4. `/learn/first-screen`

### 4.1 ページの目的
- en: "Build a non-trivial screen: a user profile view with avatar, name, bio, and an edit button that navigates to an edit screen. Covers structure, layout, binding, and basic navigation."
- ja: "Hello World よりも込み入った画面を作る。アバター・名前・bio・編集ボタン（編集画面に遷移）を持つユーザープロフィール画面。構造・レイアウト・binding・基本遷移を網羅。"

### 4.2 セクション構成

#### 完成イメージ（テキスト説明 + ASCII で）

```
┌────────────────────────┐
│       [<] Back         │
│                        │
│    (Avatar Image)      │
│                        │
│    Alice Johnson       │
│    Mobile developer    │
│    based in Tokyo      │
│                        │
│   ┌─────────────────┐  │
│   │     Edit        │  │
│   └─────────────────┘  │
└────────────────────────┘
```

#### ステップ 1: spec を作る

spec の完全 JSON（uiVariables に `user` 型、onEdit ハンドラ、User 型の customType 含む）。

#### ステップ 2: Layout を組む

完全な Layout JSON を本文に掲載。SafeAreaView → Header (with Back) → Center VStack (Avatar, Name, Bio) → Button を構造化。

#### ステップ 3: Repository + UseCase

`UserRepository.fetchCurrent()` の実装（3 言語）。

#### ステップ 4: Navigation

`userActions` と `transitions` の spec 記述、および platform-agnostic な `router.push("/edit")` の使い方。実装は plan 29（navigation guide）に委ねる。

#### ステップ 5: エラーハンドリング

`isLoading` / `errorMessage` を ViewModel に追加、`displayLogic` でインジケータと再試行 UI を制御。

#### よくある誤り

- Collection を使うべき場面で `child` を使ってしまう
- Binding の型ミスマッチ（`Int` を `String` にバインド → ビルド警告）
- Avatar を `Image` ではなく `NetworkImage` で実装していない

### 4.3 コードサンプル（最低 8 個）

- spec JSON（完全）
- Layout JSON（完全）
- 3 言語の ViewModel 実装
- 3 言語の Repository 実装
- spec の `transitions` 節抜粋

### 4.4 strings 追加キー

prefix: `learn_first_screen_*`

- `_overview_*`, `_step_{1..5}_*`, `_completion_*`
- UI 上のダミー文字列（`learn_first_screen_demo_name`, `_demo_bio` など）

---

## 5. `/learn/data-binding-basics`

### 5.1 ページの目的
- en: "Explain JsonUI's binding system: one-way vs two-way, string resolution vs value binding, expression syntax, and common pitfalls."
- ja: "JsonUI の binding 体系を説明。one-way vs two-way、文字列解決 vs 値 binding、式構文、よくある落とし穴。"

### 5.2 セクション構成

#### 3 種類の binding（再掲）

1. `@{expression}` — 値 binding
2. `@string/key` — 文字列解決
3. `@event(handler)` — イベント binding（代替形式）

#### 1-way vs 2-way

| Component | Attribute | Direction |
|---|---|---|
| Label | `text` | one-way (read) |
| Image | `source` | one-way (read) |
| TextField | `text` | two-way |
| Switch | `value` | two-way |
| SelectBox | `value` | two-way |
| Radio | `selected` | two-way |
| CheckBox | `checked` | two-way |
| Slider | `value` | two-way |

#### 式構文の完全仕様

完全リストと例:
- **Property access**: `@{user.name}`, `@{items[0].title}`, `@{user?.address?.city}`
- **Boolean**: `@{isEnabled && !isLoading}`, `@{score >= 80}`
- **Ternary**: `@{status == 'done' ? 'completed' : 'in progress'}`
- **Coalesce**: `@{displayName ?? 'Unknown'}`
- **Method**: `@{items.count}`, `@{query.length}`
- **String interp**: `"Hello, @{name}!"`, `"Total: ¥@{price * quantity}"`

各を個別のコードサンプルで示す。

#### 文字列補間のルール

```json
{
  "type": "Label",
  "text": "Hello, @{name}! You have @{count} new messages."
}
```

プラットフォーム別の変換:
- iOS: `"Hello, \(viewModel.name)! You have \(viewModel.count) new messages."`
- Android: `"Hello, ${viewModel.name.value}! You have ${viewModel.count.value} new messages."`
- Web: `` `Hello, ${vm.name}! You have ${vm.count} new messages.` ``

#### Computed properties

```json
{
  "stateManagement": {
    "computed": [
      {
        "name": "fullName",
        "type": "String",
        "expression": "firstName + ' ' + lastName"
      }
    ]
  }
}
```

ViewModel 側:
- iOS: `var fullName: String { firstName + " " + lastName }`
- Android: `val fullName: String get() = "$firstName $lastName"`
- Web: `get fullName() { return `${this.firstName} ${this.lastName}` }`

#### displayLogic（条件付き表示）

```json
{
  "stateManagement": {
    "displayLogic": [
      {
        "condition": "hasError",
        "effects": [
          { "element": "error_banner", "state": "visible" },
          { "element": "submit_button", "state": "disabled" }
        ]
      }
    ]
  }
}
```

#### よくある誤り

- `@{user.name}` を `@{user?.name}` で書き忘れ → nil で crash
- String 補間内で `@{` の閉じ忘れ
- Two-way binding を読み取り専用プロパティに向けた → ビルド警告
- `@string/key` を ViewModel の動的文字列バインドと混同する
- computed property が重い（毎レンダリング実行される）

### 5.3 コードサンプル（最低 10 個）

- 1-way の 3 パターン × 1-way の 3 パターン = 6 個
- 補間 2 個
- computed 2 個（3 言語）
- displayLogic 1 個

---

## 6. 必要な strings キー（総括）

各記事の prefix:
- `learn_what_is_jsonui_*`
- `learn_hello_world_*`
- `learn_first_screen_*`
- `learn_data_binding_*`

概算: 各 50 キー × 4 記事 × 2 言語 = 400 キー。

---

## 7. クロスリンク追加先

- `/home` → 「初めての方へ」に `/learn/what-is-jsonui`
- 各 learn 記事末尾 → 次の記事 + 関連 reference ページへ
- `/guides/writing-your-first-spec` → 冒頭に `/learn/first-screen` 完了前提の注記

---

## 8. 実装チェックリスト

- [ ] 4 記事それぞれの `*.spec.json` metadata 更新
- [ ] 4 記事分の strings キー追加
- [ ] Layout 再生成（`jui g project`）
- [ ] 各記事に CodeBlock サンプル配置（完全コード）
- [ ] クロスリンク追加
- [ ] `jui build` / `jui verify` / `jsonui-localize`

---

## 9. セッション分割の推奨境界

- **分割 A**: `what-is-jsonui` + `hello-world`（3〜4 時間、入門の 2 記事）
- **分割 B**: `first-screen` + `data-binding-basics`（4 時間、応用の 2 記事）
