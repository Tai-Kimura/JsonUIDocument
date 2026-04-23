# 40. コンテンツプラン: Tools — `/tools/test-runner` 記事群

> Scope: 3〜5 時間 / 1〜2 セッション。plan 10 の test-runner ページ構成に対応。
> 依存: plan 10（構造設計）、plan 31（guides/testing）。

plan 31 は**書き手向け**（テスト JSON の書き方）、本プランは**実行・運用向け**（runner の仕組み・CI 統合・drivers）。

---

## 1. 対象記事

| URL | 役割 |
|---|---|
| `/tools/test-runner/overview` | test-runner 全体像 |
| `/tools/test-runner/install` | インストール |
| `/tools/test-runner/drivers/web` | Playwright driver |
| `/tools/test-runner/drivers/ios` | XCUITest driver |
| `/tools/test-runner/drivers/android` | UIAutomator driver |
| `/tools/test-runner/actions-reference` | 全 action タイプのリファレンス |
| `/tools/test-runner/assertions-reference` | 全 assertion タイプのリファレンス |
| `/tools/test-runner/mocks` | API / ViewModel / clock mock の詳細 |
| `/tools/test-runner/ci-integration` | CI 統合パターン |
| `/tools/test-runner/debugging` | テスト失敗時の調査 |
| `/tools/test-runner/custom-actions` | action 拡張 |
| `/tools/test-runner/troubleshooting` | トラブルシューティング |

---

## 2. 各ページの書き下ろすべき内容

### 2.1 `/tools/test-runner/overview`

**一文定義**
- en: "jsonui-test-runner executes platform-agnostic test JSON against platform-specific drivers (Playwright for Web, XCUITest for iOS, UIAutomator for Android)."
- ja: "jsonui-test-runner は platform-agnostic なテスト JSON を、プラットフォーム固有 driver（Web は Playwright、iOS は XCUITest、Android は UIAutomator）で実行する。"

**3 driver 一覧表**

| Driver | 対象 | Backend | 実行コマンド |
|---|---|---|---|
| Web | Browser (Chrome/Firefox/Safari) | Playwright | `jsonui-test run --driver web` |
| iOS | iOS Simulator or device | XCUITest via xcodebuild | `jsonui-test run --driver ios` |
| Android | Android Emulator or device | UIAutomator via instrumentation | `jsonui-test run --driver android` |

**テスト種別**

| Type | ファイル | 役割 |
|---|---|---|
| Screen test | `*.test.json` | 単一画面内の検証 |
| Flow test | `*.flow.json` | 画面遷移を含む検証 |
| Action test | `*.action.json` | 再利用可能な操作ユニット |

**実行フロー**
1. `jsonui-test` が対象ファイルを集める
2. driver 固有のテストコードに変換（Playwright なら `.spec.ts`、XCUITest なら `.swift`、UIAutomator なら `.kt`）
3. 実行 → 結果をパース → 統一 JSON format で出力

#### コードサンプル
1. 最小 test JSON + driver 実行ログ

---

### 2.2 `/tools/test-runner/install`

- `jsonui-cli` 一括インストールに含まれる
- driver 別追加要件:
  - Web: `npx playwright install` + browsers
  - iOS: Xcode + Simulator
  - Android: Android SDK + Emulator
- CI 環境での準備

---

### 2.3 `/tools/test-runner/drivers/web`

#### セクション
- Playwright の概要
- 変換プロセス（JSON → `.spec.ts`）
- ブラウザマルチプル対応（Chromium / Firefox / WebKit）
- 並列実行
- スクリーンショット・動画記録
- Network intercept（モック API）の仕組み

#### コードサンプル
1. 生成された Playwright `.spec.ts` のリーディング
2. 並列実行コマンド
3. `playwright.config.ts` のカスタマイズ

---

### 2.4 `/tools/test-runner/drivers/ios`

- XCUITest の概要
- 変換プロセス（JSON → `.swift` テストクラス）
- Simulator 起動オプション（device, OS version）
- Accessibility Identifier = test ID の設計
- Network intercept (MITM or stub server)

#### コードサンプル
1. 生成された XCUITest Swift コード
2. `xcodebuild test -scheme ...` コマンド
3. シミュレータ指定例

---

### 2.5 `/tools/test-runner/drivers/android`

- UIAutomator の概要
- 変換プロセス（JSON → Kotlin テストクラス）
- Emulator or device 指定
- `testTag` = test ID 設計（Compose）vs `resource-id`（XML）
- Network intercept (OkHttp MockWebServer)

#### コードサンプル
1. 生成された Kotlin テストコード
2. `./gradlew connectedCheck` コマンド

---

### 2.6 `/tools/test-runner/actions-reference`

全 action タイプの引数・挙動リファレンス（plan 31 §2.3 の拡張版）。

