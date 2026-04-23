# 31. コンテンツプラン: Guides — Testing

> Scope: 5〜7 時間 / 2 セッション。`/guides/testing` を完成。テスト JSON の完全スキーマと 5+ の具体例。
> 依存: plan 10 (test-runner 構造設計)、plan 27 (json-schema)。

---

## 1. 対象記事

| URL | spec | Layout | 現状 |
|---|---|---|---|
| `/guides/testing` | `docs/screens/json/guides/testing.spec.json` | `docs/screens/layouts/guides/testing.json` | 骨組みのみ、CodeBlock 0 |

完成条件: CodeBlock ≥ 15（テスト 5 件 × 3 プラットフォーム driver）、クロスリンク ≥ 4。

---

## 2. コンテンツ構造

### 2.1 ページの目的
- en: "Write tests for JsonUI screens in platform-agnostic JSON, then run them via the driver for your target platform (XCUITest on iOS, UIAutomator on Android, Playwright on Web)."
- ja: "JsonUI 画面のテストをプラットフォーム非依存な JSON で書き、対象プラットフォームの driver（iOS は XCUITest、Android は UIAutomator、Web は Playwright）で実行する。"

### 2.2 テストの種類

| Type | ファイル | 役割 |
|---|---|---|
| Screen test | `tests/screens/<name>.test.json` | 単一画面内の UI 操作・表示検証 |
| Flow test | `tests/flows/<name>.flow.json` | 複数画面をまたぐユーザーフロー |
| Action test | `tests/actions/<name>.action.json` | 再利用可能な操作ユニット |

### 2.3 Screen test の完全スキーマ

```json
{
  "type": "screen_test",
  "version": "1.0",
  "target": {
    "screen": "LearnHelloWorld",
    "route": "/learn/hello-world"
  },
  "setup": {
    "mocks": [
      { "endpoint": "/api/greeting", "response": { "message": "Hi!" } }
    ],
    "viewModel": {
      "message": "Hello, Test!",
      "tapCount": 0
    }
  },
  "cases": [
    {
      "name": "renders initial state",
      "actions": [],
      "assertions": [
        { "elementId": "message_label", "property": "text", "equals": "Hello, Test!" }
      ]
    },
    {
      "name": "increments on tap",
      "actions": [
        { "type": "tap", "elementId": "tap_button" }
      ],
      "assertions": [
        { "elementId": "count_label", "property": "text", "equals": "Tapped 1 times" }
      ]
    }
  ]
}
```

#### フィールド詳細

**`target`**:
- `screen`: ViewModel class name
- `route`: URL for navigation
- `platforms`: optional array to restrict (default: all)

**`setup.mocks`**: API モック定義
**`setup.viewModel`**: ViewModel の初期値上書き

**`cases[].actions`**: 順に実行する操作
- `{ "type": "tap", "elementId": "..." }`
- `{ "type": "type", "elementId": "...", "text": "..." }`
- `{ "type": "scroll", "elementId": "...", "to": "bottom" }`
- `{ "type": "wait", "elementId": "...", "visible": true, "timeoutMs": 5000 }`
- `{ "type": "swipe", "elementId": "...", "direction": "left" }`
- `{ "type": "longPress", "elementId": "...", "durationMs": 1000 }`
- `{ "type": "select", "elementId": "...", "value": "..." }`
- `{ "type": "back" }` / `{ "type": "forward" }`

**`cases[].assertions`**: 実行後の状態検証
- `{ "elementId": "...", "property": "text", "equals": "..." }`
- `{ "elementId": "...", "property": "visible", "equals": true }`
- `{ "elementId": "...", "property": "enabled", "equals": false }`
- `{ "viewModel": "tapCount", "equals": 1 }`
- `{ "api": "/api/greeting", "called": 1 }`（モック呼出し回数）
- `{ "route": "/user/profile" }`（現在の URL/ルート）

### 2.4 サンプルテスト 5 件

#### Sample 1: 基本タップと状態更新

```json
{
  "type": "screen_test",
  "target": { "screen": "HelloWorld", "route": "/" },
  "cases": [
    {
      "name": "tap increments counter",
      "actions": [
        { "type": "tap", "elementId": "tap_button" }
      ],
      "assertions": [
        { "elementId": "count_label", "property": "text", "equals": "Tapped 1 times" },
        { "viewModel": "tapCount", "equals": 1 }
      ]
    }
  ]
}
```

