# 07. コンテンツプラン: ReactJsonUI セクション

> **実装アーキテクチャ（本計画書共通）:** 各ページは `docs/screens/json/platforms/react/*.spec.json` で定義し、
> `jui g project` で Layout JSON + ViewModel を生成、`jui build` で Web 配布 → `next build`。
> 詳細は `02-tech-stack.md` / `02b-jui-workflow.md` / `17-spec-templates.md`。
>
> Layout JSON の置き場: `docs/screens/layouts/platforms/react/*.json`
> サイドバー `docs/screens/layouts/common/sidebar_react.json`（`platforms: ["web"]`）で include
>
> **重要:** 本サイト自体が ReactJsonUI（rjui）のドッグフーディング実装だが、さらに一歩進んで
> 「**jui を orchestrator として 3 プラットフォームに配布可能な JsonUI プロジェクト**」となる。
> `/platforms/react/dogfooding` ではこの事実を強調する。

## 1. 対象リポジトリ

- `/Users/like-a-rolling_stone/resource/ReactJsonUI/`（トップは `example/` と `CLAUDE.md`）
- `/Users/like-a-rolling_stone/resource/ReactJsonUI/example/`（Next.js + Tailwind の example）
- `/Users/like-a-rolling_stone/resource/jsonui-cli/rjui_tools/`（本体 CLI）
  - `lib/react/converters/`（25 converter）
  - `lib/react/generators/`（component / converter）
  - `lib/react/templates/`（`network_image.tsx`, `use_media_query.ts`）
  - `lib/react/tailwind_mapper.rb` / `style_loader.rb` / `responsive_helper.rb`
- `/Users/like-a-rolling_stone/resource/ReactJsonUI/example/lib/react/converters/extensions/`
  - 独自 Converter 例（`converter_mappings.rb`, `custom_badge_converter.rb`, `test_card_converter.rb`）

## 2. ページ構成

```
/platforms/react
├── /platforms/react/overview                 ReactJsonUI 概要
├── /platforms/react/setup                    セットアップ（Next.js 16+, Ruby 3）
├── /platforms/react/config                   rjui.config.json 詳細
├── /platforms/react/json-to-tsx              JSON → TSX 変換の流れ
├── /platforms/react/tailwind-mapping         Tailwind マッピング一覧
├── /platforms/react/converters               Converter 機構
├── /platforms/react/converters/list          Converter 一覧（25 種）
├── /platforms/react/converters/custom        カスタム Converter の作り方
├── /platforms/react/viewmodels               ViewModel パターン（React Hooks）
├── /platforms/react/includes                 Include 機構（JSON 共通部品）
├── /platforms/react/styles                   Styles JSON
├── /platforms/react/strings                  Strings と i18n
├── /platforms/react/data-binding             @{} の React 解釈
├── /platforms/react/responsive               responsive / use_media_query
├── /platforms/react/hot-loader               Hot Loader（rjui watch）
├── /platforms/react/dynamic-mode             Dynamic Mode（将来予定・現状の制約）
├── /platforms/react/ssr-ssg                  SSR / SSG（Next.js App Router）
├── /platforms/react/coverage                 サポート状況
└── /platforms/react/troubleshooting          トラブルシューティング
```

## 3. 各ページの要点

### 3.1 `overview`
- Web（React/Next.js + Tailwind）向け JsonUI
- 設計哲学: **静的コード生成**（ランタイム解釈は最小限）
- 同じ JSON Spec が iOS / Android と互換
- Next.js App Router 推奨

### 3.2 `setup`
- Node 20+
- Next.js 16+
- Ruby 3.x（`rjui` 実行時）
- インストール:
  ```bash
  curl -fsSL https://.../bootstrap.sh | bash
  ```
- プロジェクト初期化:
  ```bash
  rjui init
  ```

### 3.3 `config`
- `rjui.config.json` のキー全解説
  - `layouts_directory`
  - `generated_directory`
  - `components_directory`
  - `styles_directory`
  - `strings_directory`
  - `languages` / `default_language`
  - `use_tailwind`
  - `typescript`
- 既定値とカスタマイズ例

### 3.4 `json-to-tsx`
- `rjui build` の内部フロー
- 入力: `src/Layouts/*.json`
- 処理: Ruby 側で各 Converter → TSX コード生成
- 出力: `src/generated/components/*.tsx`
- View → TSX の完全対応例

### 3.5 `tailwind-mapping`
- `lib/react/tailwind_mapper.rb` を参照
- 代表例:
  | JSON | Tailwind |
  | --- | --- |
  | `padding: 12` | `p-3` |
  | `cornerRadius: 8` | `rounded-lg` |
  | `background: "#007AFF"` | `bg-[#007AFF]` |
  | `fontSize: 16` | `text-base` |
