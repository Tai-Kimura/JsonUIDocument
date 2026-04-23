# JsonUIDocument — Claude working notes

## ライブラリバグの取り扱い（重要）

JsonUI ライブラリ群（`jsonui-cli` / `rjui_tools` / `sjui_tools` / `kjui_tools` / `jsonui-mcp-server` / `jsonui-test-runner` / SwiftJsonUI / KotlinJsonUI / ReactJsonUI）のバグに遭遇した場合、**このプロジェクト側では勝手に修正しない**。

### 新しいバグを見つけたとき

1. `/Users/like-a-rolling_stone/resource/jsonui-cli/docs/bugs/<kebab-id>.md` にバグレポートを作成する
2. ファイル名プレフィクス: `rjui-` / `sjui-` / `kjui-` / `jui-` / `mcp-` / `doc-`
3. フォーマットは `jsonui-cli/docs/bugs/README.md` 参照
4. 消費側での暫定回避を適用した場合は、レポートの「Workaround」セクションに明記する
5. 修正そのものは user（ライブラリメンテナ）が upstream で対応する

### セッション開始時のルーチン（監視）

`/Users/like-a-rolling_stone/resource/jsonui-cli/docs/bugs/reports/` に **batch 形式の修正完了レポート** (`YYYY-MM-DD-<batch-label>.md`) が置かれる。セッションの冒頭で以下をチェック:

1. `reports/*.md`（`README.md` 除く）に未処理の batch レポートがあるか確認
   - 「未処理」の判定は user と相談（一度検証したバッチは frontmatter `sync_required: false` 等で区別するか、履歴を別のファイルで管理するか。初期は user に最後のバッチ名を確認するのが確実）
2. 未処理の batch があれば、それぞれについて:
   - `jui sync_tool` を実行して `rjui_tools` / 他プラットフォームツールを最新化
   - レポートの「確認手順」に従って挙動を検証（`jui build` / `jui verify` / 実際の再現ケース）
   - **全て期待通りに修正されていれば**:
     - 消費側で適用していた暫定回避を外す（レポートの「既存の暫定回避を外す場合」欄に従う）
     - 関連する todo / memo があれば閉じる
     - 注: ライブラリ側では報告書化後に `docs/bugs/<id>.md` が削除される運用なので、消費側で参照する際は **reports/ が唯一の正本** になる
   - **期待通りに修正されていない項目があれば**:
     - `docs/bugs/<new-id>.md` に新規バグレポートを提出（fix が不十分だった旨、観測された現象を記載）
     - 「再発」であることが分かるよう、元 bug id を `Related` セクションに記載

### 「ライブラリ」と「プロジェクト」の境界

- **プロジェクト側（編集 OK）**: 画面 spec、component spec、layout JSON、styles、ViewModel body、strings、test JSON、カスタムコンポーネントの converter の **コンテンツ**（attribute の値や JSX の組み立て方法）
- **ライブラリ側（編集 NG・報告のみ）**: `rjui_tools/lib/` 配下のうち `jui init` / `jui sync_tool` で同期されるベースクラス・テンプレート・scaffold デフォルト、MCP ツールの return 挙動、test runner driver の内部実装、`attribute_definitions` の scaffold 初期値

判断に迷う場合:
- その修正が「この特定のコンポーネント／画面に固有」か → プロジェクト側
- その修正が「同じパターンの別コンポーネントでも発生するはず」か → ライブラリ側（報告）

## 既知のオープンバグ

セッション開始時点で open になっているバグは `jsonui-cli/docs/bugs/` を参照。`status: open` 以外（`investigating` / `fixed` / `wontfix`）は対応済み扱い。

## JsonUI workflow ルール

このリポジトリは JsonUI プロジェクト。セッション開始時に `.claude/jsonui-workflow.md` が注入される。4つの不変条件:

1. `jui build` must pass with zero warnings
2. `jui verify --fail-on-diff` must pass with no drift
3. `@generated` files are never hand-edited — edit the spec instead
4. `jsonui-localize` must run before a screen is considered done

詳細: `.claude/jsonui-rules/invariants.md`

## ドキュメントサイトの全体計画

`docs/plans/` 参照。特に:
- `00-overview.md` — プロジェクト全体像
- `02-tech-stack.md` / `02b-jui-workflow.md` — jui ワークフロー根幹
- `15-toolchain.md` — ツールチェーン構成
- `16-migration-and-rollout.md` — Phase 分割
- `17-spec-templates.md` — spec 雛形
