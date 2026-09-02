# Code block

**Category:** display

Syntax-highlighted fenced code block with optional filename caption, line numbers, line highlighting, copy-to-clipboard button, and scrollable max-height region. Web converter highlights via Shiki at SSG time; iOS/Android may render plain monospace or ship a lighter highlighter later.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `code` | `String` | Yes | `-` | Raw source code to render. Rendered verbatim; no interpolation is performed. Multi-line strings are permitted and expected. |
| `language` | `String` | Yes | `-` | Syntax highlighting language identifier (Shiki grammar id). Common values: 'json', 'jsonc', 'tsx', 'ts', 'js', 'swift', 'kotlin', 'bash', 'html', 'css'. Required for deterministic highlighting; pass 'text' to disable. |
| `filename` | `String?` | Yes | `-` | Optional caption rendered above the block (e.g. 'src/app/page.tsx'). When omitted, no caption is shown. |
| `showLineNumbers` | `Bool` | Yes | `-` | Render a left-side line-number gutter. Defaults to false. |
| `startLine` | `Int?` | Yes | `-` | First line number when showLineNumbers is true. Defaults to 1. Useful when showing an excerpt from the middle of a larger file. |
| `highlightLines` | `[Int]?` | Yes | `-` | One-indexed line numbers to visually emphasize (e.g. added/changed lines). Indexing is relative to the code prop itself, not to startLine. |
| `wrapLines` | `Bool` | Yes | `-` | Soft-wrap long lines instead of horizontal scrolling. Defaults to false (long lines overflow horizontally with the copy button still pinned). |
| `copyable` | `Bool` | Yes | `-` | Render a copy-to-clipboard button in the top-right corner. Copy handling itself is built into the Web converter; this prop only toggles the button's visibility. Defaults to true. |
| `maxHeight` | `Int?` | Yes | `-` | Maximum rendered height in pixels; when set, the code region becomes vertically scrollable once content exceeds this height. Omit for unbounded height. |
| `theme` | `String?` | Yes | `-` | Optional per-instance Shiki theme override (e.g. 'github-light', 'github-dark', 'nord'). Defaults to the project-wide theme pair configured by the converter. |

## Structure

### Components

| Type | ID | Description |
|------|----|--------------|
| `View` | `code_block_root` | Root container of the code block (caption + code region + copy button) |

## State Management

### Internal States

| Name | Type | Initial Value | Description |
|------|------|---------------|-------------|
| `copied` | `Bool` | `-` | True for a short window after the user clicks the copy button; drives the 'Copied!' affordance. Implementation detail of the converter; not part of the public props contract. |

### Exposed Events

| Name | Parameters | Description |
|------|------------|-------------|
| `onCopy` | `-` | Fired after the copy-to-clipboard action succeeds. Payload is the exact string that was placed on the clipboard. Intended for analytics; copying itself is built into the converter and does not depend on this handler being wired up. |

## Usage

### Example

```json
{'layoutSnippet': {'type': 'CodeBlock', 'language': 'bash', 'code': 'jui init', 'filename': 'shell', 'showLineNumbers': False, 'copyable': True}, 'description': 'Minimal CodeBlock usage inside a Layout JSON. See docs/plans/17-spec-templates.md §T4 for a fuller CLI-page context.'}
```

