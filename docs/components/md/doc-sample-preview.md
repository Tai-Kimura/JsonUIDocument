# Doc sample preview

**Category:** display

Embedded preview of a generated jsonui-doc HTML artifact. Renders a hand-pasted static HTML snapshot of docs/screens/json/learn/hello-world.spec.json inside a sandboxed iframe so visitors to /tools/doc can see what the CLI actually produces without leaving the page. Zero props: the HTML payload is a string constant baked into the web extension file at author time, deliberately avoiding a build-time dependency on the Python CLI from the Next.js bundle.

## Structure

### Components

| Type | ID | Description |
|------|----|--------------|
| `View` | `doc_sample_preview_root` | Root wrapper that hosts the sandboxed iframe and applies the max-height / scroll styling. |

## Usage

### Example

```json
{'layoutSnippet': {'type': 'DocSamplePreview'}, 'description': 'Zero-attribute usage inside a Layout JSON. Exactly one consumer is expected in v1: docs/screens/layouts/tools/doc.json, inside the sample-preview tab panel.'}
```

### Used In Screens

- /tools/doc

