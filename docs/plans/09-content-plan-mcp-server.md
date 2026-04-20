# 09. コンテンツプラン: jsonui-mcp-server（MCP + Swagger 手書き）

> **実装アーキテクチャ（本計画書共通）:** 各ページは `docs/screens/json/tools/mcp/**/*.spec.json` で定義し、
> `jui g project` で Layout JSON + ViewModel を生成。
> OpenAPI ビューア（Redoc）は **Web 専用** Converter `OpenApiViewer`（`platforms: ["web"]`）で表示。
> 詳細は `02-tech-stack.md` / `17-spec-templates.md`。
>
> Layout の置き場: `docs/screens/layouts/tools/mcp/**/*.json`
> Swagger YAML の置き場: `jsonui-doc-web/public/openapi/mcp.yaml`
>
> ツール一覧は `Collection + cellClasses` で描画（`cells/mcp_tool_row.json`）。

## 1. 対象リポジトリ

`/Users/like-a-rolling_stone/resource/jsonui-mcp-server/`

- `src/tools/` 配下に 29 MCP ツール（Group A 7 / B 6 / C 7 / D 9）
- コンポーネント属性データ・presentation metadata は `jsonui-cli/shared/core/` の 2 ファイル（`attribute_definitions.json` + `component_metadata.json`）を **runtime で読み込み**（4 層 fallback: `JSONUI_CLI_PATH` env → `./.jsonui-cli/` → `~/.jsonui-cli/` → bundled snapshot `data/`）。旧 `specs/` ディレクトリと `scripts/generate_specs.py` は削除済み。
- `scripts/fetch-definitions.js` が npm postinstall で GitHub main から 2 ファイルを `data/` に取得し、bundled snapshot を更新する（best-effort、オフライン時は既存 snapshot を保持）。
- `docs/design.md` に現行設計書

## 2. ページ構成

```
/tools/mcp
├── /tools/mcp/overview                         MCP サーバーとは
├── /tools/mcp/why                              なぜ MCP が必要か（AI 差別化）
├── /tools/mcp/install                          インストール手順
├── /tools/mcp/configure                        ~/.claude.json 設定
├── /tools/mcp/project-dir                      JUI_PROJECT_DIR の使い方
├── /tools/mcp/update                           アップデート
├── /tools/mcp/tools                            全 29 ツール一覧（カード型）
├── /tools/mcp/tools/context-group              Group A: コンポーネント仕様参照 (7)
│   ├── /tools/mcp/tools/lookup-component
│   ├── /tools/mcp/tools/lookup-attribute
│   ├── /tools/mcp/tools/search-components
│   ├── /tools/mcp/tools/get-modifier-order
│   ├── /tools/mcp/tools/get-binding-rules
│   ├── /tools/mcp/tools/get-platform-mapping
│   └── /tools/mcp/tools/get-data-source       # 4 層 fallback のどこから読んだか / freshness 報告
├── /tools/mcp/tools/project-group              Group B: プロジェクトコンテキスト (6)
│   ├── /tools/mcp/tools/get-project-config
│   ├── /tools/mcp/tools/list-screen-specs
│   ├── /tools/mcp/tools/list-component-specs
│   ├── /tools/mcp/tools/list-layouts
│   ├── /tools/mcp/tools/read-spec-file
│   └── /tools/mcp/tools/read-layout-file
├── /tools/mcp/tools/jui-group                  Group C: jui CLI (7)
│   ├── /tools/mcp/tools/jui-init
│   ├── /tools/mcp/tools/jui-generate-project
│   ├── /tools/mcp/tools/jui-generate-screen
│   ├── /tools/mcp/tools/jui-generate-converter
│   ├── /tools/mcp/tools/jui-build
│   ├── /tools/mcp/tools/jui-verify
│   └── /tools/mcp/tools/jui-migrate-layouts
├── /tools/mcp/tools/doc-group                  Group D: jsonui-doc CLI (9)
│   ├── /tools/mcp/tools/doc-init-spec
│   ├── /tools/mcp/tools/doc-init-component
│   ├── /tools/mcp/tools/doc-validate-spec
│   ├── /tools/mcp/tools/doc-validate-component
│   ├── /tools/mcp/tools/doc-generate-spec
│   ├── /tools/mcp/tools/doc-generate-component
│   ├── /tools/mcp/tools/doc-generate-html
│   ├── /tools/mcp/tools/doc-rules-init
│   └── /tools/mcp/tools/doc-rules-show
├── /tools/mcp/data-sources                     attribute_definitions.json / component_metadata.json の構造と 4 層 fallback
├── /tools/mcp/openapi                          OpenAPI (Swagger UI / Redoc ビューア)
└── /tools/mcp/design                           設計書（docs/design.md 引用）
```

