# 35. コンテンツプラン: Platforms — ReactJsonUI 記事本文

> Scope: 8〜10 時間 / 2〜3 セッション。plan 07 の構造設計に対応する**本文・コードサンプル**を書き下ろす。
> 依存: plan 07（ページ構成）、plan 33/34（他プラットフォームと揃えるため）。

---

## 1. 対象記事

plan 07 §2 のページ構成に従う:

| URL |
|---|
| `/platforms/rjui/overview` |
| `/platforms/rjui/setup` |
| `/platforms/rjui/nextjs-integration` |
| `/platforms/rjui/app-router` |
| `/platforms/rjui/pages-router` |
| `/platforms/rjui/viewmodel` |
| `/platforms/rjui/binding` |
| `/platforms/rjui/tailwind` |
| `/platforms/rjui/styling` |
| `/platforms/rjui/server-components` |
| `/platforms/rjui/ssr-ssg` |
| `/platforms/rjui/custom-components` |
| `/platforms/rjui/dogfooding` |
| `/platforms/rjui/coverage` |
| `/platforms/rjui/troubleshooting` |

---

## 2. 各ページの書き下ろすべき内容

### 2.1 `/platforms/rjui/overview`

**一文定義**
- en: "ReactJsonUI is the web implementation of JsonUI, targeting Next.js (App Router and Pages Router) with Tailwind CSS for styling."
- ja: "ReactJsonUI は JsonUI の Web 実装。Next.js（App Router / Pages Router）を対象に、Tailwind CSS でスタイリング。"

**アーキテクチャ対応表**

| JsonUI concept | ReactJsonUI |
|---|---|
| Screen root | Next.js page (`app/**/page.tsx`) or `(route)` segment |
| ViewModel | `class ViewModel` + `useViewModel()` hook |
| Binding | `notify()` → hook re-render |
| Layout reload | Next.js HMR（自動） |

**なぜ Next.js か**
- SSR / SSG / ISR のサポート（ReactJsonUI は全対応）
- App Router の nested layouts で `SafeAreaView` / `TabView` と綺麗にマッピング
- React Server Components との相互運用（ViewModel は client）

**React Router / CRA / Vite で使うには？**
- サポート範囲の注意: ReactJsonUI converter は Next.js 出力を前提。React Router 等で使う場合は手動で ViewModel バインディングが必要。

#### コードサンプル
1. Next.js App Router での "Hello World" page
2. 対応する Layout JSON

---

### 2.2 `/platforms/rjui/setup`

- Requirements: Node 20+、Next.js 14+、TypeScript 5+、Tailwind CSS 3.4+
- `npm install`（`@jsonui/react`, `@jsonui/next` の導入）
- `rjui` CLI install
- `rjui.config.json` 雛形
- 初回 Hello World コマンド（`rjui init`, `rjui g page`, `rjui dev`）
- `tailwind.config.js` の `content` 設定
- Troubleshooting（npm lockfile 競合、peer dep、Tailwind JIT）

#### コードサンプル
1. `package.json` の依存セクション
2. `rjui.config.json` 完全雛形
3. `tailwind.config.js` 完全記述
4. `next.config.mjs` 設定

---

### 2.3 `/platforms/rjui/nextjs-integration`

- Next.js と ReactJsonUI の統合ポイント
- `@jsonui/next` プラグイン
- `middleware.ts` との連携（locale 検出など）
- Turbopack との互換

#### コードサンプル
1. `next.config.mjs` で `@jsonui/next` プラグイン
2. `middleware.ts` テンプレート

---

### 2.4 `/platforms/rjui/app-router`

- `app/` ディレクトリでの配置
- `layout.tsx` / `page.tsx` / `template.tsx` の使い分け
- `loading.tsx` / `error.tsx` と ViewModel の `displayLogic` の対応
- nested routes と Layout JSON の構造一致

#### コードサンプル
1. `app/learn/hello-world/page.tsx` 完全形
2. `app/layout.tsx` でのグローバル Provider 配置

---

### 2.5 `/platforms/rjui/pages-router`

- `pages/` ディレクトリでの配置（レガシー対応）
- `getServerSideProps` / `getStaticProps` の ViewModel 注入
- `_app.tsx` / `_document.tsx` カスタマイズ

#### コードサンプル
1. `pages/learn/hello-world.tsx`
2. SSG with ViewModel initial state

---

### 2.6 `/platforms/rjui/viewmodel`

- TypeScript の `class ViewModel` パターン
- `useViewModel()` hook の内部実装
- `notify()` による再レンダリング
- Dependency Injection（router、repositories）

#### コードサンプル
1. フル ViewModel テンプレート
2. `useViewModel()` hook 使用例
3. Repository + UseCase 注入

