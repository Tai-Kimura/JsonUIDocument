---
title: "Phase 06 — Mount the generated Chrome from RootLayout"
status: open
depends_on: [05]
enables: [07, 12]
owner: web
---

# Phase 06 — RootLayout integration

## Why

Phase 05 produces a generated `Chrome.tsx` plus a `ChromeWrapper.tsx` client wrapper. Phase 06 is the thin bridge from the Next.js App Router to that wrapper: RootLayout mounts the wrapper, reserves CSS space for it, and otherwise stays out of the way.

## In scope

1. Rewrite `jsonui-doc-web/src/app/layout.tsx` to render `<ChromeWrapper />` alongside `{children}` inside `<html><body>`.
2. Add the CSS that reserves space for the top bar (top padding) and sidebar (left padding on `main`), and that handles the <1024px responsive fallback (sidebar behind a mobile drawer).
3. Re-verify all 34 static routes still render with the chrome back in place.

## Out of scope

- Anything under `docs/screens/**` or `src/viewmodels/**`.
- Phase-07-onward page-level cleanup.

## Work items

### 1. RootLayout

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { ChromeWrapper } from "@/components/chrome/ChromeWrapper";

export const metadata: Metadata = {
  title: "JsonUI — Declarative cross-platform UI",
  description: "Author screens once in JSON. JsonUI generates SwiftUI, Compose, and React with ViewModels, bindings, and localization built in.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ChromeWrapper />
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
```

RootLayout stays a Server Component. `ChromeWrapper` is the Client Component (from Phase 05) that owns the ViewModel lifecycle and includes the generated Chrome tree.

### 2. CSS (in `globals.css`)

Reserve space for the fixed chrome:

```css
:root {
  --chrome-topbar-h: 56px;
  --chrome-sidebar-w: 272px;
}

/* Topbar sits at the viewport top, above everything. */
.site-topbar {   /* applied by the generated Chrome's TopBar */
  position: fixed;
  inset: 0 0 auto 0;
  height: var(--chrome-topbar-h);
  z-index: 40;
}

/* Sidebar sits at the viewport left, below the topbar. */
.site-sidebar {   /* applied by the generated Chrome's Sidebar */
  position: fixed;
  top: var(--chrome-topbar-h);
  left: 0;
  bottom: 0;
  width: var(--chrome-sidebar-w);
  z-index: 30;
  overflow-y: auto;
}

/* Page content reserves space for both. */
.site-main {
  padding-top: var(--chrome-topbar-h);
  padding-left: var(--chrome-sidebar-w);
  min-height: 100vh;
}

/* <1024px: sidebar hides, mobile drawer pattern takes over. */
@media (max-width: 1023px) {
  .site-sidebar {
    transform: translateX(-100%);
    transition: transform 200ms ease;
  }
  .site-sidebar[data-mobile-open="true"] {
    transform: translateX(0);
  }
  .site-main { padding-left: 0; }
}
```

Class names (`.site-topbar`, `.site-sidebar`, `.site-main`) are the contract between RootLayout and the generated Chrome. Phase 03/04's React impls must apply `className="site-topbar"` / `"site-sidebar"` to their root elements. Phase 05's Chrome layout has no root class of its own — Chrome renders its two children into the DOM and CSS positions them.

### 3. Responsive fallback

The mobile-drawer `data-mobile-open` attribute is driven by the ChromeViewModel's `mobileOpen` state, reflected onto the Sidebar's root `<aside>`. The Sidebar React impl should do:

```tsx
<aside className="site-sidebar" data-mobile-open={data.mobileOpen ? "true" : "false"}>
```

### 4. Escape-to-close + backdrop

Below 1024px, tapping outside the sidebar should close the drawer. The ChromeWrapper can attach a document-level keydown listener for Escape and render a semi-transparent backdrop `<div className="site-sidebar-backdrop" data-open={mobileOpen}>` beside the sidebar — CSS handles the rest.

## Gates

Run from `jsonui-doc-web/`:
- `npx tsc --noEmit` → 0 errors
- `npm run build` → all 34 static routes render
- Visual smoke: `/`, `/learn/installation`, `/concepts/why-spec-first`, `/_not-found` all show the new chrome. Active-route highlight works. Language toggle flips labels in both the chrome and the page body.
- Resize to 900px width: sidebar is hidden, hamburger button in the top bar opens the drawer; Escape closes it; backdrop tap closes it.

## Open questions

None. CSS structure is conventional; ViewModel-side concerns are covered in Phase 05.