## 3. Swagger / OpenAPI 手書き戦略

### 3.1 なぜ手書きか
- MCP ツールは「汎用 REST API」ではなく、ツール関数として `input schema` + `output schema` をもつ
- 現状のコードは TypeScript 実装であり、JSDoc から自動生成も可能だが、説明文・使用例の充実度が落ちる
- ユーザー指定で**手書き OpenAPI YAML**を採用

### 3.2 手書き YAML の置き場所

```
public/openapi/
├── mcp.yaml                    # エントリポイント
├── paths/
│   ├── context.yaml            # Group A
│   ├── project.yaml            # Group B
│   ├── jui.yaml                # Group C
│   └── doc.yaml                # Group D
└── components/
    ├── schemas.yaml            # 共通データ型
    ├── parameters.yaml         # 共通パラメータ
    └── responses.yaml          # 共通レスポンス
```

### 3.3 OpenAPI ファイル構造（概要）

```yaml
# public/openapi/mcp.yaml
openapi: 3.1.0
info:
  title: JsonUI MCP Server
  version: "0.1.0"
  description: |
    MCP (Model Context Protocol) server for JsonUI project management.
    Wraps `jui` and `jsonui-doc` CLI and exposes component spec queries.

servers:
  - url: mcp://jui-tools
    description: MCP invocation endpoint

tags:
  - name: context
    description: Component spec lookup (Group A)
  - name: project
    description: Project context (Group B)
  - name: jui
    description: jui CLI wrapper (Group C)
  - name: doc
    description: jsonui-doc CLI wrapper (Group D)

paths:
  /lookup_component:
    $ref: "./paths/context.yaml#/lookup_component"
  /lookup_attribute:
    $ref: "./paths/context.yaml#/lookup_attribute"
  /search_components:
    $ref: "./paths/context.yaml#/search_components"
  /get_modifier_order:
    $ref: "./paths/context.yaml#/get_modifier_order"
  /get_binding_rules:
    $ref: "./paths/context.yaml#/get_binding_rules"
  /get_platform_mapping:
    $ref: "./paths/context.yaml#/get_platform_mapping"
  /get_data_source:
    $ref: "./paths/context.yaml#/get_data_source"
  /get_project_config:
    $ref: "./paths/project.yaml#/get_project_config"
  # ... (以下省略)

components:
  schemas:
    $ref: "./components/schemas.yaml"
```

### 3.4 各ツールのエントリ例（`paths/context.yaml`）

```yaml
lookup_component:
  post:
    tags: [context]
    summary: コンポーネント仕様を取得
    description: |
      指定コンポーネント（Label、Button、View など）の属性一覧・binding 情報・
      プラットフォーム別対応を返す。
    operationId: lookup_component
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [name]
            properties:
              name:
                type: string
                description: コンポーネント名
                example: "Label"
              platform:
                type: string
                enum: [swift, kotlin, react, all]
                default: all
    responses:
      "200":
        description: OK
        content:
          application/json:
            schema:
              $ref: "../components/schemas.yaml#/ComponentSpec"
            example:
              name: Label
              description: テキストを表示する
              platforms:
                swift_generated: true
                swift_dynamic: true
                kotlin_generated: true
                kotlin_dynamic: true
                react: true
              attributes:
                text:
                  type: [string, binding]
                  description: 表示するテキスト
```

### 3.5 共通スキーマ（`components/schemas.yaml`）

```yaml
ComponentSpec:
  type: object
  properties:
    name: { type: string }
    description: { type: string }
    aliases:
      type: array
      items: { type: string }
    platforms:
      $ref: "#/PlatformSupport"
    attributes:
      type: object
      additionalProperties:
        $ref: "#/AttributeSpec"

PlatformSupport:
  type: object
  properties:
    swift_generated: { type: boolean }
    swift_dynamic: { type: boolean }
    kotlin_generated: { type: boolean }
    kotlin_dynamic: { type: boolean }
    react: { type: boolean }

AttributeSpec:
  type: object
  properties:
    type:
      oneOf:
        - type: string
        - type: array
          items:
            oneOf:
              - type: string
              - $ref: "#/EnumSpec"
    description: { type: string }
    required: { type: boolean }
    bindingDirection:
      type: string
      enum: [read-only, two-way]
      nullable: true
      description: |
        `attribute_definitions.json` の `binding_direction` を反映。
        `"two-way"` が明示されていない binding 属性は `read-only` として返す。
    aliases:
      type: array
      items: { type: string }

EnumSpec:
  type: object
  properties:
    enum:
      type: array
      items: { type: string }
```

