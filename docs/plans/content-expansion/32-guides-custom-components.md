# 32. コンテンツプラン: Guides — Custom Components

> Scope: 4〜6 時間 / 1〜2 セッション。`/guides/custom-components` を完成。component spec 先行の完全フローを具体例で示す。
> 依存: plan 27 (json-schema の component spec 節)。

---

## 1. 対象記事

| URL | spec | Layout | 現状 |
|---|---|---|---|
| `/guides/custom-components` | `docs/screens/json/guides/custom-components.spec.json` | `docs/screens/layouts/guides/custom-components.json` | 骨組みのみ、CodeBlock 0 |

完成条件: CodeBlock ≥ 10、実例コンポーネント 2 件を最初から最後まで通す、クロスリンク ≥ 3。

---

## 2. コンテンツ構造

### 2.1 ページの目的
- en: "Build a reusable custom component (e.g., a CodeBlock widget) from scratch. Covers: component spec authoring, converter generation, styling per platform, and usage from Layout JSON."
- ja: "カスタムコンポーネント（例: CodeBlock ウィジェット）を最初から作る。component spec の書き方、converter 生成、プラットフォーム別スタイリング、Layout からの使い方を網羅。"

### 2.2 カスタムコンポーネントを作る判断基準

以下のどれかに該当するなら custom component を作る:
- 2 画面以上で同じ構造を繰り返す（DRY）
- 既存の標準コンポーネントでは実現できない機能（syntax highlighting, drag-and-drop, rich editor 等）
- ロジックをコンポーネントに閉じ込めたい（i.e., ViewModel 側で書きたくない）

作らないほうがいい:
- 一度しか使わないレイアウト → `include` で共有すれば十分
- 単純な style 差分 → `style` preset で済む

### 2.3 原則: spec-first

JsonUI では custom component も**必ず spec を先に書く**。理由:
- 3 プラットフォーム全てで同じ API を保証
- ドキュメントが自動生成される（`jsonui-doc`）
- AI エージェントが正しく使える

### 2.4 具体例 A: CodeBlock コンポーネント

#### Step 1: Component spec を書く

`docs/screens/json/components/codeblock.component.json`:

```json
{
  "type": "component_spec",
  "version": "1.0",
  "metadata": {
    "name": "CodeBlock",
    "displayName": "Code Block",
    "description": "Syntax-highlighted code snippet with optional copy button and line numbers",
    "category": "display",
    "platforms": ["web", "ios", "android"]
  },
  "props": [
    { "name": "language", "type": "String", "required": true, "description": "Programming language for syntax highlighting (`swift`, `kotlin`, `typescript`, `json`, `bash`)" },
    { "name": "code", "type": "String", "required": true, "description": "The code content" },
    { "name": "showCopyButton", "type": "Bool", "initial": "true" },
    { "name": "showLineNumbers", "type": "Bool", "initial": "false" },
    { "name": "theme", "type": "String", "initial": "'github-light'", "description": "Theme name: `github-light`, `github-dark`, `monokai`" }
  ],
  "events": [
    { "name": "onCopy", "params": [{ "name": "text", "type": "String" }] }
  ],
  "dataFlow": {
    "customTypes": []
  }
}
```

#### Step 2: Converter を生成

```bash
$ jui g converter --from docs/screens/json/components/codeblock.component.json
✓ Generated rjui_tools/lib/converters/codeblock_converter.rb
✓ Generated sjui_tools/lib/converters/codeblock_converter.rb
✓ Generated kjui_tools/lib/converters/codeblock_converter.rb
```

各ファイルの初期内容を本文で示す（Ruby コード、3 プラットフォーム分）。

#### Step 3: Web converter を実装

`rjui_tools/lib/converters/codeblock_converter.rb`:

```ruby
module RjuiTools
  module Converters
    class CodeblockConverter < BaseConverter
      def self.component_type
        "CodeBlock"
      end

      def convert(node, context)
        language = node["language"] || "text"
        code = node["code"] || ""
        show_copy = node.fetch("showCopyButton", true)
        show_lines = node.fetch("showLineNumbers", false)
        theme = node["theme"] || "github-light"

        <<~TSX
          <CodeBlock
            language={#{ts_value(language)}}
            code={#{ts_value(code)}}
            showCopyButton={#{show_copy}}
            showLineNumbers={#{show_lines}}
            theme={#{ts_value(theme)}}
            onCopy={#{event_handler(node, "onCopy")}}
          />
        TSX
      end
    end
  end
end
```

