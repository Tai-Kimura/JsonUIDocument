# 36. コンテンツプラン: Concepts セクション拡充（5 記事）

> Scope: 6〜8 時間 / 2 セッション。概念 5 記事（why-spec-first / one-layout-json / data-binding / viewmodel-owned-state / hot-reload）を厚くする。
> 依存: plan 20-24 (reference)、plan 28 (learn) が完成していると引用できて良い。

---

## 1. 対象記事

| URL | spec | 現状 |
|---|---|---|
| `/concepts/why-spec-first` | `docs/screens/json/concepts/why-spec-first.spec.json` | 概念説明あり、CodeBlock 1 |
| `/concepts/one-layout-json` | `.../one-layout-json.spec.json` | 概念説明あり、CodeBlock 4 |
| `/concepts/data-binding` | `.../data-binding.spec.json` | 概念説明あり、CodeBlock 2 |
| `/concepts/viewmodel-owned-state` | `.../viewmodel-owned-state.spec.json` | 概念説明あり、CodeBlock 1 |
| `/concepts/hot-reload` | `.../hot-reload.spec.json` | **完全スタブ**、CodeBlock 0 |

完成条件: 各記事 CodeBlock ≥ 4、クロスリンク ≥ 3。

---

## 2. `/concepts/why-spec-first`

### セクション

#### 2.1 spec-first とは
- en: "All JsonUI work starts from a spec (`*.spec.json`). The spec is the single source of truth; Layout JSON and ViewModel stubs are mechanically derived."
- ja: "JsonUI では全ての作業が spec（`*.spec.json`）から始まる。spec が単一情報源で、Layout JSON と ViewModel スタブは機械的に導出される。"

#### 2.2 なぜ仕様を先に書くのか

3 つの理由:

1. **AI エージェントとの協業**
   - エージェントは spec を読んで Layout / ViewModel / Test を生成できる
   - spec が古いとエージェントの判断が壊れる → 常に spec を最新に
   - Plan 18 の `conductor` → `define` → `implement` の流れ

2. **3 プラットフォームの同一性保証**
   - spec が 1 つなら、iOS / Android / Web で同じ責務を持つ ViewModel が生成される
   - 手書きだとプラットフォーム間で振る舞いがズレる

3. **ドキュメントが副産物として出てくる**
   - `jsonui-doc generate spec` で HTML 文書を出せる
   - spec を更新するたびに文書も最新

#### 2.3 spec が含むもの（抜粋）

```json
{
  "metadata": { "name": "...", "displayName": "...", "description": "..." },
  "structure": { ... },
  "stateManagement": { "uiVariables": [...], "eventHandlers": [...] },
  "dataFlow": { "viewModel": {...}, "repositories": [...], "apiEndpoints": [...] },
  "userActions": [...],
  "transitions": [...]
}
```

各フィールドの意義を 1 段落ずつ。

#### 2.4 ワークフロー全体像

```
  conductor (entry)
       │
       ▼
  define (spec authoring)
       │
       ▼
  implement (jui g project + hand tweaks)
       │
       ▼
  test (jui build / verify / localize)
       │
       ▼
  ship
```

#### 2.5 反例: spec-less で始めたとき何が起きるか

ケーススタディ:
- Layout JSON を直接書き始めた
- 3 プラットフォームのうち Web だけに特化した API 依存が入った
- Android に移植したらその API がなかった
- Spec を後から書き起こすのは元の意図を失って難しい

→ **spec-first が唯一持続可能な道**

#### 2.6 spec-first の代償

- 初期学習コスト: spec の構造を覚える必要
- 小さな変更でも spec 更新が必要（ただしスクリプトが補助する）
- 既存プロジェクトの移行コスト（plan 16 参照）

利得が十分大きいのでトレードオフとして受け入れる。

### コードサンプル（最低 4 個）

1. 最小 spec の全文
2. spec → Layout JSON への変換結果
3. エージェントが spec を読んで Layout を書き直す一連の会話（擬似 transcript）
4. Bad example: spec と乖離した手書き Layout JSON