## 4. OpenAPI ビューアの実装

- `src/components/extensions/OpenApiViewer.tsx`
- ライブラリ: **Redoc**（`redoc` npm パッケージ）を推奨。静的ビルドでパフォーマンス良好
- 代替: Swagger UI（`swagger-ui-react`）

```tsx
// src/components/extensions/OpenApiViewer.tsx
"use client";
import { RedocStandalone } from "redoc";

export function OpenApiViewer({ specUrl }: { specUrl: string }) {
  return (
    <RedocStandalone
      specUrl={specUrl}
      options={{
        theme: { colors: { primary: { main: "#087EA4" } } },
        hideDownloadButton: false,
        disableSearch: false,
        nativeScrollbars: true,
      }}
    />
  );
}
```

ReactJsonUI 側の Converter を追加:

```json
{
  "type": "OpenApiViewer",
  "specUrl": "/openapi/mcp.yaml"
}
```

## 5. 各ツールページの共通テンプレ

1. **概要**（何をするツールか）
2. **Group**（A/B/C/D バッジ）
3. **CLI 相当のコマンド**（該当すれば）
4. **入力パラメータ**（表）
5. **出力スキーマ**
6. **実行例**（Claude / Codex で呼ぶときの JSON）
7. **関連ツール**

### 5.1 例: `lookup_component`

- 概要: 指定コンポーネントの仕様を取得
- Group: A
- Input: `{ name: string, platform?: "swift"|"kotlin"|"react"|"all" }`
- Output: `ComponentSpec`
- 使用例:
  ```json
  { "name": "Label" }
  ```
  → 返り値は Label の属性一覧

### 5.2 例: `jui_generate_screen`

- Group: C
- CLI: `jui g screen <names...>`
- Input: `{ names: string[], displayName?: string, projectDir?: string }`
- Output: `{ created: string[], skipped: string[] }`

## 6. MCP 設定の実装サンプル

```jsonc
// ~/.claude.json（抜粋）
{
  "mcpServers": {
    "jui-tools": {
      "command": "node",
      "args": ["/Users/you/.jsonui-mcp-server/dist/index.js"],
      "env": {
        "JUI_PROJECT_DIR": "/Users/you/workspace/myapp"
      }
    }
  }
}
```

設定 UI（`/tools/mcp/configure`）には上記 JSON と「自分のパスに置き換える」箇所を強調表示。

## 7. 「なぜ MCP が必要か」ページ

`/tools/mcp/why` は本サイトの**差別化強調ページ**。

以下の図を掲載:

```
┌──────────────────────────────────────┐
│ 通常の AI コーディング              │
│ 「Label に属性 fontSize ある？」     │
│  AI がネットから曖昧情報を拾う       │
│  → 幻覚のリスク高                    │
└──────────────────────────────────────┘
            ↓ 改善
┌──────────────────────────────────────┐
│ JsonUI MCP                           │
│ AI が `lookup_attribute` を呼び出す │
│ → 正しい仕様が直接返る              │
│ → 幻覚ゼロ、コンテキスト節約         │
└──────────────────────────────────────┘
```

この「制約によって AI の出力分散を下げる」哲学は `JsonUI-Agents-for-claude/README.md` と同一の文脈。`/tools/agents/overview` と内部リンクで結ぶ。

## 8. Strings 追加キー

`tools_mcp_*` プレフィックスで約 45 キー × 2 言語。

## 9. 実装チェックリスト

- [ ] `jsonui-doc-web/public/openapi/mcp.yaml` と分割ファイルを手書きで作成（`docs/design.md` と `specs/` を参照）
- [ ] `jsonui-doc-web/src/components/extensions/OpenApiViewer.tsx` 実装
- [ ] Converter `OpenApiViewer` を `jui g converter OpenApiViewer --web-only` で登録
- [ ] `docs/screens/json/tools/mcp/**/*.spec.json` 約 42 枚（`jui g screen` 一括生成）
- [ ] 各 spec に対し `jui g project --file ...`
- [ ] `docs/screens/layouts/tools/mcp/**/*.json` 手作業で仕上げ
- [ ] `jsonui-doc-web/src/app/tools/mcp/**/page.tsx`
- [ ] `docs/screens/layouts/common/sidebar_tools_mcp.json`（`platforms: ["web"]`）
- [ ] Strings `tools_mcp_*`
- [ ] `/tools/mcp/openapi` で Redoc を表示（`OpenApiViewer` コンポーネント、`platforms: ["web"]`）
- [ ] 「なぜ MCP が必要か」の図版を作成
