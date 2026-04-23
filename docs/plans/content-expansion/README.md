# コンテンツ拡充プラン（Phase 2, plans 19〜41）

既存 `docs/plans/` 00〜18 で JsonUI ドキュメントサイトの**設計・骨組み**は完了。
本ディレクトリは各記事の**本文・コードサンプル・クロスリンク**を記事単位で詳細化した実行可能プラン群。

> **原則**: UI / レイアウト構造には触れない（デザイン改修中のため）。
> 本文テキスト・コードサンプル・strings キー・クロスリンク先のみを指定する。

---

## はじめに読むもの

1. [`19-content-expansion-roadmap.md`](19-content-expansion-roadmap.md) — 全プランの依存グラフ・実行順・原則
2. 目的のプランを選んで実行（下記一覧から）

各プランは**1 セッションで完結する粒度**。大規模なもの（platform 系）は冒頭で「セッション分割の推奨境界」が明示されている。

---

## プラン一覧

### Phase A: Reference（他セクションが依存するため最優先）

| # | ファイル | 対象 |
|---|---------|------|
| 20 | [`20-reference-overrides-text-input.md`](20-reference-overrides-text-input.md) | Label / IconLabel / TextField / TextView / EditText / Input / Button |
| 21 | [`21-reference-overrides-selection.md`](21-reference-overrides-selection.md) | SelectBox / Switch / Toggle / Segment / Slider / Radio / CheckBox / Check / Progress / Indicator |
| 22 | [`22-reference-overrides-container.md`](22-reference-overrides-container.md) | View / SafeAreaView / ScrollView / Collection / TabView |
| 23 | [`23-reference-overrides-media.md`](23-reference-overrides-media.md) | Image / NetworkImage / GradientView / Blur / CircleView / Web |
| 24 | [`24-reference-common-attributes.md`](24-reference-common-attributes.md) | 共通 131 属性（layout / spacing / text / state / binding / event / responsive / misc） |
| 25 | [`25-reference-cli-commands.md`](25-reference-cli-commands.md) | CLI コマンドリファレンス（6 CLI × 全サブコマンド） |
| 26 | [`26-reference-mcp-tools.md`](26-reference-mcp-tools.md) | MCP ツールリファレンス（29 ツール） |
| 27 | [`27-reference-json-schema.md`](27-reference-json-schema.md) | JSON スキーマリファレンス（5 ファイル型） |

### Phase B: Learn（A と並行可）

| # | ファイル | 対象 |
|---|---------|------|
| 28 | [`28-learn-expansion.md`](28-learn-expansion.md) | what-is-jsonui / hello-world / first-screen / data-binding-basics |

### Phase C: Guides（A 完成後）

| # | ファイル | 対象 |
|---|---------|------|
| 29 | [`29-guides-navigation.md`](29-guides-navigation.md) | iOS/Android/Web 全パターン |
| 30 | [`30-guides-localization.md`](30-guides-localization.md) | 多言語化 |
| 31 | [`31-guides-testing.md`](31-guides-testing.md) | テスト JSON 完全スキーマ + 5 サンプル |
| 32 | [`32-guides-custom-components.md`](32-guides-custom-components.md) | CodeBlock / SearchModal の完全フロー |

### Phase D: Platforms（Reference 完成後）

| # | ファイル | 対象 |
|---|---------|------|
| 33 | [`33-platforms-swift-content.md`](33-platforms-swift-content.md) | SwiftJsonUI 本文（18 ページ） |
| 34 | [`34-platforms-kotlin-content.md`](34-platforms-kotlin-content.md) | KotlinJsonUI 本文（17 ページ） |
| 35 | [`35-platforms-rjui-content.md`](35-platforms-rjui-content.md) | ReactJsonUI 本文（15 ページ） |

### Phase E: Concepts（A 完成後）

| # | ファイル | 対象 |
|---|---------|------|
| 36 | [`36-concepts-expansion.md`](36-concepts-expansion.md) | why-spec-first / one-layout-json / data-binding / viewmodel-owned-state / hot-reload |

### Phase F: Tools（CLI / MCP reference 完成後）

| # | ファイル | 対象 |
|---|---------|------|
| 37 | [`37-tools-cli-article.md`](37-tools-cli-article.md) | `/tools/cli` 記事群（60+ ページ） |
| 38 | [`38-tools-mcp-article.md`](38-tools-mcp-article.md) | `/tools/mcp` 記事群（50+ ページ） |
| 39 | [`39-tools-agents-article.md`](39-tools-agents-article.md) | `/tools/agents` 記事群（22+ ページ） |
| 40 | [`40-tools-test-runner-article.md`](40-tools-test-runner-article.md) | `/tools/test-runner` 記事群（12 ページ） |
| 41 | [`41-tools-helper-article.md`](41-tools-helper-article.md) | `/tools/helper` 記事群（8 ページ） |

### Phase G: Colors & Theming（upstream colors-multitheme 完了後）

| # | ファイル | 対象 |
|---|---------|------|
| 42 | [`42-colors-and-theming.md`](42-colors-and-theming.md) | `/guides/theming` + `/reference/colors-json` 新設、既存記事への節追加 |
| 42a | [`42a-dark-mode-palette.md`](42a-dark-mode-palette.md) | Dark mode パレット決定記録（Sumi × Cinnabar）、`docs/screens/layouts/Resources/colors.json` に themed 形式で landed 済 |

---

## 推奨実行順（Week 単位）

- **Week 1**: 24 → 20 → 21 → 22 → 23（Reference 属性オーバーライド一気通貫）
- **Week 2**: 25 → 26 → 27 → 28（Reference 残り + Learn）
- **Week 3**: 29 → 30 → 31 → 32 → 33（Guides + Platform 開始）
- **Week 4**: 34 → 35 → 36 → 37 → 38 → 39 → 40 → 41（Platform 残り + Concepts + Tools）

詳細な依存グラフとセッション分割の推奨は [`19-content-expansion-roadmap.md`](19-content-expansion-roadmap.md) 参照。

---

## 既存 plans（00〜18）との関係

- 00〜03: 全体設計（不変）
- 04, 14, 16, 17: 仕組み系（不変、本ディレクトリから参照するのみ）
- 05, 06, 07: 既存構造プラン → 33, 34, 35 が**本文プラン**として補完
- 08〜13: 既存構造プラン → 25, 26, 37, 38, 39, 40, 41 が**本文プラン**として補完
- 18: `/learn/installation` 完成。完成記事の参考テンプレート

上位 `docs/plans/` の README.md が全体のエントリポイント。