---

## 3. `/concepts/one-layout-json`

### セクション

#### 3.1 コア主張: 「1 JSON、3 プラットフォーム」

- en: "A single Layout JSON file is converted to SwiftUI / UIKit on iOS, Jetpack Compose / XML on Android, and React (Next.js) on the web."
- ja: "単一の Layout JSON ファイルが、iOS で SwiftUI / UIKit、Android で Jetpack Compose / XML、Web で React (Next.js) に変換される。"

#### 3.2 同一 JSON の変換結果を並列で

同じ JSON から 5 種類のネイティブコードが出る。完全な CodeBlock で並列表示:

**Layout JSON**:
```json
{
  "type": "View",
  "orientation": "horizontal",
  "child": [
    { "type": "Image", "source": "avatar", "width": 40, "height": 40 },
    { "type": "Label", "text": "@{userName}", "weight": 1 }
  ]
}
```

**SwiftUI**:
```swift
HStack {
  Image("avatar").frame(width: 40, height: 40)
  Text(viewModel.userName).frame(maxWidth: .infinity, alignment: .leading)
}
```

**UIKit** (抜粋):
```swift
let view = UIView()
view.axis = .horizontal
let image = UIImageView(image: UIImage(named: "avatar"))
image.widthAnchor.constraint(equalToConstant: 40).isActive = true
// ...
```

**Compose**:
```kotlin
Row {
  Image(painterResource(R.drawable.avatar), null, Modifier.size(40.dp))
  Text(viewModel.userName.value, Modifier.weight(1f))
}
```

**XML**:
```xml
<LinearLayout android:orientation="horizontal">
  <ImageView android:src="@drawable/avatar" android:layout_width="40dp" android:layout_height="40dp"/>
  <TextView android:text="@{viewModel.userName}" android:layout_width="0dp" android:layout_weight="1"/>
</LinearLayout>
```

**React (Next.js + Tailwind)**:
```tsx
<div className="flex flex-row">
  <img src="/avatar.png" className="w-10 h-10" />
  <span className="flex-1">{viewModel.userName}</span>
</div>
```

#### 3.3 何が共有され、何がプラットフォーム固有か

| 共有 | プラットフォーム固有 |
|---|---|
| Layout 構造 | Native API 呼び出し（NavigationController / NavController / Router） |
| コンポーネント名 / 属性 | ネイティブ UI ライブラリ固有の装飾（UIKit の `traitCollection` 等） |
| Binding 意味論 | プラットフォーム固有のアニメーション |
| Style preset | Theme（Material vs Apple Human Interface） |

#### 3.4 差分が出るケースの扱い

差分は以下の 3 段階で吸収:
1. **Layout JSON の `platforms` 属性**: そのコンポーネントを描画するプラットフォームを絞る
2. **`style` ベースの分岐**: Material / iOS / Web で異なる style JSON を読む
3. **Custom component**: 完全独自な UI は component spec から書く（plan 32）

#### 3.5 限界

- 極端にプラットフォーム固有な機能（iOS の 3D Touch、Android の Widget）は JsonUI の範囲外
- そういう機能は native code で書き、JsonUI は単に包含（UIViewRepresentable 等）する

### コードサンプル（最低 6 個）

§3.2 で 5 個、§3.4 で 1 個。

---

## 4. `/concepts/data-binding`

### セクション

#### 4.1 Binding の 3 種類

1. `@{expression}` — value binding（ViewModel への参照）
2. `@string/key` — 文字列解決
3. `@event(handler)` — イベント binding

#### 4.2 Direction

- One-way: Label / Image / 装飾属性
- Two-way: TextField / Switch / SelectBox 等の編集コンポーネント

両方向の動作フロー図（テキスト diagram）:

```
[One-way]
ViewModel.state ──(notify)──> Layout render

[Two-way]
User input ──(onChange)──> ViewModel.state ──(notify)──> Layout render
```

#### 4.3 Expression 構文（完全仕様は plan 24 参照）

