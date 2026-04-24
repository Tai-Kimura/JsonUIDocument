# 04 · testing 深堀り

## 現状

4 section: `where` / `dsl` / `runner` / `ci`。heading + body Label のみ、CodeBlock なし。

## 実装現実 vs 現在の記述

**最大のギャップ 1**: CLI 名は `jui test` ではなく **`jsonui-test`**（別リポ `/Users/like-a-rolling_stone/resource/jsonui-test-runner` の Python ツール）。既存の guide body はおそらく `jui test` を示唆している可能性が高い。
**最大のギャップ 2**: screen test と flow test の 2 種類があり schema が違う。現 guide は 1 種類しか書いていない印象。
**最大のギャップ 3**: driver は 3 本（iOS=XCUITest, Android=Espresso+UI Automator, Web=Playwright）で起動方法がまったく違う。一括で language-agnostic に使える印象を出すのは誤り。

### test file の shape

実例: `/Users/like-a-rolling_stone/resource/JsonUIDocument/tests/screens/learn/hello-world.test.json`

schema: `/Users/like-a-rolling_stone/resource/jsonui-test-runner/schemas/screen-test.schema.json`, `flow-test.schema.json`

top-level (screen test):
```json
{
  "type": "screen",
  "source": { "layout": "layouts/learn/hello-world.json" },
  "metadata": { "name": "Hello world — first screen", "tags": [] },
  "platform": "web",
  "initialState": { "viewModel": { "activeTab": "swift" } },
  "setup": [ ... optional ... ],
  "teardown": [ ... optional ... ],
  "cases": [
    { "name": "initial render", "steps": [ ... ] },
    { "name": "switch to react tab", "steps": [ ... ] }
  ]
}
```

### step types

**Actions** (`schemas/actions.schema.json`):
- `tap` — 要 `id` or `text` パラメータ
- `doubleTap`, `longPress` (optional `duration`)
- `input` — 要 `value`
- `clear`, `scroll` (要 `direction`), `swipe`
- `waitFor`, `waitForAny`, `wait` (duration)
- `back`, `screenshot` (要 `name`)
- `alertTap`, `selectOption`, `tapItem`, `selectTab`

**Assertions**:
- `visible`, `notVisible`, `enabled`, `disabled`
- `text` (optional `equals` or `contains`)
- `count` (要 `equals`)
- `state` (要 `path` + `equals`, path は dot-notation for VM observable)

### driver の内部

- **iOS (XCUITest)**: Swift Package, `XCUIApplication` ベース。layout の `id` を `accessibilityIdentifier` にマップ。テストランナーは Xcode test action（`xcodebuild test` or Xcode GUI）。
- **Android (Espresso + UI Automator)**: Gradle dependency。`contentDescription` を element id にマップ。`JsonUITest.loadFromAssets(context, path)` で test file をロード。
- **Web (Playwright)**: TypeScript/Node.js。`TestLoader` でロード、`JsonUITestRunner(page)` でブラウザ制御。`defaultTimeout`, `screenshotOnFailure`, `screenshotDir`, `verbose` が設定可能。

### `jsonui-test` CLI

**`jsonui-test` は Python ツール**（別リポ）。sub-command:
- `validate` / `v` — schema 検証 (exit 0/1)
- `generate test screen` / `g t screen` — screen test の skeleton
- `generate test flow` / `g t flow` — flow test の skeleton
- `generate description` / `g d` — description MD の skeleton
- `generate doc` / `g doc` — 1 つの test file から MD/HTML doc を生成
- `generate html` / `g html` — docs ディレクトリ一括 HTML 化

install:
```bash
curl -fsSL https://raw.githubusercontent.com/Tai-Kimura/jsonui-test-runner/main/test_tools/installer/bootstrap.sh | bash
```

**重要**: `jui test` ではない。`jui` CLI 側に test サブコマンドは存在しない（少なくとも現 HEAD）。

### screen test vs flow test

- **screen**: 1 layout 1 画面に対する in-isolation な asserting。
- **flow**: 複数画面の user journey。schema に `sources` (alias 付き layout 配列), `checkpoints`, `steps` が `{ "file": "...", "case": "..." }` で別 test file を参照できる構造がある。

### CI

**GitHub Actions の harness は shipped されていない**。platform native の test action を手組みする:
- Web: `npx playwright test`
- iOS: `xcodebuild test`
- Android: `./gradlew connectedAndroidTest`

### 既知 gotchas