---

### 2.7 `/platforms/rjui/binding`

- `@{expression}` → JSX attribute への変換
- two-way binding（controlled input）
- Event handler binding（`onClick`, `onChange`）

#### コードサンプル
1. Label / Button / TextField 3 種の binding 例
2. 生成された JSX のリーディング

---

### 2.8 `/platforms/rjui/tailwind`

- ReactJsonUI attribute → Tailwind class への変換表
- 例: `paddings: [16, 24, 16, 24]` → `py-4 px-6`
- `fontColor: "#111827"` → `text-gray-900` or arbitrary `text-[#111827]`
- カスタムテーマ（`tailwind.config.js` の `theme.extend`）

#### コードサンプル
1. 代表的な属性 → Tailwind マッピング表（20 行）
2. カスタムカラートークンの定義と使用

---

### 2.9 `/platforms/rjui/styling`

- `style` preset の仕組み
- CSS Modules との連携（不推奨だが可能）
- Framer Motion との統合
- アニメーション属性の扱い

#### コードサンプル
1. `styles/button.json` + Tailwind の組み合わせ
2. `styles/animate_fade_in.json` + Framer Motion

---

### 2.10 `/platforms/rjui/server-components`

- ViewModel は client-only（`"use client"` 必須）
- Server Component からの初期データ受け渡し
- `Suspense` との連携

#### コードサンプル
1. Server Component で data fetch → Client ViewModel 初期化
2. `<Suspense fallback={<Loading />}>` ラップ例

---

### 2.11 `/platforms/rjui/ssr-ssg`

- SSR（`app/` の default）
- SSG（`generateStaticParams`）
- ISR（`revalidate: 60`）
- 各モードでの ViewModel の扱い

#### コードサンプル
1. `generateStaticParams` で product detail pages を事前生成
2. ISR revalidate 設定

---

### 2.12 `/platforms/rjui/custom-components`

- React カスタムコンポーネント実装
- `rjui_tools/lib/converters/` への converter 登録
- Server / Client の境界注意

#### コードサンプル
1. カスタム React コンポーネント
2. 対応する `rjui_tools` converter（Ruby）

**注**: plan 32（guides/custom-components）と重複しないように、本ページは React / Next.js 特有の詳細（SSR 対応、Suspense、server components 境界）のみ扱う。

---

### 2.13 `/platforms/rjui/dogfooding`

本ドキュメントサイト（`jsonui-doc-web`）自体が ReactJsonUI で構築されている事実を紹介。

- サイトの URL ↔ Layout JSON ↔ spec の対応表
- 本サイトの構成（App Router 利用）
- 実装上の tips（読者が同じ構造を自分のサイトに適用できるよう）

#### コードサンプル
1. 本サイトの `app/` 構造
2. 本サイトの `rjui.config.json`
3. 本サイトの `tailwind.config.js` から抜粋

---

### 2.14 `/platforms/rjui/coverage`

| Component | ReactJsonUI |
|---|---|
| Label | ✓ |
| Button | ✓ |
| ... 28 components ... | |

---

### 2.15 `/platforms/rjui/troubleshooting`

- Hydration mismatch → `suppressHydrationWarning` の使い方
- Tailwind class が効かない → `content` 設定確認
- ViewModel state が巻き戻る → `"use client"` 未記載
- `next build` で型エラー → `tsconfig.json` の `strict` 設定
- Hot Module Replacement 効かない → `.next/cache` クリア

---

## 3. 必要 strings キー

prefix: `platform_rjui_<page>_*`

概算 400 キー × 2 言語。

---

## 4. クロスリンク追加先

- `/learn/installation` → `/platforms/rjui/overview`
- `/reference/components/*` の Web 列から該当ページへ
- `/guides/navigation` の Web 節 → `/platforms/rjui/app-router`
- `/concepts/hot-reload` → `/platforms/rjui/dogfooding`（本サイトの HMR 実例）

---

## 5. 実装チェックリスト

- [ ] 15 ページ分の spec ファイル作成
- [ ] 15 ページ分の strings キー追加
- [ ] Layout 生成
- [ ] 各ページ CodeBlock ≥ 3
- [ ] Tailwind マッピング表（20+ 行）
- [ ] Coverage 表完成
- [ ] クロスリンク追加
- [ ] `jui build` / `jui verify` / `jsonui-localize`

---

## 6. セッション分割の推奨境界

- **分割 A**: overview + setup + Next.js integration + App Router + Pages Router（3 時間）
- **分割 B**: ViewModel + binding + Tailwind + styling（3 時間）
- **分割 C**: Server Components + SSR/SSG + custom + dogfooding + coverage + troubleshooting（3 時間）