| Action | 引数 | プラットフォーム別動作 |
|---|---|---|
| `tap` | `elementId` | iOS: `.tap()`, Android: `click()`, Web: `click()` |
| `doubleTap` | `elementId` | iOS: `.doubleTap()`, Android: `click()`x2, Web: `dblclick()` |
| `longPress` | `elementId`, `durationMs` | iOS: `.press(forDuration:)`, Android: `longClick()`, Web: mouseDown/mouseUp |
| `type` | `elementId`, `text` | 各 driver に対応 |
| `clear` | `elementId` | 入力クリア |
| `scroll` | `elementId`, `to`/`by` | 方向・距離指定 |
| `swipe` | `elementId`, `direction`, `distance` | 方向スワイプ |
| `wait` | `elementId`, `property`, `equals`, `timeoutMs` | 条件待機 |
| `select` | `elementId`, `value` | SelectBox 選択 |
| `back` | - | 端末 back / ブラウザ back |
| `forward` | - | ブラウザ forward |
| `navigate` | `route` | 直接 URL/route ジャンプ |
| `run_action` | `path`, `args` | 他 action file を呼び出し |
| `screenshot` | `name` | スクリーンショット保存 |
| `sleep` | `durationMs` | 指定時間待機（避ける） |

各 action について、完全な例を CodeBlock で。

---

### 2.7 `/tools/test-runner/assertions-reference`

全 assertion タイプのリファレンス:

| Assertion | 対象 | 例 |
|---|---|---|
| `property equals` | element | `{ "elementId": "...", "property": "text", "equals": "..." }` |
| `property contains` | element text | `{ "elementId": "...", "property": "text", "contains": "..." }` |
| `visible` | element | `{ "elementId": "...", "property": "visible", "equals": true }` |
| `enabled` | element | `{ "elementId": "...", "property": "enabled", "equals": false }` |
| `viewModel` | ViewModel field | `{ "viewModel": "tapCount", "equals": 1 }` |
| `route` | current route | `{ "route": "/profile" }` |
| `api called` | mock | `{ "api": "/api/login", "called": 1, "with": { ... } }` |
| `screenshot matches` | visual | `{ "screenshot": "baseline/home.png", "threshold": 0.02 }` |
| `a11y` | accessibility | `{ "elementId": "...", "a11y": { "label": "Submit", "role": "button" } }` |

各 assertion の完全例と典型的な失敗メッセージ例。

---

### 2.8 `/tools/test-runner/mocks`

#### セクション

**API モック**
- `setup.mocks` の各フィールド（`endpoint`, `method`, `response`, `statusCode`, `delayMs`, `headers`）
- パスパラメータ（`:id`）の扱い
- クエリパラメータの match
- 呼出し履歴の検証

**ViewModel モック**
- 初期状態上書き
- Computed property 設定時の注意

**Clock モック**
- 固定日時
- 時刻進行制御（`advance` action）

**外部サービスモック**
- Analytics
- Push notifications
- カメラ / ロケーション

#### コードサンプル
1. 全種類の mock 定義を含む `setup` 例
2. Clock 進行を含むテスト

---

### 2.9 `/tools/test-runner/ci-integration`

#### セクション

**GitHub Actions**
- 3 プラットフォーム全て動かすサンプル workflow（plan 31 と同じだが本ページがメイン）
- キャッシュ戦略（node_modules, Xcode DerivedData, Gradle cache）
- Flaky test 対策（retry, artifact upload）

**Circle CI / GitLab CI**
- 最小サンプル

**並列化**
- driver ごとに並列ジョブ
- テストファイルごとの shard

**PR 自動コメント**
- 結果要約を PR にコメントする bot の設置

#### コードサンプル
1. `github-actions.yml` 完全
2. 並列シャーディングの設定

---

### 2.10 `/tools/test-runner/debugging`

- 失敗ログの読み方（driver 別）
- スクリーンショット・動画・トレースの見方
- `--headed` / `--slowmo` で視覚確認
- 特定ケースのみ実行（`--test-case <name>`）
- breakpoint の入れ方（Playwright: `page.pause()`、Xcode: `sleep()`）

#### コードサンプル
1. 失敗時 trace output
2. `--headed --slowmo` 実行

---

### 2.11 `/tools/test-runner/custom-actions`

独自 action を追加する方法（例: `login`, `addToCart`）。

- Action test ファイルで定義（plan 31 §2.6）
- 内部 action での `custom_action` 呼び出し
- パラメータ化
- 戻り値の扱い

---

### 2.12 `/tools/test-runner/troubleshooting`

- 要素が見つからない → ID 確認、タイミング確認
- Flaky テスト → wait 条件の見直し、`sleep` を減らす
- iOS Simulator 起動失敗 → Xcode 再インストール、`xcrun simctl` で確認
- Android Emulator 起動しない → KVM、`-no-snapshot-load`

---

## 3. 必要 strings キー

prefix: `tools_test_runner_<page>_*`

概算 200 キー × 2 言語。

---

## 4. クロスリンク追加先

- `/guides/testing` → 全 driver ページ + `actions-reference`
- `/reference/cli-commands` の `jsonui-test` 節から各ページ
- `/platforms/*/troubleshooting` → `/tools/test-runner/troubleshooting`

---

## 5. 実装チェックリスト

- [ ] 12 ページ分 spec 作成
- [ ] strings キー追加
- [ ] Layout 生成
- [ ] 各ページ CodeBlock ≥ 2
- [ ] Actions / Assertions リファレンスの表完成
- [ ] CI サンプル完全
- [ ] クロスリンク追加
- [ ] `jui build` / `jui verify` / `jsonui-localize`

---

## 6. セッション分割の推奨境界

- **分割 A**: overview + install + 3 drivers（5 ページ、2-3 時間）
- **分割 B**: actions / assertions / mocks reference（3 ページ、2 時間）
- **分割 C**: CI + debugging + custom + troubleshooting（4 ページ、1-2 時間）
