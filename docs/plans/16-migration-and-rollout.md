# 16. マイグレーション & ロールアウト計画（jui ベース）

## 1. 方針

- 既存 `/Users/like-a-rolling_stone/resource/JsonUIDocument/` 配下は **全ファイル破棄**（バックアップ・アーカイブ・参考保存も一切行わない）
- `02-tech-stack.md` / `02b-jui-workflow.md` / `15-toolchain.md` に基づき**ゼロから新規構築**
- 後方互換性不要（本サイトは未公開段階）
- URL 互換性不要
- 流用・踏襲すべき既存コードは存在しない前提で計画する

## 2. 新規作成するトップレベル構造

本計画では **jui を orchestrator とするプロジェクト構造**で再構築する。すべて新規作成。

| 種別 | パス | 生成方法 |
|------|------|----------|
| jui 設定 | `jui.config.json` | `jui init` で自動生成 → `02-tech-stack.md` §3 に従い編集 |
| 型マッピング | `.jsonui-type-map.json` | 手動作成（`15-toolchain.md` §3 参照） |
| バリデーションルール | `.jsonui-doc-rules.json` | 手動作成（`15-toolchain.md` §4 参照） |
| spec 群 | `docs/screens/json/*.spec.json` | `jui g screen` テンプレ → 手動編集 |
| Layout JSON 正本 | `docs/screens/layouts/*.json` | `jui g project` で自動生成 |
| 共有スタイル | `docs/screens/styles/*.json` | 手動作成 |
| SVG 画像 | `docs/screens/images/*.svg` | 手動作成 |
| 多言語文字列 | `docs/screens/layouts/Resources/strings.json` | 手動作成（`03-i18n.md` 参照） |
| Web サブプロジェクト | `jsonui-doc-web/` | 新規作成（Next.js + rjui、`15-toolchain.md` §5 参照） |
| iOS ショーケース | `jsonui-doc-ios/` | Phase 5c で新規作成 |
| Android ショーケース | `jsonui-doc-android/` | Phase 5c で新規作成 |

すべて既存コードからのコピー・移動・リネームは行わない。

## 3. ロールアウトフェーズ

### Phase 0: 準備（設計レビュー & クリーンアップ）

- [ ] 本設計計画書 00〜17 をレビュー
- [ ] ユーザーに最終承認を得る
- [ ] `JsonUIDocument/` 配下のファイルをすべて削除（`docs/plans/` と `.git/` のみ残す）
- [ ] `.gitignore` / `README.md` も削除して新規作成する前提で臨む

**期間目安**: 1 日

---

### Phase 1: jui プロジェクト足場

- [ ] `jui init` でプロジェクト初期化（`jui.config.json` が自動生成される）
- [ ] `jui.config.json` を `02-tech-stack.md` §3 の内容に整える（Web のみ有効、iOS/Android は未定義で可）
- [ ] `.jsonui-type-map.json` / `.jsonui-doc-rules.json` をルートに配置
- [ ] `docs/screens/{json,layouts,styles,images}/` 作成（空）
- [ ] `docs/screens/layouts/Resources/strings.json` 作成（最小キーのみ）
- [ ] `jsonui-doc-web/` サブプロジェクトを用意（`rjui.config.json` / `package.json` / `tsconfig.json` / `next.config.ts` / `postcss.config.mjs` / `eslint.config.mjs`）
- [ ] `jsonui-doc-web/scripts/` に `validate-strings.ts` / `build-attribute-reference.ts` / `build-search-index.ts` のスタブ
- [ ] `jsonui-doc-web/src/components/extensions/LanguageProvider.tsx` を新規作成（`03-i18n.md` §2 参照）
- [ ] `jui build --web-only` が成功すること（空でも）
- [ ] `cd jsonui-doc-web && npm install && npm run dev` で空ページ起動

**期間目安**: 2〜3 日

**完了条件**: `jui build` → `npm run dev` でサイトが起動

---

