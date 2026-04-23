---
title: "Phase 10 — Move TableOfContents to a sticky right rail"
status: open
depends_on: [09]
enables: [11]
owner: jsonui-define + jsonui-implement
---

# Phase 10 — TOC to right rail

## Why

On PC docs, the on-page TOC belongs on the right (Stripe / Vercel / Linear all do this). Currently every page that authors a `TableOfContents` renders it **inline in the content column** — it scrolls away with the body. The TOC should be `position: sticky` in a dedicated right rail so it stays visible as the reader scrolls.

## In scope

Pages that author a `TableOfContents` today (identified by grep over `docs/screens/layouts/**`):

- `learn/installation.json`, `learn/data-binding-basics.json`, `learn/first-screen.json`, `learn/what-is-jsonui.json`
- `guides/custom-components.json`, `guides/localization.json`, `guides/navigation.json`, `guides/testing.json`, `guides/writing-your-first-spec.json`
- `concepts/data-binding.json`, `concepts/hot-reload.json`, `concepts/one-layout-json.json`, `concepts/viewmodel-owned-state.json`, `concepts/why-spec-first.json`
- `platforms/kotlin.json`, `platforms/rjui.json`, `platforms/swift.json`
- `reference/attributes.json`, `reference/cli-commands.json`, `reference/components.json`, `reference/json-schema.json`, `reference/mcp-tools.json`
- `tools/agents.json`, `tools/cli.json`, `tools/helper.json`, `tools/mcp.json`, `tools/test-runner.json`

(Pages with empty `sections: []` like `learn/hello-world.json` don't author a TOC — they stay single-column.)

## Out of scope

- Anything not touching a TOC.
- Extending the `TableOfContents` component with new props — the existing `sticky: true` support (already in the React impl) is enough.

## Target pattern

### Before (example: `learn/installation.json:107–145`)

```
  (inside the Scroll's content column)
  [learn_installation_toc_wrap (View, full width)]
    TableOfContents ... sticky: false ...
  (body sections follow)
```

### After

```
  [content_with_rail (View, horizontal, 2 cols)]
    [column_body (View, vertical, width: weight 1)]
      (all body sections)
    [column_rail (View, vertical, width: 240)]
      TableOfContents ... sticky: true ... stickyOffset: 80 ...
```

`stickyOffset: 80` accounts for the 56px top bar + ~24px breathing room.

## Changes per page

1. Wrap the existing body content (everything between the header and the footer) in a horizontal 2-column `View`.
2. Move the `TableOfContents` block out of the body column and into the right rail column (width 240, vertical View).
3. Flip the TOC's `sticky` attribute from `false` to `true`.
4. Max-width cap: the body column gets a `maxWidth: 720`. The whole `content_with_rail` wrapper can cap at `1024` so the rail + body + sidebar read coherently on ultrawide displays.

Keep the existing `TableOfContents` props (`items`, `title`, `maxDepth`, `onSelect`) unchanged.

## Execution hint

Mechanical pattern, same as Phase 09. Script a Python helper:
1. Parse the layout JSON.
2. Find the `TableOfContents` block and its wrapping View.
3. Find the sibling that contains the body sections (usually starts right after the header and ends before the footer).
4. Wrap both into a new horizontal `View`; flip `sticky: true`.

Test the transform on `learn/installation.json` first (the largest layout, good smoke test). Run `jui build` + `npm run build`; visually confirm the TOC stays pinned as the body scrolls.

## Acceptance

- `jui build` zero warnings, no drift.
- `jui verify --fail-on-diff` clean.
- `npx tsc --noEmit` 0 errors.
- Visual smoke on 3 pages across 3 categories (installation / why-spec-first / mcp-tools): body scrolls, TOC stays visible, active-section highlight responds as the reader scrolls.
- Pages without a TOC (hello-world / what-is-jsonui / etc.) render unchanged.

## Open questions

- Ultra-narrow viewports (<1024px): the right rail should collapse to either (a) hidden, or (b) a summary "On this page" button at the top. Proposal: (a) for v1 — CSS `display: none` under 1024px. Re-open if user feedback asks for (b).
