---
title: "Phase 01 — Roll back the hand-written chrome"
status: open
depends_on: []
enables: [02, 06]
owner: web
---

# Phase 01 — Roll back the hand-written chrome

## Why

A previous `/frontend-design` run landed the site chrome as hand-written React under `jsonui-doc-web/src/components/chrome/**`. That bypasses the JsonUI spec → converter → generated-TSX pipeline, which defeats the dogfood principle of this site. Before we rebuild the chrome the right way, the wrong chrome has to come out.

## In scope

- Delete the entire `jsonui-doc-web/src/components/chrome/` directory.
- Restore `jsonui-doc-web/src/app/layout.tsx` to a minimal passthrough RootLayout that just renders `{children}` inside `<html><body>`. No floating brand, no floating Search — the site is temporarily naked until Phase 06 mounts the new chrome.
- Keep design tokens (CSS variables) in `jsonui-doc-web/src/app/globals.css`. The new spec-driven chrome will consume them; deleting them would mean re-doing color / spacing decisions for no reason.

## Out of scope (belongs to other plans)

- Authoring icon SVGs → Phase 02.
- Sidebar / TopBar / Chrome spec work → Phases 03–05.
- Wiring the generated Chrome back into RootLayout → Phase 06.
- Any change under `docs/screens/**` or `src/viewmodels/**`.

## Work items

1. **Delete**: `jsonui-doc-web/src/components/chrome/` (entire directory, recursively).
   - Files currently there: `ChromeShell.tsx`, `Sidebar.tsx`, `TopBar.tsx`, `navCatalog.ts`, `strings.ts`, `icons/index.tsx`.

2. **Rewrite** `jsonui-doc-web/src/app/layout.tsx` to:
   ```tsx
   import type { Metadata } from "next";
   import "./globals.css";

   export const metadata: Metadata = {
     title: "JsonUI — Declarative cross-platform UI",
     description: "Author screens once in JSON. JsonUI generates SwiftUI, Compose, and React with ViewModels, bindings, and localization built in.",
   };

   export default function RootLayout({
     children,
   }: Readonly<{ children: React.ReactNode }>) {
     return (
       <html lang="en">
         <body>{children}</body>
       </html>
     );
   }
   ```

3. **Audit** `globals.css` and keep only the CSS variables / design tokens. Delete any chrome-shell-specific rules (`.chrome-shell`, `.chrome-sidebar`, `.chrome-topbar`, `.chrome-main`, mobile drawer rules, scroll-lock rules) — those are chrome UI that will come back in Phase 06 with different class names once the Chrome screen is generated.

4. **Search + CodeBlock + TableOfContents components** under `src/components/extensions/` — **leave alone**. They are already spec-driven (have specs in `docs/components/json/`, converters in `rjui_tools/lib/react/converters/extensions/`, React impls here). They're fine.

## Acceptance

Run from `jsonui-doc-web/`:
- `npx tsc --noEmit` → 0 errors
- `npm run build` → all 34 static routes still render (they just have no chrome around them)
- `jui build` in the repo root → zero warnings, no drift
- `jui verify --fail-on-diff` → clean

Visually, visiting the site after this phase will show each page with no header, no sidebar, no search trigger — just raw content. That's expected; Phase 06 brings the chrome back.

## Open questions

None. Pure deletion + minimal RootLayout rewrite.