### Phase 2: 共通 spec テンプレート生成 + 共通部品

jui ワークフロー特有: spec を先に機械生成しやすい。

- [ ] **spec テンプレ一括生成**（`jui g screen` を複数呼ぶバッチスクリプト）
  - 必要な screen 名（約 200 ページ）をリスト化（`docs/plans/generated-specs.txt` として Phase 2 先頭で作る）
  - `xargs -n1 jui g screen` で一括生成
- [ ] 共通部品の spec + layout 作成（**include 用**）
  - `docs/screens/layouts/common/header.json`
  - `docs/screens/layouts/common/footer.json`
  - `docs/screens/layouts/common/breadcrumb.json`
  - `docs/screens/layouts/common/toc.json`（Web 専用、`platforms: ["web"]`）
  - `docs/screens/layouts/common/sidebar_learn.json` 等（`platforms: ["web"]`）
- [ ] 共通 Style 作成（`docs/screens/styles/heading_1.json` 等）
- [ ] Strings（`Resources/strings.json`）に nav/footer/common キーを追加
- [ ] 独自 Converter スタブ作成（各プラットフォーム）
  - `jui g converter CodeBlock`
  - `jui g converter NavLink` (`--web-only`)
  - `jui g converter TableOfContents` (`--web-only`)
  - `jui g converter SearchModal` / `SearchTrigger` (`--web-only`)
  - `jui g converter Tabs` / `TabPanel`
  - `jui g converter Prose`
  - `jui g converter OpenApiViewer` (`--web-only`)
  - `jui g converter JsonSchemaViewer` (`--web-only`)
  - `jui g converter PlatformBadge`
- [ ] Converter の中身を実装（Shiki、usePathname、FlexSearch、Redoc、...）
- [ ] `jui build` 成功、Web でヘッダー表示
- [ ] Strings validation CI

**期間目安**: 1.5 週間

---

### Phase 3: ライブラリ別コンテンツ（platforms/）

SwiftJsonUI → KotlinJsonUI → ReactJsonUI の順で 1 週間ずつ。各ページは:

1. spec 作成（`docs/screens/json/platforms/{swift,kotlin,react}/*.spec.json`）
2. `jui g project --file ...` で Layout JSON 骨格生成
3. Layout 編集（`docs/screens/layouts/platforms/...`）
4. Strings 追加
5. `jui build` → `npm run dev` で確認

#### Phase 3a: SwiftJsonUI (`05-content-plan-swiftjsonui.md`)
- [ ] `/platforms/swift` 配下 18 spec + layout
- [ ] `common/sidebar_swift.json`（`platforms: ["web"]`）
- [ ] Strings `ref_swift_*`

#### Phase 3b: KotlinJsonUI (`06-content-plan-kotlinjsonui.md`)
- [ ] `/platforms/kotlin` 配下 18 spec + layout
- [ ] `common/sidebar_kotlin.json`（`platforms: ["web"]`）
- [ ] Strings `ref_kotlin_*`

#### Phase 3c: ReactJsonUI (`07-content-plan-reactjsonui.md`)
- [ ] `/platforms/react` 配下 19 spec + layout
- [ ] 「舞台裏」ページ（ドッグフーディング成果）
- [ ] `common/sidebar_react.json`（`platforms: ["web"]`）
- [ ] Strings `ref_react_*`

**期間目安**: 3 週間

---

### Phase 4: Tools / MCP / test-runner / Agents / Helper

#### Phase 4a: jsonui-cli (`08`)
- [ ] `/tools/cli` 配下 約 55 spec + layout

#### Phase 4b: jsonui-mcp-server (`09`)
- [ ] `/tools/mcp` 配下 約 42 spec + layout
- [ ] `jsonui-doc-web/public/openapi/mcp.yaml` 手書き
- [ ] `OpenApiViewer` コンテンツ統合

