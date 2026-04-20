# 13. コンテンツプラン: Dynamic Mode / Hot Reload（横断解説）

> **実装アーキテクチャ（本計画書共通）:** 各ページは `docs/screens/json/concepts/*.spec.json` で定義、
> `jui g project` で Layout + ViewModel。
> プラットフォーム別セットアップ表は `Collection + cellClasses`（`cells/setup_step_row.json`）、
> Dynamic vs Static のフローチャートは SVG 画像 + `Image` コンポーネントで表示。
> 詳細は `02-tech-stack.md` / `17-spec-templates.md`。
>
> Layout の置き場: `docs/screens/layouts/concepts/*.json`

## 1. 対象

JsonUI ファミリー横断の**実行時機能**を統合解説。

- **Dynamic Mode**: JSON Layout をランタイムに読み込み・差し替え
- **Hot Reload（Hot Loader）**: 開発中、ローカルファイル変更をアプリに即時反映

各プラットフォームの詳細は `/platforms/{swift,kotlin,react}/hot-loader` と `/platforms/{swift,kotlin,react}/dynamic-mode` に個別ページを設け、**共通概念**はここに集約する。

## 2. ページ構成

```
/concepts/dynamic-mode                        Dynamic Mode とは
/concepts/hot-reload                          Hot Reload とは
/concepts/dynamic-vs-static                   Dynamic vs Static の判断基準
/concepts/hot-reload-architecture             アーキテクチャ（hotloader server / ip_monitor / アプリ接続）
/concepts/dynamic-security                    セキュリティ・リスク
/concepts/hot-reload-setup-matrix             プラットフォーム別セットアップ早見表
```

## 3. `dynamic-mode` の要点

### 3.1 概念
- **Static Mode**（通常）: ビルド時に JSON → ネイティブコードを生成、JSON はアプリバイナリに静的に含まれる
- **Dynamic Mode**: ランタイムに JSON を読み込み、Parser が Tree を構築、ビューを動的にレンダリング
- Swift 側: `DynamicView` / `JSONLayoutLoader` / `ViewSwitcher` / `StyleProcessor`
- Kotlin 側: `library-dynamic`, `SafeDynamicView`, `DynamicModeToggle`
- React 側: 現状は静的生成が主で、Dynamic Mode 相当はロードマップ扱い

### 3.2 用途
- A/B テスト（レイアウト差し替え）
- リリースなしでレイアウト修正（ホットフィックス）
- 多国向けに JSON を切り替え
- プレイグラウンド的な開発体験（Hot Reload と組合せ）

### 3.3 実装
- Swift:
  ```swift
  DynamicView("home", viewModel: HomeViewModel())
  ```
- Kotlin:
  ```kotlin
  SafeDynamicView(layoutName = "home", viewModel = viewModel)
  ```

### 3.4 制約
- 型安全性が下がる（JSON パースエラーはランタイムまで検出できない）
- binding の `@{}` 参照先が見つからない場合の fallback
- コード署名審査（iOS App Store）との関係

## 4. `hot-reload` の要点

### 4.1 概念
- 開発者マシンで `sjui hotload` / `kjui hotload` / `rjui hotload` を起動
- Node.js ベースの WebSocket サーバー（`jsonui-cli/{sjui,kjui,rjui}_tools/lib/hotloader/server.js`）
- `ip_monitor.rb` で LAN IP を監視し、アプリが接続先を自動切替
- アプリ側は JSON Layout ファイルの変更を受信してビューを再構築

### 4.2 セットアップ流れ（共通）

```
[開発マシン]
  $ sjui hotload      # ポート 8080 で WS サーバー起動
  ├── server.js       (node)
  └── ip_monitor.rb   (ruby; IP 変化を検知)

       ↑ WebSocket 双方向
       │
[アプリ（開発ビルド）]
  HotLoader クライアント (SwiftJsonUI / KotlinJsonUI)
  ・IP 変化通知で接続先切替
  ・JSON 変更通知を受けて DynamicView を再レンダー
```

### 4.3 各プラットフォームの参考設定

詳細は各プラットフォームページに。ここではテーブルで相互リンク:

| プラットフォーム | CLI | 接続クラス | 詳細ページ |
|----------------|-----|----------|----------|
| SwiftJsonUI | `sjui hotload` | `HotLoader.swift` / `HotLoaderConfigReader.swift` | `/platforms/swift/hot-loader` |
| KotlinJsonUI | `kjui hotload` | `HotLoaderClient`（library 内） | `/platforms/kotlin/hot-loader` |
| ReactJsonUI | `rjui hotload` / `rjui watch` | Next.js Fast Refresh + ファイル監視 | `/platforms/react/hot-loader` |