主要な例のみ（5〜10 個）:
- Property access: `@{user.name}`
- Boolean: `@{isEnabled && !isLoading}`
- Ternary: `@{count > 0 ? 'items' : 'empty'}`
- Coalesce: `@{name ?? 'Anonymous'}`

#### 4.4 Computed properties

```json
{
  "stateManagement": {
    "computed": [
      { "name": "fullName", "type": "String", "expression": "firstName + ' ' + lastName" }
    ]
  }
}
```

→ ViewModel 側で自動生成される（plan 28 参照）。

#### 4.5 displayLogic（条件付き表示）

```json
{
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
```

仕様と ViewModel 実装への変換ルール。

#### 4.6 パフォーマンス注意

- Expression は**毎レンダリング評価される** → 重い計算は computed に切り出す
- `displayLogic` のトリガー条件は ViewModel の `@Published` に依存させる
- Collection 内の binding: `@{item.*}` は item ごとに閉じ込められる（親 VM を参照しない）

### コードサンプル（最低 6 個）

各 §4.3, §4.4, §4.5 に具体例 + 誤り例。

---

## 5. `/concepts/viewmodel-owned-state`

### セクション

#### 5.1 「UI は ViewModel の反映でしかない」

- en: "In JsonUI, the Layout JSON never owns state. Every value rendered is a readback from the ViewModel."
- ja: "JsonUI では Layout JSON が状態を持つことはない。描画される値は全て ViewModel からの読み出しである。"

#### 5.2 なぜ ViewModel 所有にこだわるか

3 つの理由:

1. **テスタビリティ**
   - UI を起動せず ViewModel を単体テストできる
   - screen test（plan 31）は ViewModel 初期状態を上書きしてから実行
2. **プラットフォーム同一性**
   - iOS / Android / Web の ViewModel が同じロジックを持てば、UI だけが差分
3. **Serialization**
   - ViewModel の状態を JSON 化してバックアップ／復元可能
   - A/B test での state injection

#### 5.3 ViewModel の境界

何を ViewModel に置くか:
- ✅ UI に表示する全ての値
- ✅ UI イベントハンドラ
- ✅ UI の表示条件（hasError, isLoading）
- ✅ フォームの入力値（two-way binding 先）

何を ViewModel に**置かない**か:
- ❌ ビジネスロジック → UseCase
- ❌ API 呼び出し → Repository
- ❌ 永続化 → DataSource
- ❌ Navigation の実行 → Router

#### 5.4 ViewModel と Repository / UseCase の関係

```
[UI]
  ↓ uses
[ViewModel]
  ↓ calls
[UseCase]
  ↓ calls
[Repository]
  ↓ calls
[DataSource (API / DB)]
```

#### 5.5 ViewModel 間の通信

- 親子 ViewModel: 親が子を `init(...)` 注入
- 兄弟 ViewModel: 共通 Parent で保持するか、SharedState サービス経由

#### 5.6 反例（「UI owned state」の問題）

ローカル UI 状態を直接 View 側で持つと:
- 同じ state を別の View も読みたくなると、state を lift する必要が発生
- テストのために UI を起動しないといけない
- プラットフォーム間でロジックがズレる

### コードサンプル（最低 4 個）

1. ViewModel のフル責務範囲（3 言語）
2. Repository / UseCase 呼び出しの典型パターン
3. Bad example: UI 内部 state を持ってしまった場合
4. 親子 ViewModel 通信の正解

---

## 6. `/concepts/hot-reload`

### セクション（**完全スタブなので重点的に書く**）

#### 6.1 Hot Reload vs Hot Loader の違い

| 用語 | 意味 |
|---|---|
| Hot Reload | Layout JSON / strings / styles の変更を**再ビルドなし**で反映 |
| Hot Loader | Hot Reload を実現する仕組み（サーバー + プロトコル + 受け手） |

#### 6.2 プラットフォーム別の Hot Loader