#### Phase 4c: jsonui-test-runner (`10`)
- [ ] `/tools/test-runner` 配下 約 20 spec + layout
- [ ] `jsonui-doc-web/public/schemas/` に JSON Schema 配置
- [ ] `JsonSchemaViewer` コンテンツ統合

#### Phase 4d: Agents (`11`)
- [ ] `/tools/agents` 配下 約 45 spec + layout
- [ ] `Tabs` で Claude / Codex 差分表示

#### Phase 4e: jsonui-helper (`12`)
- [ ] `/tools/helper` 配下 約 13 spec + layout（overview / install / features × 5 / shortcuts / config / type-map / supported-components / troubleshooting）
- [ ] `/tools/helper/install` ページ末尾に「旧 `SwiftJsonUI Helper`（publisher `swiftjsonui`）は `jsonui-helper` に統合され廃止されました」と注記（旧ユーザーの検索流入対策）

**期間目安**: 4〜5 週間

---

### Phase 5: 概念 + 属性リファレンス + iOS/Android ショーケース

#### Phase 5a: Concepts
- [ ] `/concepts/*`（`13-content-plan-dynamic-hot-reload.md`）

#### Phase 5b: 属性リファレンス自動生成
- [ ] `scripts/build-attribute-reference.ts` 本実装（`14` 参照）
  - `attribute_definitions.json` + `component_metadata.json`（どちらも `jsonui-cli/shared/core/`）+ override → **spec ファイル群**を生成
  - `docs/screens/json/reference/components/*.spec.json`（28 ファイル、機械生成）
  - `docs/screens/json/reference/attributes/*.spec.json`（カテゴリ別）
- [ ] 生成された spec に対して `jui g project` を一括実行
- [ ] 28 コンポーネント分の `docs/data/attribute-overrides/*.json` を段階的に埋める
  - Label, Button, TextField, View, ScrollView, Collection 最優先
- [ ] `/reference/data-binding` / `/reference/modifier-order` / `/reference/platform-mapping` / `/reference/json-schema`

#### Phase 5c: iOS / Android ショーケース（野心的）
- [ ] `jsonui-doc-ios/` 作成、`sjui init`
- [ ] `jsonui-doc-android/` 作成、`kjui init`
- [ ] `jui.config.json` の `platforms.ios` / `platforms.android` を有効化
- [ ] `jui build` で iOS / Android 向け配布が動くこと
- [ ] Overview / Learn 先頭数ページを iOS シミュレータ / Android エミュレータで表示
- [ ] Reference の Label / Button ページをモバイルで動作確認
- [ ] 独自 Converter（`CodeBlock`, `Tabs`, `Prose`, `PlatformBadge`）の iOS / Android 実装
- [ ] ショーケース動画を撮って「舞台裏」ページに掲載

**期間目安**: 3〜4 週間（うち 5c は 1〜1.5 週）

---

### Phase 6: Learn / Guides / 検索 / 仕上げ

- [ ] `/learn/` 配下（初心者向け導線、spec + layout）
- [ ] `/guides/` 配下（タスク別）
- [ ] `SearchModal` 本実装（FlexSearch 統合）
- [ ] `scripts/build-search-index.ts` の spec / Layout スキャン部分を完成
- [ ] `04-attribute-search.md` のチェックリスト完了
- [ ] 404 ページ
- [ ] OG / favicon 等アセット整備
- [ ] Lighthouse スコアチェック
- [ ] 両言語の翻訳抜けゼロ確認
- [ ] 全ページのリンク切れチェック（`lychee`）
- [ ] アクセシビリティチェック（`axe`）
- [ ] spec と Layout の差分ゼロ確認（`jui verify --fail-on-diff`）

**期間目安**: 2 週間

---

### Phase 7: 切替・公開