#### Sample 2: フォーム入力とバリデーション

```json
{
  "type": "screen_test",
  "target": { "screen": "Login", "route": "/login" },
  "cases": [
    {
      "name": "shows error for invalid email",
      "actions": [
        { "type": "type", "elementId": "email_field", "text": "invalid" },
        { "type": "tap", "elementId": "submit_button" }
      ],
      "assertions": [
        { "elementId": "email_error", "property": "text", "equals": "Invalid email" },
        { "elementId": "email_error", "property": "visible", "equals": true }
      ]
    },
    {
      "name": "submits valid form",
      "setup": { "viewModel": { "email": "", "password": "" } },
      "actions": [
        { "type": "type", "elementId": "email_field", "text": "user@example.com" },
        { "type": "type", "elementId": "password_field", "text": "pass123" },
        { "type": "tap", "elementId": "submit_button" }
      ],
      "assertions": [
        { "api": "/api/login", "called": 1 },
        { "route": "/home" }
      ]
    }
  ]
}
```

#### Sample 3: Collection のスクロール

```json
{
  "type": "screen_test",
  "target": { "screen": "UserList", "route": "/users" },
  "setup": {
    "mocks": [
      { "endpoint": "/api/users", "response": [ ... 50 users ... ] }
    ]
  },
  "cases": [
    {
      "name": "loads more on scroll",
      "actions": [
        { "type": "scroll", "elementId": "user_list", "to": "bottom" },
        { "type": "wait", "elementId": "loading_indicator", "visible": false, "timeoutMs": 3000 }
      ],
      "assertions": [
        { "api": "/api/users?page=2", "called": 1 }
      ]
    }
  ]
}
```

#### Sample 4: 非同期処理

```json
{
  "type": "screen_test",
  "target": { "screen": "ProductDetail", "route": "/product/123" },
  "setup": {
    "mocks": [
      { "endpoint": "/api/products/123", "response": { ... }, "delayMs": 500 }
    ]
  },
  "cases": [
    {
      "name": "shows loading then content",
      "assertions": [
        { "elementId": "loading_indicator", "property": "visible", "equals": true }
      ],
      "actions": [
        { "type": "wait", "elementId": "product_name", "visible": true, "timeoutMs": 2000 }
      ],
      "additionalAssertions": [
        { "elementId": "loading_indicator", "property": "visible", "equals": false }
      ]
    }
  ]
}
```

#### Sample 5: プラットフォーム限定

```json
{
  "type": "screen_test",
  "target": { "screen": "Settings", "route": "/settings", "platforms": ["ios"] },
  "cases": [
    {
      "name": "hapticFeedback triggered on toggle",
      "actions": [
        { "type": "tap", "elementId": "notifications_switch" }
      ],
      "assertions": [
        { "elementId": "notifications_switch", "property": "value", "equals": true },
        { "platformSpecific": { "ios": { "hapticsCallCount": 1 } } }
      ]
    }
  ]
}
```

### 2.5 Flow test の完全スキーマ

```json
{
  "type": "flow_test",
  "version": "1.0",
  "name": "user_signup_happy_path",
  "description": "User signs up, verifies email, completes profile",
  "steps": [
    { "screen_test": "tests/screens/signup.test.json", "case": "fills form successfully" },
    { "screen_test": "tests/screens/verify_email.test.json", "case": "clicks verification link" },
    { "screen_test": "tests/screens/profile_setup.test.json", "case": "sets avatar and bio" }
  ]
}
```

各 `step` は screen test への参照 + 特定の case 名。順次実行され、前のテストの最終状態が次に引き継がれる。

### 2.6 Action test（再利用可能な操作）

```json
{
  "type": "action_test",
  "version": "1.0",
  "name": "login_as_test_user",
  "parameters": [
    { "name": "email", "type": "String", "default": "test@example.com" },
    { "name": "password", "type": "String", "default": "password123" }
  ],
  "actions": [
    { "type": "navigate", "route": "/login" },
    { "type": "type", "elementId": "email_field", "text": "{email}" },
    { "type": "type", "elementId": "password_field", "text": "{password}" },
    { "type": "tap", "elementId": "submit_button" },
    { "type": "wait", "route": "/home", "timeoutMs": 5000 }
  ]
}
```

