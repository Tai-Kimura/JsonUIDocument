# 15. ツールチェーン・ビルド・デプロイ（jui ベース）

> **前提:** 本サイトは `jui` を orchestrator とするクロスプラットフォーム JsonUI プロジェクトとして構築する。
> Web（必須）/ iOS（任意）/ Android（任意）の 3 プラットフォームに同じ spec / Layout JSON を配布する。
> 詳細は `02-tech-stack.md` と `02b-jui-workflow.md` を参照。

## 1. ランタイム要件

| 項目 | バージョン | 用途 |
|------|-----------|------|
| **jui** | 最新（`jsonui-cli` 同梱の `jui`） | spec 管理・生成・配布の orchestrator |
| **rjui** | 最新（`jsonui-cli` 同梱の `rjui`） | Web 側の Layout JSON → TSX 変換 |
| **sjui** | 最新（任意） | iOS 側の Layout JSON → Swift 変換 |
| **kjui** | 最新（任意） | Android 側の Layout JSON → Kotlin 変換 |
| **jsonui-doc** | 最新 | spec バリデーション・HTML 生成 |
| Node.js | 20 LTS 以上 | Next.js / ビルドスクリプト |
| npm | Node 同梱 | パッケージ管理 |
| Ruby | 3.0 以上 | `rjui` / `sjui` / `kjui` 実行時 |
| Python | 3.10 以上 | `jui` / `jsonui-doc` 実行時 |
| Xcode | 15+（iOS 実装時のみ） | SwiftJsonUI ビルド |
| Android Studio | 最新（Android 実装時のみ） | KotlinJsonUI ビルド |

`jsonui-cli` の bootstrap でまとめて導入:

```bash
curl -fsSL https://raw.githubusercontent.com/Tai-Kimura/jsonui-cli/main/installer/bootstrap.sh | bash
```

## 2. プロジェクトルートのファイル

```
JsonUIDocument/
├── jui.config.json                # プロジェクト全体設定
├── .jsonui-type-map.json          # 型マッピング（ios/android/web 型変換）
├── .jsonui-doc-rules.json         # カスタムコンポーネント宣言
├── .gitignore
├── .nvmrc                         # "20"
├── README.md                      # プロジェクト説明
├── CONTRIBUTING.md                # 執筆ガイド
├── docs/
│   ├── plans/                     # 本設計計画書
│   └── screens/                   # jui ワークフローの正本
│       ├── json/                  # spec
│       ├── layouts/               # Layout JSON 正本
│       ├── styles/                # 共有スタイル
│       └── images/                # SVG
├── jsonui-doc-web/                # Web 実装（必須）
├── jsonui-doc-ios/                # iOS ショーケース（任意）
└── jsonui-doc-android/            # Android ショーケース（任意）
```

### 2.1 `jui.config.json`

`02-tech-stack.md` §3 に記載のとおり。要点:

- `spec_directory`: `docs/screens/json`
- `layouts_directory`: `docs/screens/layouts`
- `styles_directory`: `docs/screens/styles`
- `images_directory`: `docs/screens/images`
- `strings_file`: `docs/screens/layouts/Resources/strings.json`
- `platforms.web.root`: `jsonui-doc-web`
- `platforms.ios.root`: `jsonui-doc-ios`（任意）
- `platforms.android.root`: `jsonui-doc-android`（任意）

### 2.2 `.jsonui-type-map.json`

spec の `dataFlow.customTypes` や `returnType` で使う型名を、各プラットフォームの型に変換するルール。

```json
{
  "types": {
    "[$T]": {
      "class": "[$T]",
      "android": { "class": "List<$T>" },
      "web":     { "class": "$T[]" }
    },
    "$T?": {
      "class": "$T?",
      "android": { "class": "$T?" },
      "web":     { "class": "$T | undefined" }
    },
    "AttributeRow": {
      "class": "AttributeRow",
      "android": { "class": "AttributeRow" },
      "web":     { "class": "AttributeRow" }
    },
    "SearchRecord": {
      "class": "SearchRecord",
      "android": { "class": "SearchRecord" },
      "web":     { "class": "SearchRecord" }
    },
    "DocArticle": {
      "class": "DocArticle",
      "android": { "class": "DocArticle" },
      "web":     { "class": "DocArticle" }
    }
  }
}
```