## 5. `dynamic-vs-static`

判断フローチャート:

```
レイアウトを実行時に差し替える必要がある？
├── はい: Dynamic Mode
│       - 開発中の Hot Reload と組合せ推奨
│       - App Store 審査: コードロジック差し替えは NG、
│         レイアウトのみの差し替えは OK（JsonUI の Dynamic Mode は UI 構造変更のみ）
│
└── いいえ: Static Mode（推奨デフォルト）
        - 型安全
        - ビルド時エラー検出
        - 本番環境の標準設定
```

## 6. `hot-reload-architecture`

アーキテクチャ図:

```
┌──── Dev Machine ───────────────────────────┐
│                                            │
│   src/Layouts/*.json  ──(fs watch)──▶      │
│                                            │
│   [ Hot Loader Server ]                    │
│    ├── WebSocket Server (node server.js)   │
│    ├── IP Monitor (Ruby ip_monitor.rb)     │
│    └── Broadcast: { path, layoutJson }     │
│                                            │
└─────────────┬──────────────────────────────┘
              │ WebSocket (LAN)
              ▼
┌──── App (Dev Build) ──────────────────────┐
│                                           │
│   HotLoader Client                        │
│    ├── 接続先 IP 自動解決                 │
│    ├── JSON 受信                          │
│    └── DynamicView 再描画                 │
│                                           │
└────────────────────────────────────────────┘
```

## 7. `dynamic-security`

- 本番ビルドで Dynamic Mode を有効にする場合、JSON 取得元を固定（HTTPS + 署名検証推奨）
- Hot Loader は**開発ビルドのみ**で有効化（`#if DEBUG` / `BuildConfig.DEBUG`）
- LAN 内接続は信頼できるネットワークでのみ
- JSON からコードが直接実行されるわけではないが、イベントハンドラ名のバインド先が存在しないと警告

## 8. `hot-reload-setup-matrix`

1 ページで 3 プラットフォームすべての最短セットアップ手順を並列表示。

| ステップ | iOS | Android | Web |
|---------|-----|---------|-----|
| 1. CLI 起動 | `sjui hotload` | `kjui hotload` | `rjui hotload` |
| 2. アプリ側設定 | `HotLoaderConfigReader` を initialize | `HotLoaderClient.start()` | Next.js Fast Refresh 自動 |
| 3. デバッグビルド確認 | `#if DEBUG` 有効 | `BuildConfig.DEBUG` 有効 | `NODE_ENV=development` |
| 4. 接続確認 | シミュレータで `DynamicView` 表示 | エミュレータで `SafeDynamicView` 表示 | `http://localhost:3000` |
| 5. JSON 編集 | `src/Layouts/home.json` を保存 | 同左 | 同左 |
| 6. 即時反映 | 数秒で画面更新 | 同左 | 同左 |

## 9. Strings 追加キー

`concepts_*` 共通セクションのうち、dynamic / hotreload 関連は `concepts_dynamic_*` / `concepts_hotreload_*` プレフィックス。約 25 キー × 2 言語。

## 10. 実装チェックリスト

- [ ] `docs/screens/json/concepts/dynamic-mode.spec.json`
- [ ] `docs/screens/json/concepts/hot-reload.spec.json`
- [ ] `docs/screens/json/concepts/dynamic-vs-static.spec.json`
- [ ] `docs/screens/json/concepts/hot-reload-architecture.spec.json`
- [ ] `docs/screens/json/concepts/dynamic-security.spec.json`
- [ ] `docs/screens/json/concepts/hot-reload-setup-matrix.spec.json`
- [ ] 各 spec に対し `jui g project --file ...`
- [ ] `docs/screens/layouts/concepts/*.json` 手作業で仕上げ
- [ ] `jsonui-doc-web/src/app/concepts/**/page.tsx`
- [ ] `docs/screens/layouts/common/sidebar_concepts.json`（`platforms: ["web"]`）
- [ ] Strings `concepts_dynamic_*` / `concepts_hotreload_*`
- [ ] アーキテクチャ図（Draw.io / mermaid を SVG 化）→ `docs/screens/images/` に配置、`jui build` で各プラットフォームに変換配布
- [ ] 各プラットフォームページとの双方向リンク