React コンポーネント側 (`jsonui-doc-web/src/components/CodeBlock.tsx`):

```tsx
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

type Props = {
  language: string;
  code: string;
  showCopyButton?: boolean;
  showLineNumbers?: boolean;
  theme?: "github-light" | "github-dark";
  onCopy?: (text: string) => void;
};

export function CodeBlock({ language, code, showCopyButton = true, showLineNumbers = false, theme = "github-light", onCopy }: Props) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    onCopy?.(code);
  };

  return (
    <div className="relative">
      <SyntaxHighlighter
        language={language}
        style={theme === "github-dark" ? oneDark : oneLight}
        showLineNumbers={showLineNumbers}
      >
        {code}
      </SyntaxHighlighter>
      {showCopyButton && (
        <button onClick={handleCopy} className="absolute top-2 right-2">Copy</button>
      )}
    </div>
  );
}
```

#### Step 4: iOS converter を実装

`sjui_tools/lib/converters/codeblock_converter.rb`:

```ruby
module SjuiTools
  module Converters
    class CodeblockConverter < BaseConverter
      def self.component_type
        "CodeBlock"
      end

      def convert(node, context)
        language = node["language"] || "text"
        code = node["code"] || ""
        show_copy = node.fetch("showCopyButton", true)

        <<~SWIFT
          CodeBlockView(
            language: #{swift_string(language)},
            code: #{swift_string(code)},
            showCopyButton: #{show_copy}
          )
        SWIFT
      end
    end
  end
end
```

SwiftUI コンポーネント (`jsonui-doc-ios/Sources/Components/CodeBlockView.swift`):

```swift
import SwiftUI
import Splash

struct CodeBlockView: View {
  let language: String
  let code: String
  let showCopyButton: Bool

  @State private var copied = false

  var body: some View {
    ZStack(alignment: .topTrailing) {
      ScrollView(.horizontal) {
        Text(highlight(code: code, language: language))
          .font(.system(.body, design: .monospaced))
          .padding()
      }
      .background(Color(.systemGray6))
      .cornerRadius(8)

      if showCopyButton {
        Button(action: copyToClipboard) {
          Image(systemName: copied ? "checkmark" : "doc.on.doc")
        }
        .padding(8)
      }
    }
  }

  private func copyToClipboard() {
    UIPasteboard.general.string = code
    copied = true
    DispatchQueue.main.asyncAfter(deadline: .now() + 2) { copied = false }
  }

  private func highlight(code: String, language: String) -> AttributedString {
    // Splash / SwiftSyntaxHighlighter で highlight
    // ...
  }
}
```

#### Step 5: Android converter を実装

`kjui_tools/lib/converters/codeblock_converter.rb`:

```ruby
module KjuiTools
  module Converters
    class CodeblockConverter < BaseConverter
      def self.component_type
        "CodeBlock"
      end

      def convert(node, context)
        # ... Compose 実装
        <<~KT
          CodeBlockView(
            language = #{kotlin_string(node["language"])},
            code = #{kotlin_string(node["code"])},
            showCopyButton = #{node.fetch("showCopyButton", true)}
          )
        KT
      end
    end
  end
end
```

Compose コンポーネント (`jsonui-doc-android/src/main/java/.../CodeBlockView.kt`):

```kotlin
@Composable
fun CodeBlockView(
  language: String,
  code: String,
  showCopyButton: Boolean = true
) {
  val clipboard = LocalClipboardManager.current
  var copied by remember { mutableStateOf(false) }

  Box(modifier = Modifier.background(MaterialTheme.colorScheme.surfaceVariant).padding(12.dp)) {
    Text(
      text = highlightedCode(code, language),
      fontFamily = FontFamily.Monospace,
      modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())
    )
    if (showCopyButton) {
      IconButton(onClick = {
        clipboard.setText(AnnotatedString(code))
        copied = true
      }, modifier = Modifier.align(Alignment.TopEnd)) {
        Icon(if (copied) Icons.Default.Check else Icons.Default.ContentCopy, "Copy")
      }
    }
  }
}
```