### 2.3 `.jsonui-doc-rules.json`

ドキュメントサイト固有のコンポーネントタイプを各プラットフォームの validator に認識させる。

```json
{
  "rules": {
    "componentTypes": {
      "screen": [
        "CodeBlock",
        "NavLink",
        "TableOfContents",
        "SearchModal",
        "SearchTrigger",
        "Tabs",
        "TabPanel",
        "Prose",
        "OpenApiViewer",
        "JsonSchemaViewer",
        "PlatformBadge"
      ]
    },
    "eventHandlers": {
      "allowedNames": [
        "onAppear",
        "onToggleLanguage",
        "onSelectAttribute",
        "onSelectComponent",
        "onSearchOpen"
      ]
    }
  }
}
```

## 3. `jsonui-doc-web/` のファイル

### 3.1 `rjui.config.json`

```json
{
  "layouts_directory": "src/Layouts",
  "generated_directory": "src/generated",
  "components_directory": "src/generated/components",
  "styles_directory": "src/Styles",
  "strings_directory": "src/Strings",
  "languages": ["en", "ja"],
  "default_language": "en",
  "use_tailwind": true,
  "typescript": true
}
```

`src/Layouts` / `src/Styles` / `src/Strings` は `jui build` が配布する **生成物**（正本は `../docs/screens/...`）。

### 3.2 `package.json`

```json
{
  "name": "jsonui-doc-web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "validate:strings": "tsx scripts/validate-strings.ts",
    "build:attrs": "tsx scripts/build-attribute-reference.ts",
    "build:search": "tsx scripts/build-search-index.ts",
    "prebuild": "npm run validate:strings && npm run build:attrs && npm run build:search",
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^16.0.5",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "flexsearch": "^0.7.43",
    "shiki": "^1.0.0",
    "redoc": "^2.1.5",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "typescript": "^5.6.0",
    "tsx": "^4.7.0",
    "eslint": "^9",
    "eslint-config-next": "^16.0.5"
  }
}
```

**注意:** `rjui` コマンドは `jui build` 内で呼び出されるため、`package.json` scripts からは `rjui` を直接呼ばない。Web だけで開発したい場合のみ、追加 script `"build:rjui": "rjui build"` を置くことも可能。

### 3.3 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", "scripts/**/*.ts", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 3.4 `next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: false,
  images: { unoptimized: true },
};

export default nextConfig;
```

### 3.5 `postcss.config.mjs`

```js
const config = { plugins: ["@tailwindcss/postcss"] };
export default config;
```

### 3.6 `eslint.config.mjs`

```js
import next from "eslint-config-next";

export default [
  ...next,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "react/no-unescaped-entities": "off"
    },
    ignores: [
      "src/generated/**",
      "src/Layouts/**",   // jui build 出力
      "src/Styles/**",    // jui build 出力
      "src/Strings/**",   // jui build 出力
      "node_modules/**",
      ".next/**",
      "src/data/attribute-reference/**"
    ]
  }
];
```

### 3.7 `.gitignore`（プロジェクトルート）

```
# Root
node_modules/

# jui build 出力（各プラットフォームに配布されるが、正本は docs/screens/）
jsonui-doc-web/src/Layouts/
jsonui-doc-web/src/Styles/
jsonui-doc-web/src/Strings/
jsonui-doc-web/public/images/
jsonui-doc-web/src/viewmodels/
jsonui-doc-web/src/generated/
jsonui-doc-web/.next/
jsonui-doc-web/out/
jsonui-doc-web/public/search/
jsonui-doc-web/src/data/attribute-reference/

jsonui-doc-ios/JsonUIDoc/Layouts/
jsonui-doc-ios/JsonUIDoc/Styles/
jsonui-doc-ios/JsonUIDoc/Resources/strings.json
jsonui-doc-ios/JsonUIDoc/Assets.xcassets/**/*.imageset/
jsonui-doc-ios/build/

