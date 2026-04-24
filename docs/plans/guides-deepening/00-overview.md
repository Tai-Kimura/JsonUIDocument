# Guides 深堀り計画 — Overview

作成日: 2026-04-24
対象: `/guides/{writing-your-first-spec, navigation, localization, testing, custom-components}` 5 本

## 問題意識

5 本の Guide spec はほぼ同一テンプレ（4 section × heading+body）で内容が薄く、body 本文が strings.json の short paragraph 1 つで済んでいる。実ツールの挙動を調査した結果、**各ガイドが事実誤認を含むか、あるいは実務で必須の情報が完全に抜け落ちている**ことが判明した。例:

- localization は `jui localize` を示唆するが **実際には存在しない**（`jui build` に内包）。
- localization は Android も StringManager が生成される前提で書かれがちだが、**Android は `res/values[-lang]/strings.xml` ネイティブ形式で StringManager.kt は生成されない**。
- testing は `jui test` を前提に書かれがちだが、**実際の CLI 名は `jsonui-test`（別リポ `jsonui-test-runner`）**。
- navigation は `jui generate` が navigation コードを出す印象を与えるが、**ジェネレータは `onNavigate?: (url: string) => void` stub と Data interface しか出さず、Route enum / NavHost / NavigationStack は全プラットフォーム手書き**。
- custom-components は `.jsonui-type-map.json` が whitelist の役割を果たす印象を与えるが、**それはカスタム"データ型"のマップ**。コンポーネント whitelist は `.jsonui-doc-rules.json` + `extensions/converter_mappings.rb` の 2 層。

## ゴール

- writing-your-first-spec を "最初に読む定本" の深さに整える（step 単位の CodeBlock + error recovery）。
- navigation / localization / testing / custom-components は 4-section 構成を捨て、**実ツールの mental model に沿った章立て** に組み替える。
- すべてのコード例を実在の CLI コマンド・実在のファイルパスで書く。擬似コードや "概念的に" は禁止。
- JA/EN 両方の strings.json 整備を前提とする（spec-first discipline 維持）。

## Non-goals

- 新しい custom component（ガイド用途の Callout / Checklist 等）の新設は行わない。**既存の CodeBlock + Label + View の組合せで深堀りできる範囲に留める**。どうしても必要になったら別 plan で提案する。
- "sample app を同梱して docs から走らせる" 的な大規模改修はしない。読み物として深くするだけ。
- i18n: Next.js App Router の `[lang]` segmented routing 等は範囲外（今は strings.json + StringManager 経由の切替のみ扱う）。

## 共通原則

1. **Spec-first**: 各ガイドは `docs/screens/json/guides/<name>.spec.json` を編集 → `jui build` → Layout/VM base 再生成。手編集禁止。
2. **CodeBlock を積極利用**: writing-your-first-spec 以外の 4 本は CodeBlock を未使用なので導入する。コード片は実在リポから抜粋。
3. **英語と日本語を同時更新**: strings.json の `en` / `ja` を両方埋める。片方だけのコミットは不可。
4. **`jui build` ゼロ警告** / **`jui verify --fail-on-diff`** が両方 green になること（不変条件）。
5. **`jsonui-localize` 前提**: 新設キーがあれば build 時に抽出されるが、既存に無いキーは strings.json に明示投入。

## 根拠となる調査レポート（圧縮版）

5 つの `Explore` agent に並行で走らせて得た事実ベース。フル版は下記の per-guide plan に引用する。