- `rjui-collection-cell-id-binding` limit: Collection の per-cell DOM id が安定しない → `tap` の `text` 引数で回避（hello-world.test.json 実例あり）。
- snapshot visual regression は engine 無し。`screenshot` action は artifact を残すだけ。
- `platform: "all"` は全 driver で通す意図だが、driver 差で実用性は case による。

## 目標構造

4 section → **7 section**:

1. **Where tests live** — `tests/` ディレクトリの位置、screen vs flow の file naming。
2. **Screen test anatomy** — schema top-level + 実 keys quote。
3. **Flow test anatomy** — sources / checkpoints / file-reference パターン。
4. **The action and assert DSL** — 実 step types を table で網羅。
5. **The drivers (iOS/Android/Web)** — 3 driver の起動方法と mapping。
6. **Running: `jsonui-test` CLI** — 正しい CLI 名、install、sub-command、exit codes。
7. **CI** — harness が shipped されていないことを明示 + 3 platform の代表コマンド。

## 新設 section の詳細

### 1. Where tests live

**body**: 「tests/ ディレクトリ直下。画面ごとに `.test.json`、user journey は flow/ サブディレクトリ。」

**CodeBlock** (text):
```text
tests/
  screens/
    home.test.json
    learn/hello-world.test.json       ← screen test
  flows/
    login-to-profile.test.json        ← flow test
  descriptions/
    home.description.json              ← optional richer docs
```

### 2. Screen test anatomy

**body**: 「screen test の最小形。`cases[]` に名前付きテストケースを並べる。」

**CodeBlock** (json):
```json
{
  "type": "screen",
  "source": { "layout": "layouts/counter.json" },
  "metadata": { "name": "Counter — increment flow", "tags": ["smoke"] },
  "platform": "web",
  "initialState": { "viewModel": { "count": 0 } },
  "cases": [
    {
      "name": "increment once shows 1",
      "steps": [
        { "assert": "text", "id": "counter_value", "equals": "0" },
        { "tap": "counter_increment_btn" },
        { "assert": "text", "id": "counter_value", "equals": "1" }
      ]
    }
  ]
}
```

### 3. Flow test anatomy

**body**: 「flow は複数画面をまたぐ。`sources` で画面を alias 付きで登録し、screen-level test file を再利用できる。」

**CodeBlock** (json):
```json
{
  "type": "flow",
  "sources": [
    { "alias": "login", "layout": "layouts/login.json" },
    { "alias": "home",  "layout": "layouts/home.json" }
  ],
  "metadata": { "name": "Login → Home happy path" },
  "platform": "web",
  "initialState": { "screen": "login", "viewModels": { "login": { } } },
  "cases": [
    {
      "name": "logs in and lands on home",
      "steps": [
        { "screen": "login", "input": "email_field",    "value": "demo@example.com" },
        { "screen": "login", "input": "password_field", "value": "hunter2" },
        { "screen": "login", "tap": "submit_btn" },
        { "screen": "home",  "waitFor": "home_header" },
        { "checkpoint": "arrived_home", "screenshot": true }
      ]
    }
  ]
}
```

### 4. The action and assert DSL

**body**: 「step は action step か assert step のどちらか。下記は schema 全量。」

**Table** (Label grid — action):

| action | 必須 | optional | 備考 |
|---|---|---|---|
| tap | `id` or `text` | — | element をタップ |
| doubleTap / longPress | `id` | longPress の `duration` (ms) | |
| input | `id`, `value` | — | text field 入力 |
| clear | `id` | — | フィールドクリア |
| scroll | `direction` | `id`, `amount` | up/down/left/right |
| swipe | `direction` | `id` | |
| waitFor / waitForAny | `id` (or array) | `timeout` (ms) | |
| wait | `duration` (ms) | — | 明示的な delay |
| back | — | — | native back |
| screenshot | `name` | — | artifact 保存 |
| alertTap | `text` | — | native alert 内のボタン |
| selectOption | `id`, `value` | — | picker/select |
| tapItem | `id`, `index` | — | collection cell |
| selectTab | `tabId` or `text` | — | tab bar |

**Table** (assert):

| assert | 必須 | 意味 |
|---|---|---|
| visible / notVisible | `id` | 描画されている / 消えている |
| enabled / disabled | `id` | インタラクト可能性 |
| text | `id`, `equals` or `contains` | テキスト一致 |
| count | `id`, `equals` | collection の要素数 |
| state | `path`, `equals` | VM の observable を dot-notation で |