jsonui-doc-android/app/src/main/assets/Layouts/
jsonui-doc-android/app/src/main/assets/Styles/
jsonui-doc-android/app/src/main/res/drawable/ic_*.xml
jsonui-doc-android/app/build/

# Ruby
.bundle/
vendor/bundle/
```

## 4. ビルドフロー

### 4.1 ローカル（開発）

```bash
# 初回セットアップ
cd JsonUIDocument
jui init           # jui.config.json 生成（既に用意済みならスキップ）
cd jsonui-doc-web
npm install

# 開発モード（2 ターミナル）
# --- ターミナル 1 ---
cd JsonUIDocument
jui build --watch          # spec/Layout/Style/Image 変更を監視し各プラットフォームに配布

# --- ターミナル 2 ---
cd jsonui-doc-web
npm run dev                # next dev + rjui watch（Fast Refresh）
```

`jui build --watch` が内部で `rjui watch` を起動する設計にするか、明示的に 3 ターミナル目で `rjui watch` を走らせるかは実装時に決める（初期は明示 3 ターミナルで OK）。

### 4.2 spec 変更サイクル

```bash
# 1. 新規ページ spec 生成
jui g screen LearnHelloWorld

# 2. spec 編集
$EDITOR docs/screens/json/learn_hello_world.spec.json

# 3. Layout JSON + ViewModel 生成
jui g project --file learn_hello_world.spec.json

# 4. Layout 微調整
$EDITOR docs/screens/layouts/learn_hello_world.json

# 5. 差分確認
jui verify --file learn_hello_world.spec.json --detail

# 6. 配布
jui build
```

### 4.3 本番ビルド

```bash
# プロジェクトルートで一括
cd JsonUIDocument
jui build                  # spec バリデーション → Layout 配布 → 各プラットフォーム build

# Web 単独
cd jsonui-doc-web
npm run build              # prebuild → next build
```

## 5. CI

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: jsonui-doc-web/package-lock.json
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: "3.3"
          bundler-cache: true
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install jsonui-cli
        run: |
          curl -fsSL https://raw.githubusercontent.com/Tai-Kimura/jsonui-cli/main/installer/bootstrap.sh | bash
          echo "$HOME/.jsonui-cli/jui_tools/bin"   >> $GITHUB_PATH
          echo "$HOME/.jsonui-cli/rjui_tools/bin"  >> $GITHUB_PATH

      - name: Lint specs
        run: jsonui-doc validate-spec docs/screens/json --recursive

      - name: Verify (spec vs layout)
        run: jui verify --fail-on-diff

      - name: Generate all (spec -> layouts)
        run: jui g project

      - name: Distribute & build (web only)
        run: |
          jui build --web-only

      - name: Install web deps
        working-directory: jsonui-doc-web
        run: npm ci

      - name: Typecheck
        working-directory: jsonui-doc-web
        run: npm run typecheck

      - name: Lint (web)
        working-directory: jsonui-doc-web
        run: npm run lint

      - name: Build web
        working-directory: jsonui-doc-web
        run: npm run build

      - name: Deploy (Vercel)
        if: github.ref == 'refs/heads/main'
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
          working-directory: jsonui-doc-web

  ios-showcase:
    # iOS 実装を Phase 5 以降で有効化。空の時点ではスキップ
    if: false
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - name: Install jsonui-cli
        run: curl -fsSL .../bootstrap.sh | bash
      - name: jui build --ios-only
        run: jui build --ios-only
      - name: xcodebuild
        working-directory: jsonui-doc-ios
        run: xcodebuild -scheme JsonUIDoc -destination 'platform=iOS Simulator,name=iPhone 15'

  android-showcase:
    if: false
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: "temurin"
          java-version: "17"
      - name: Install jsonui-cli
        run: curl -fsSL .../bootstrap.sh | bash
      - name: jui build --android-only
        run: jui build --android-only
      - name: gradle build
        working-directory: jsonui-doc-android
        run: ./gradlew assembleDebug
```

## 6. コマンドチートシート