- [ ] Vercel プロジェクト本番化（`jsonui-doc-web/` を root に）
- [ ] カスタムドメイン割り当て
- [ ] 各コアリポジトリ（SwiftJsonUI / KotlinJsonUI / ReactJsonUI）の `README.md` のドキュメントリンクを新サイトに更新
- [ ] 古い wiki リンクを 301 リダイレクト（Vercel Redirects）
- [ ] iOS ショーケース: TestFlight 配信（任意）
- [ ] Android ショーケース: Play Console Internal Testing（任意）
- [ ] 公開アナウンス
- [ ] `JsonUIDocument-archive-{date}/` を削除（十分確認後）

**期間目安**: 1 週間

---

## 4. 総所要期間見積もり

| Phase | 期間 |
|-------|------|
| Phase 0 | 1 日 |
| Phase 1 | 2〜3 日 |
| Phase 2 | 1.5 週間 |
| Phase 3 | 3 週間 |
| Phase 4 | 4〜5 週間 |
| Phase 5 | 3〜4 週間 |
| Phase 6 | 2 週間 |
| Phase 7 | 1 週間 |
| **合計** | **約 4〜5 ヶ月**（単独開発、週 20 時間想定） |

圧縮したい場合:
- JsonUI-Agents-for-claude / Codex を活用し、**spec 作成を AI に任せる**（本プロジェクトの最大の自己実証）
- MCP サーバーで `jui_generate_screen` / `jui_generate_project` を呼ばせる
- Phase 3〜5 の各セクションは並列実装可能（Platform ごと独立）

## 5. リスクと対策

| リスク | 影響度 | 対策 |
|--------|------|------|
| jui の spec 仕様が変更される | 中 | CI で `jsonui-doc validate-spec` と `jui verify` を必須化。変更検知時は migration ガイドに従う |
| `attribute_definitions.json` の構造変更 | 中 | 生成スクリプトに integration test を置く。CI で検知 |
| iOS / Android ショーケースの工数が膨らむ | 中 | Phase 5c は任意。最小 2〜3 ページでも「動く証拠」として十分 |
| Converter（`CodeBlock` 等）の全プラットフォーム実装負担 | 中 | Web を先行、iOS/Android はプレースホルダで OK。段階的に改善 |
| Swagger 手書きの量 | 中 | 29 ツールを A/B/C/D に分けて段階リリース |
| Vercel コスト | 低 | 静的 SSG なら無料枠で足りる見込み |
| 翻訳の工数 | 中 | 初期は英語優先、機械翻訳下書き → 手動修正 |

## 6. 再利用可能性

- 本サイト自体が **「3 プラットフォーム配布されるドキュメントサイト」という JsonUI の最大級の実例**
- `jsonui-docs-template` として JsonUI 利用者向けのテンプレリポジトリ化（Phase 7 以降）
- 独自 Converter 群（`CodeBlock` / `OpenApiViewer` / `JsonSchemaViewer` など）は upstream にコントリビュート

## 7. リリース後の継続タスク

- 新属性・新コンポーネント: `attribute_definitions.json` 更新 → `build-attribute-reference.ts` 再実行 → `jui g project` → `jui build` → CI で自動反映
- 新 Workflow / Agent 追加: `/tools/agents/` に spec 追加 → `jui g project` → `jui build`
- 新 MCP ツール: `public/openapi/mcp.yaml` に追記
- リリースノート（`/releases`）: spec で書く
- コミュニティ貢献ガイド（`CONTRIBUTING.md`）: spec の書き方、独自 Converter の追加方法

## 8. 実装チェックリスト

- [ ] Phase 0: 既存ファイル全削除・設計承認
- [ ] Phase 1: jui プロジェクト足場
- [ ] Phase 2: 共通 spec テンプレ生成 + 共通部品 + Converter
- [ ] Phase 3a/b/c: 3 ライブラリ
- [ ] Phase 4a〜e: CLI / MCP / test-runner / Agents / Helper
- [ ] Phase 5a/b/c: 概念 + 属性リファレンス + iOS/Android ショーケース
- [ ] Phase 6: Learn / Guides / 検索 / 仕上げ
- [ ] Phase 7: 切替・公開