### 5. The drivers

**body**: 「test file は同じ。実行環境は 3 種類。」

**Table**:

| | framework | element mapping | runner command |
|---|---|---|---|
| iOS | XCUITest | `id` → `accessibilityIdentifier` | `xcodebuild test` |
| Android | Espresso + UI Automator | `id` → `contentDescription` | `./gradlew connectedAndroidTest` |
| Web | Playwright | `id` → DOM `data-jsonui-id` | `npx playwright test` |

**Callout**: 「`platform: "web"` を test file に書いておくと、別 driver で走らせた時に自動 skip される。`platform: "all"` で 3 driver 両対応にしたい場合、要素 id が 3 platform すべてで有効である必要がある（collection cell id など一部制約あり）。」

### 6. Running: `jsonui-test` CLI

**Callout (warn)**: 「CLI 名は `jui test` ではなく **`jsonui-test`** です。別パッケージ（`jsonui-test-runner`）で配布されます。」

**CodeBlock** (bash — install):
```bash
curl -fsSL https://raw.githubusercontent.com/Tai-Kimura/jsonui-test-runner/main/test_tools/installer/bootstrap.sh | bash
# Python 3.10+ required
```

**CodeBlock** (bash — validate):
```bash
jsonui-test validate tests/screens/counter.test.json
# exit 0 = pass, 1 = error

# directory 一括
jsonui-test validate tests/
```

**CodeBlock** (bash — generate):
```bash
# screen test skeleton
jsonui-test generate test screen --layout layouts/counter.json --out tests/screens/counter.test.json

# flow test skeleton
jsonui-test generate test flow --name login-to-home --out tests/flows/login-to-home.test.json

# HTML doc for a single file
jsonui-test generate doc tests/screens/counter.test.json --format html
```

### 7. CI

**body**: 「CI harness は shipped されません。platform native のテストアクションを CI に配線してください。」

**CodeBlock** (yaml — GitHub Actions 例、Web):
```yaml
- name: Validate test schemas
  run: jsonui-test validate tests/
- name: Run Playwright tests
  run: |
    cd jsonui-doc-web
    npx playwright install --with-deps
    npx playwright test
```

**Callout**: 「iOS/Android の CI は Xcode Cloud / Bitrise / Firebase Test Lab など platform 固有。`jsonui-test validate` を先に走らせて schema だけでも gate するのが最低ライン。」

## Spec 編集差分

`docs/screens/json/guides/testing.spec.json`:
- TOC 4 → 7: `toc_where`, `toc_screen`, `toc_flow`, `toc_dsl`, `toc_drivers`, `toc_cli`, `toc_ci`
- sections: `section_where`, `section_screen`, `section_flow`, `section_dsl`, `section_drivers`, `section_cli`, `section_ci`
- 既存 `section_where` は残す。`section_dsl` 残す。`section_runner` → `section_drivers` に rename、`section_ci` 残す。`section_screen`, `section_flow`, `section_cli` を新規追加。

## strings.json 新設キー（testing namespace）

```
testing_section_screen_heading/body
testing_section_flow_heading/body
testing_section_dsl_action_table_* (N rows × M cols ≒ 60 entries)
testing_section_dsl_assert_table_* (6 rows × 3 cols ≒ 18 entries)
testing_section_drivers_heading/body/table_* (3 rows × 4 cols ≒ 12 entries)
testing_section_drivers_platform_callout
testing_section_cli_heading
testing_section_cli_warn_callout
testing_section_cli_install_body
testing_section_cli_validate_body
testing_section_cli_generate_body
testing_section_ci_heading/body
testing_section_ci_harness_callout
testing_toc_row_* (7 rows)
```

既存キー (`section_where`, `section_dsl`, `section_runner`, `section_ci`) は残置、spec 側参照を新 ID に向けるのみ。

## VM 差分

`TestingViewModel.ts` — 変更なし。

## 検証手順

1. 実在 test file から step を quote（hello-world.test.json）して整合性確認
2. `jsonui-test --version` で install 方法の正しさを実機確認
3. `jui build` → `jui verify --fail-on-diff`
4. ブラウザで `/guides/testing` 目視: 7 section + 6 CodeBlock + 2 Table

## 作業見積り

- 調査: `jsonui-test` の最新 CLI help を実行確認 0.3h
- strings.json: 100+ entries（table cells が多い）≒ 3h
- spec: 1h
- ブラウザ確認 + fix: 1h
- 計 **~5.5h**