screen test から呼ぶ:
```json
{
  "cases": [
    {
      "name": "logged-in user sees dashboard",
      "setup": {
        "actions": [
          { "type": "run_action", "path": "tests/actions/login.action.json", "args": { "email": "alice@example.com" } }
        ]
      },
      ...
    }
  ]
}
```

### 2.7 driver 別の実行方法

#### Web (Playwright)

```bash
$ jsonui-test run --driver web --spec tests/screens/hello-world.test.json
```

内部で Playwright の test runner を起動し、Next.js dev サーバーに接続。

#### iOS (XCUITest)

```bash
$ jsonui-test run --driver ios --spec tests/screens/hello-world.test.json
```

要件: Xcode、iOS Simulator。内部で `xcodebuild test` を呼び、JSON を XCUITest の test method に展開。

#### Android (UIAutomator)

```bash
$ jsonui-test run --driver android --spec tests/screens/hello-world.test.json
```

要件: Android SDK、エミュレータまたは USB デバッグ実機。

### 2.8 モック戦略

#### API モック

```json
{
  "setup": {
    "mocks": [
      {
        "endpoint": "/api/users/:id",
        "method": "GET",
        "response": { "id": "123", "name": "Alice" },
        "delayMs": 200
      },
      {
        "endpoint": "/api/users",
        "method": "POST",
        "response": { "id": "new-456" },
        "statusCode": 201
      }
    ]
  }
}
```

#### ViewModel モック

```json
{
  "setup": {
    "viewModel": {
      "currentUser": { "id": "123", "name": "Test User" },
      "notifications": []
    }
  }
}
```

#### 日付・時刻固定

```json
{
  "setup": {
    "clock": "2026-01-01T00:00:00Z"
  }
}
```

### 2.9 要素 ID の付け方

テスト可能な UI には**必ず `id` を付ける**:

```json
{ "type": "Button", "id": "submit_button", "text": "@string/submit" }
```

命名規則:
- `<screen>_<purpose>_button`: `login_submit_button`
- `<screen>_<field>_field`: `login_email_field`
- `<screen>_<target>_label`: `profile_name_label`
- `<screen>_<list>_list`: `home_posts_list`

### 2.10 CI 統合

GitHub Actions の例:

```yaml
name: jsonui-tests
on: [push, pull_request]
jobs:
  web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npx playwright install
      - run: jsonui-test run --driver web tests/

  ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - run: jsonui-test run --driver ios tests/

  android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: android-actions/setup-android@v3
      - run: jsonui-test run --driver android tests/
```

### 2.11 よくある誤り

- 要素 ID を付け忘れ → テストが動的 selector に依存して脆弱に
- モックエンドポイントと実装のパス不一致
- `timeoutMs` が短すぎる → flaky テスト
- ViewModel 状態リセットし忘れ → 前 case の影響が漏れる
- プラットフォーム依存 API をすべてのテストで検証 → iOS-only API が Android CI で失敗

---

## 3. 必要な strings キー

prefix: `guide_testing_*`

- `_intro_*`
- `_types_{screen,flow,action}_{title,body}`
- `_schema_fields_*`
- `_sample_{1..5}_*`
- `_driver_{web,ios,android}_*`
- `_mocks_*`, `_ids_*`, `_ci_*`, `_pitfalls_*`

概算 100 キー × 2 言語。

---

## 4. クロスリンク追加先

- `/learn/first-screen` → 末尾で `/guides/testing` を推奨
- `/tools/test-runner` → 本ガイドへ「使い方」
- `/reference/components/*` → 各コンポーネントのテスト ID 命名例として本ガイド

---

## 5. 実装チェックリスト

- [ ] spec metadata 更新
- [ ] strings キー追加（100+ キー × 2 言語）
- [ ] 5 サンプルテスト全て CodeBlock で掲載
- [ ] 3 driver 別の実行コマンド
- [ ] CI サンプル YAML
- [ ] クロスリンク追加
- [ ] `jui build` / `jui verify` / `jsonui-localize`

---

## 6. セッション分割の推奨境界

- **分割 A**: Screen test + Sample 1-3（3 時間）
- **分割 B**: Flow test + Action test + Sample 4-5 + driver / CI / pitfalls（3 時間）