| 目的 | コマンド | 実行場所 |
|------|---------|----------|
| 初期化 | `jui init` | プロジェクトルート |
| 新規 spec 生成 | `jui g screen <Name>` | プロジェクトルート |
| Layout + ViewModel 生成 | `jui g project [--file xxx.spec.json]` | プロジェクトルート |
| 単一プラットフォームのみ | `jui g project --web-only` / `--ios-only` / `--android-only` | プロジェクトルート |
| 配布 + ビルド | `jui build` | プロジェクトルート |
| 差分チェック | `jui verify [--file xxx.spec.json] [--fail-on-diff]` | プロジェクトルート |
| spec 検証 | `jsonui-doc validate-spec <path>` | 任意 |
| Web 開発サーバー | `npm run dev` | `jsonui-doc-web/` |
| Web 本番ビルド | `npm run build` | `jsonui-doc-web/` |
| iOS ビルド | `sjui build` or `xcodebuild` | `jsonui-doc-ios/` |
| Android ビルド | `kjui build` or `./gradlew build` | `jsonui-doc-android/` |
| 属性リファレンス spec 生成 | `tsx scripts/build-attribute-reference.ts` | `jsonui-doc-web/` |
| 検索インデックス生成 | `tsx scripts/build-search-index.ts` | `jsonui-doc-web/` |

## 7. 開発者体験（DX）

### 7.1 ホットリロード

- `jui build --watch` と `npm run dev` を並行実行
- Layout JSON 編集 → 各プラットフォームに再配布 → Web Fast Refresh で画面更新（数秒）
- iOS は SwiftJsonUI の Hot Loader、Android は KotlinJsonUI の Hot Loader で同様の体験（Phase 5+）

### 7.2 型チェック

```bash
cd jsonui-doc-web && npm run typecheck
```

`rjui` が生成する `.tsx` は strict ビルドで通る前提。`.jsonui-type-map.json` に不足があれば補う。

### 7.3 デバッグ

- spec バリデーションエラー: `jsonui-doc validate-spec <file> --detail`
- `jui verify --detail`: spec と Layout JSON の差分を詳細表示
- Layout JSON の構文: `rjui validate`（Web 側）、`sjui validate` / `kjui validate`（各プラットフォーム）

## 8. デプロイ

- **Web**: Vercel（`jsonui-doc-web/` を project root に指定）
  - Custom domain: `docs.jsonui.dev`（仮）
  - Preview: PR ごとに自動発行
- **iOS（ショーケース）**: TestFlight（限定配布）/ App Store は検討中
- **Android（ショーケース）**: Play Console Internal Testing

## 9. 監視・運用

- Vercel Analytics（アクセス解析）
- Sentry（エラー監視、初期は不要）
- リンク切れチェック: `lychee` を CI に追加（後続フェーズ）

## 10. Storybook / コンポーネントドキュメント

- rjui Converter の個別確認に Storybook は**不採用**
- 代わりに `/platforms/react/dogfooding` ページで生 JSON → 画面の対応を列挙
- iOS / Android 版も同様（`/platforms/swift/dogfooding` / `/platforms/kotlin/dogfooding`）

## 11. 実装チェックリスト

- [ ] `jui init` でプロジェクト初期化、`jui.config.json` を上記内容に整える
- [ ] `.jsonui-type-map.json` / `.jsonui-doc-rules.json` を用意
- [ ] `jsonui-doc-web/` に `package.json` / `tsconfig.json` / `next.config.ts` / `postcss.config.mjs` / `eslint.config.mjs` / `rjui.config.json` を用意
- [ ] `.gitignore` を本計画書どおりに用意
- [ ] `scripts/validate-strings.ts` / `scripts/build-attribute-reference.ts` / `scripts/build-search-index.ts` 実装
- [ ] `.github/workflows/ci.yml` 用意（web ジョブを先行、ios/android は skip）
- [ ] ローカルで `jui build` が成功すること
- [ ] `cd jsonui-doc-web && npm run dev` でサイト表示
- [ ] Vercel プロジェクト作成・Secrets 登録
- [ ] Phase 5 で `jsonui-doc-ios/` / `jsonui-doc-android/` 追加、CI の `if: false` を解除