#### Step 6: `attribute_definitions` に追加

`jsonui-cli/shared/core/attribute_definitions.json` に `CodeBlock` エントリを追加（`jui sync-tool` で反映）。

（プロジェクト側では編集しない、upstream 報告が必要なので本文では「`jsonui-cli` に PR を出す」と明記）

#### Step 7: Layout で使う

```json
{
  "type": "CodeBlock",
  "language": "json",
  "code": "{\n  \"type\": \"Label\",\n  \"text\": \"Hello\"\n}",
  "showCopyButton": true,
  "onCopy": "@{onCodeCopied}"
}
```

#### Step 8: `jui build` / `jui verify` でテスト

### 2.5 具体例 B: SearchModal コンポーネント

同じ 8 ステップを簡略化して示す。SearchModal の要件:
- 全画面モーダル
- インクリメンタル検索
- 候補リスト描画
- キーボードイベント（↑/↓ で移動、Enter で確定）

プラットフォーム別ポイント:
- iOS: UIKit の `UISearchController`、SwiftUI の `searchable`
- Android: Compose の `SearchBar`
- Web: `<dialog>` + Combobox ARIA パターン

### 2.6 Cell（Collection 内の繰り返し単位）との違い

| 観点 | Cell | Custom Component |
|---|---|---|
| スコープ | Collection 内のみ | 任意の場所で使える |
| データ | `@{item.*}` で Collection が渡す | props を直接受け取る |
| 生成方法 | Layout JSON ファイル | component spec + converter |
| 用途 | リスト行・カード | 再利用可能ウィジェット |

Cell は Layout JSON として書くだけで、converter は不要。

### 2.7 既存のコンポーネントを拡張する vs. 新規作成

既存拡張（例: Label に `gradientText` 機能追加）:
- `attribute_definitions.json` に属性を追加（upstream 報告）
- 既存 converter に分岐追加

新規作成:
- 新しい `*.component.json` を書く
- converter を 3 プラットフォーム分生成

判断基準:
- 既存コンポーネントの責務を超えるなら新規
- 既存コンポーネントの見た目・振る舞いのバリエーションなら属性拡張

### 2.8 命名規則

- Component spec: `kebab-case.component.json`
- `metadata.name`: `PascalCase`（Layout JSON の `type` と一致）
- 属性名: `camelCase`
- イベント名: `on<Event>` 形式（`onCopy`, `onSelect`）

### 2.9 テスト

custom component の screen test はその component を使う画面のテストに含める。converter 自体の単体テストは各プラットフォームの標準テストフレームワーク（RSpec / XCTest / JUnit）で書く。

### 2.10 よくある誤り

- component spec を書かずにコード先行 → 3 プラットフォームで API がズレる
- upstream への `attribute_definitions.json` PR 前に本番投入 → `jui sync-tool` で上書きされる
- 属性名の camelCase / snake_case 混在
- converter に platform-specific ロジックを書き込み過ぎ → spec で吸収すべき差分が converter に染み出す

---

## 3. 必要な strings キー

prefix: `guide_custom_*`

- `_intro_*`
- `_when_*`, `_spec_first_*`
- `_example_a_step_{1..8}_*`, `_example_b_*`
- `_cell_vs_component_*`, `_extend_vs_new_*`, `_naming_*`
- `_testing_*`, `_pitfalls_*`

概算 80 キー × 2 言語。

---

## 4. クロスリンク追加先

- `/reference/json-schema` Component Spec 節 → 本ガイド
- `/guides/writing-your-first-spec` 末尾「応用」→ 本ガイド
- `/tools/cli/jui/generate-converter`（plan 37）→ 本ガイド

---

## 5. 実装チェックリスト

- [ ] spec metadata 更新
- [ ] strings キー追加
- [ ] 8 ステップ × CodeBlock（Ruby converter × 3 + Native code × 3 + spec/Layout）
- [ ] クロスリンク追加
- [ ] `jui build` / `jui verify` / `jsonui-localize`

---

## 6. セッション分割の推奨境界

- **分割 A**: 具体例 A (CodeBlock) Step 1-5（4 時間）
- **分割 B**: 具体例 A Step 6-8 + 具体例 B + 末尾節（3 時間）