- **writing-your-first-spec**: `jui doc validate spec`（sub-command 構造）, `jui generate project`（Layout/VM Base/Repo/UseCase Impl の 4 系統）, `jui verify` の 3 種類の diff（structural / orphan data / unregistered custom types）, validator の実エラー文字列。
- **navigation**: `userActions` + `transitions` が spec 側の契約。`transitions[].type` = `push`/`sheet`/`modal` が platform-specific オプション。ジェネレータは `onNavigate` stub + `NextReadLink` 的 Data interface しか出さず、Router 実装は 100% 手書き。
- **localization**: strings.json は screen-namespace + key の 2 層、値は `{ en, ja, ... }` の Lang2 (ISO code key 自由)。Android は native resource 形式、iOS は `Localizable.strings`、Web は `StringManager.ts` singleton (`.setLanguage()` で reactive)。interpolation は `%@` ↔ `%s` 自動変換あり。plural 未対応。
- **testing**: CLI は `jsonui-test`（Python, 別リポ）。`validate` / `generate test screen|flow` / `generate doc` 等 sub-command。driver は ios=XCUITest, android=Espresso+UI Automator, web=Playwright。step schema は `tap/doubleTap/longPress/input/clear/scroll/swipe/waitFor/back/screenshot/alertTap/selectOption/tapItem/selectTab` と assert 側の `visible/notVisible/enabled/disabled/text/count/state`。flow test は `sources` + `checkpoints` + `steps.file/case` 参照。
- **custom-components**: `docs/components/json/<name>.component.json` が単一 source of truth。**`.jsonui-doc-rules.json` の `rules.componentTypes.screen[]` が whitelist**。各 platform に `extensions/<snake>_converter.rb` + `extensions/attribute_definitions/<Name>.json` + `extensions/converter_mappings.rb` の 3 点セット。`.jsonui-type-map.json` はカスタムデータ型マップ（TS interface / Swift struct / Kotlin data class）で **コンポーネント whitelist とは別軸**。実在の実装例は CodeBlock（`code_block_converter.rb` + `attribute_definitions/CodeBlock.json`）。

## 実装順序

1. **writing-your-first-spec** (先に深める) — 他ガイドから参照されるキーストーン。これが正しくないと他も崩れる。
2. **custom-components** — 2 番目。docs サイト自身の CodeBlock を題材にできるので、exemplar を示しやすい。
3. **localization** — "Android は strings.xml ネイティブ" という最大の誤認を訂正する必要あり。
4. **testing** — CLI 名の訂正（`jui test` → `jsonui-test`）＋ driver 差分の正確化。
5. **navigation** — 最も "概念 vs 実装" のギャップが大きいので、他 4 本で語彙が整ってから。

各 guide 個別の plan は同ディレクトリ 01–05 を参照。

## 変更対象ファイル（全体）

per-guide:
- `docs/screens/json/guides/<name>.spec.json` — section 追加の箇所のみ手を入れる。data block は変えない。
- `docs/screens/layouts/Resources/strings.json` — 新設キーを追加（en/ja 同時）。
- `jsonui-doc-web/src/viewmodels/guides/<Name>ViewModel.ts` — ハンド編集 VM。nextReadLinks は多くの場合変更不要。

共有:
- なし（新コンポーネント導入しない方針）。ただし custom-components 章で CodeBlock を例示する関係上、実装は既に存在するので追加ファイルは無い。

## 検証ゲート

各 guide の plan が done になった時に以下を全通過で merge:

1. `jui build` — zero warnings
2. `jui verify --fail-on-diff` — no drift
3. `jsonui-localize` — 全キーが en/ja 両方で埋まっている
4. ブラウザで `/guides/<name>` を開き、TOC が全 section をカバーし、CodeBlock が copy 可能なことを目視確認
5. `jsonui-test` でこのガイド群の screen test があれば（今は無い見込み）更新不要、無ければ後続 plan で対応

## オープン質問（user 判断が必要）

1. **navigation / testing / custom-components の section 数** — 現状 4 だが、実内容を正しく書くと 5–6 になる見込み。TOC が長くなるが depth 優先で OK か？ 個人的には OK。
2. **新しい custom component 導入の可否** — "Callout"（⚠/ℹ/✅ boxes）と "ChecklistItem" があると読みやすさが跳ね上がるが、**non-goal 宣言通りに既存要素縛りで書く** のが既定路線。必要になった時点で別 plan 化。
3. **Ruby/Python CLI の見え方** — `jui` は Python (`jui_tools/`), `sjui`/`kjui`/`rjui`/`jsonui-test` は Ruby or Python。ガイド上で内部実装言語に触れるかどうか（触れない方が user には優しい）。
4. **`jsonui-test-runner` の install 手順** — testing guide で触れる。CLI の別パッケージ性は説明必須（`jui test` ではないことを明記）。

## リスク

- strings.json は 256KB 級で大きく、editor で開くと重い。patch scope を間違えると既存キーを壊す。**既存キーの rename は原則禁止、追加のみ**。
- `jui build` が Layout JSON を再生成するので、spec と strings が揃っていないと warning が出る。必ず先に strings.json → 後に spec、の順で編集。
- writing-your-first-spec は既に 5-step 構造（他 4 本と違う）。他 4 本を同じ step-based 構造に揃えるか、4-section は維持するかの判断は per-guide で決める（多くは sections を増やす方向）。