| プラットフォーム | サーバー | 受け手 | 反映速度 |
|---|---|---|---|
| iOS | `sjui hotload start` (WebSocket on port 8080) | `SJUIViewController` が WebSocket 購読 | ~100ms |
| Android | `kjui hotload start` (ADB forward + WebSocket) | Fragment / Compose observer | ~150ms |
| Web | Next.js HMR（`npm run dev`） | Next.js client | ~50ms |

#### 6.3 何が Hot Reload されるか

- ✅ Layout JSON
- ✅ strings.json
- ✅ styles/*.json
- ✅ cells/*.json
- ❌ ViewModel Swift/Kotlin/TS コード（Hot Reload 不可、通常再ビルド）
- ❌ Custom component converter

#### 6.4 Hot Loader 起動手順（3 プラットフォーム）

**iOS**:
```bash
$ cd jsonui-doc-ios
$ sjui hotload start
Hot Loader server running on ws://localhost:8080
```
アプリ側:
```swift
// AppDelegate.swift
SJUIHotLoader.shared.start(url: "ws://localhost:8080")
```

**Android**:
```bash
$ adb reverse tcp:8081 tcp:8081
$ cd jsonui-doc-android
$ kjui hotload start
Hot Loader server running on ws://localhost:8081
```
アプリ側:
```kotlin
// Application.kt
KjuiHotLoader.start("ws://localhost:8081")
```

**Web**:
```bash
$ cd jsonui-doc-web
$ npm run dev
```
Next.js HMR が自動で ReactJsonUI ファイルを watch。

#### 6.5 プロトコル（簡易）

Client ↔ Server で JSON メッセージを交換:

```
C→S: { "type": "hello", "platform": "ios", "version": "1.0" }
S→C: { "type": "initial", "layouts": { ... }, "strings": { ... } }

// File change event:
S→C: { "type": "update", "path": "layouts/home.json", "content": { ... } }
C→S: { "type": "ack", "path": "layouts/home.json" }
```

#### 6.6 Dynamic Mode との違い

| | Hot Loader | Dynamic Mode |
|---|---|---|
| 目的 | 開発中の即時反映 | 本番での動的 UI 配信 |
| 配信元 | ローカル | CDN / remote config |
| ビルド不要 | 両方 | 両方 |
| Apple App Review | 対象外（dev only） | 一部 guidelines 注意 |

#### 6.7 トラブルシューティング

- Hot Loader サーバーに繋がらない → ポート確認、ATS 設定、NetworkSecurityConfig
- Layout 更新後に ViewModel 状態が飛ぶ → 想定内（現実装では state を保持しない）
- 循環 import が発生した → Layout の `include` グラフに循環が入っていないか確認

### コードサンプル（最低 6 個）

§6.4 各プラットフォームのサーバー起動 + app 側、§6.5 プロトコル、§6.7 の対処。

---

## 7. 必要 strings キー（総括）

各記事の prefix:
- `concepts_why_spec_first_*`
- `concepts_one_layout_json_*`
- `concepts_data_binding_*`
- `concepts_viewmodel_state_*`
- `concepts_hot_reload_*`

概算 50 キー × 5 記事 × 2 言語 = 500 キー。

---

## 8. クロスリンク追加先

- `/learn/what-is-jsonui` 末尾 → 全 5 concepts
- `/reference/attributes/binding` → `/concepts/data-binding`
- `/guides/writing-your-first-spec` → `/concepts/why-spec-first`
- `/platforms/swift/hot-loader`（plan 33）等から `/concepts/hot-reload`

---

## 9. 実装チェックリスト

- [ ] 5 記事の spec metadata 更新
- [ ] 5 記事分の strings キー追加
- [ ] Layout 生成
- [ ] CodeBlock の完全コード掲載
- [ ] クロスリンク追加
- [ ] `jui build` / `jui verify` / `jsonui-localize`

---

## 10. セッション分割の推奨境界

- **分割 A**: why-spec-first + one-layout-json + data-binding（4 時間）
- **分割 B**: viewmodel-owned-state + hot-reload（3〜4 時間、hot-reload が重い）