- 任意色 `bg-[#...]` の扱い、テーマカラーとの統合

### 3.6 `converters`
- Converter = 各コンポーネントタイプのレンダラ
- 25 標準 Converter:
  `blur, button, circle_view, collection, gradient_view, icon_label, image, include, indicator, label, network_image, progress, radio, scroll_view, segment, select_box, slider, switch, tab_view, text_field, text_view, toggle, view, web`（+ `base_converter`, `extensions`）

### 3.7 `converters/list`
- 各 Converter の入力属性 / 出力 TSX 骨子を表形式で
- 出力例: `ButtonConverter` → `<button className="...">...`

### 3.8 `converters/custom`
- `rjui g converter MyCard` の挙動
- 手順:
  1. `rjui g converter MyCard --attributes "title:string,count:number"`
  2. `lib/react/converters/extensions/my_card_converter.rb` 生成
  3. `converter_mappings.rb` に登録
  4. JSON 側で `{"type": "MyCard", "title": "..."}` と書ける
- 既存サンプル: `custom_badge_converter.rb` / `test_card_converter.rb`

### 3.9 `viewmodels`
- React Hook ベースの ViewModel
- 例: `HomeViewModel.ts`（`jui g project` で生成された雛形を本ドキュメントページ向けに実装）
- `useMemo` / `useRouter` との統合
- `data` prop を JSON 側に渡すパターン

### 3.10 `includes`
- 他の JSON を部分読み込み
- `{"include": "components/header"}` 記法
- アトミックデザインとの親和性

### 3.11 `styles`
- `src/Styles/*.json` の書き方
- Style の継承・overrides

### 3.12 `strings`
- `src/Strings/{en,ja}.json`
- JSON の `"text": "snake_case_key"` → `StringManager.currentLanguage.snakeCaseKey`
- LanguageProvider（本サイト用に新規実装、`jsonui-doc-web/src/components/extensions/LanguageProvider.tsx`）

### 3.13 `data-binding`
- 共通は `/concepts/data-binding` にまとめる
- ここは React 固有の表現: `@{var}` → props 解決 or ViewModel.data 参照
- `onClick` 等イベントハンドラの命名規則

### 3.14 `responsive`
- `responsive` 属性と `responsive_helper.rb`
- `use_media_query.ts` テンプレート
- Tailwind responsive prefix との使い分け

### 3.15 `hot-loader`
- `rjui watch` でファイル変更を検知して再生成
- Next.js の Fast Refresh と併用

### 3.16 `dynamic-mode`
- 現状の制約（静的生成メインのため、iOS / Android と同じ意味の Dynamic Mode はない）
- 動的読み込みが必要な場合の対策（Client Component + `fetch(layout.json)`）

### 3.17 `ssr-ssg`
- App Router 前提
- SSG でビルド時 JSON 展開
- Client Component との境界

### 3.18 `coverage`
- `/reference/components/*` と重複しないよう、Web 固有の実装状況のみ
- 例: `NetworkImage` は Coil 相当が無いので Next.js `<Image>` に委譲

### 3.19 `troubleshooting`
- `rjui build` が失敗する
- Tailwind クラスが反映されない
- Strings キーが見つからない

## 4. サイドバー `src/Layouts/components/sidebar_react.json`

構成は `05` と同形式。

## 5. Strings 追加キー

`ref_react_*` プレフィックスで約 19 キー × 2 言語。

## 6. ReactJsonUI でのドッグフーディング成果の展示

本サイト自体が ReactJsonUI 実装であることを利用し、以下を**実サイトの「舞台裏」ページ**として `/platforms/react/dogfooding` に追加（上記の構成に加える）:

- 本サイトで使っている Converter 一覧
- 本サイトで定義したカスタム Converter（CodeBlock / NavLink / SearchModal / OpenApiViewer / Tabs / Prose）とその JSON 記法
- GitHub リンク（`JsonUIDocument` リポジトリ自体）

## 7. 実装チェックリスト

- [ ] `docs/screens/json/platforms/react/*.spec.json` 19 枚（`jui g screen` 一括生成）
- [ ] 各 spec に対し `jui g project --file ...` で Layout + ViewModel を生成
- [ ] `docs/screens/layouts/platforms/react/*.json` 手作業で仕上げ
- [ ] `jsonui-doc-web/src/app/platforms/react/**/page.tsx` ルート
- [ ] `docs/screens/layouts/common/sidebar_react.json`（`platforms: ["web"]`）
- [ ] Strings `ref_react_*` を `Resources/strings.json` に追加
- [ ] Converter 一覧は `lib/react/converters/` を読み取ってビルド時に自動生成（`converter_mappings.rb` を解析）
- [ ] 「dogfooding」ページで本サイトの jui.config.json / spec / Layout を披露（iOS/Android 配布の事実も）
