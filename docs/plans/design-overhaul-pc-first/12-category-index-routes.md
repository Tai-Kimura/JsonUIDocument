---
title: "Phase 12 — Category-index routes (`/learn`, `/guides`, …)"
status: open
depends_on: [06, 11]
enables: []
owner: web
---

# Phase 12 — Category-index routes

## Why

The `*_index.json` layouts already exist (`docs/screens/layouts/learn_index.json` and 5 peers). Home's old TabView was the only way to reach them. With the TabView removed and the sidebar owning navigation, the category indexes need their own URLs: `/learn`, `/guides`, `/concepts`, `/reference`, `/platforms`, `/tools`.

Additionally, Phase 09's breadcrumb on every content page wants the first segment to be clickable. That only works once these routes exist.

## In scope

Six new Next.js App Router pages under `jsonui-doc-web/src/app/`:

- `src/app/learn/page.tsx`
- `src/app/guides/page.tsx`
- `src/app/concepts/page.tsx`
- `src/app/reference/page.tsx`
- `src/app/platforms/page.tsx`
- `src/app/tools/page.tsx`

Each thin-wrapper page dynamic-imports the existing generated index component (`LearnIndex.tsx`, `GuidesIndex.tsx`, …) and the corresponding ViewModel, mirroring the pattern used by home and leaf pages.

## Out of scope

- Changing what the index layouts render — `learn_index.json` etc. already have a hero + collection of leaf pages.
- Any chrome changes (sidebar already has direct links to every leaf; Phase 12 just adds category-level landing pages).

## Work items

1. For each category, create a page file:
   ```tsx
   // src/app/learn/page.tsx
   "use client";
   import dynamic from "next/dynamic";
   const LearnIndex = dynamic(
     () => import("@/generated/components/LearnIndex").then(m => m.LearnIndex),
     { ssr: false },
   );
   export default function Page() { return <LearnIndex />; }
   ```

   (Adjust the exact import path / ViewModel wiring to match the conventions already in `src/app/learn/installation/page.tsx`.)

2. Update `scripts/build-search-index.ts` to include the 6 new URLs in `search-index.json` (the sidebar + global Search both pull from this index).

3. Update `scripts/gen-per-page-metadata.ts` to emit a `layout.tsx` for each new route with the appropriate title / description.

4. Update `scripts/gen-smoke-tests.ts` to register the 6 new routes (or confirm it auto-includes them from `search-index.json`).

5. Visit the 6 new routes locally and confirm they render the existing category catalog without a 404.

## Sidebar updates

The `NAV_CATALOG` in `ChromeViewModel` (Phase 05) currently points each section header at either "first leaf in the category" or nothing. After Phase 12, section headers can navigate to the category index URL instead:

- Change the sidebar component spec (Phase 03) to add an optional `url` to each `SidebarSection` — tapping the section header navigates to `/learn` while the chevron still toggles the entries.
- Update `ChromeViewModel.buildNavItems()` to set `section.url = "/learn"` etc.
- Update the Sidebar React impl so the section header becomes a `<Link>` with a sibling chevron-toggle `<button>` (two affordances, one row).

## Breadcrumb upgrade (Phase 09 follow-up)

After Phase 12, revisit Phase 09's breadcrumb implementation: the first segment ("Learn", "Guides", …) becomes a `<Link>` to the new category URL. This is a small mechanical sweep of 28 layouts — script it.

## Acceptance

- `npm run build` produces 40 static routes (34 old + 6 new).
- Visiting `/learn`, `/guides`, `/concepts`, `/reference`, `/platforms`, `/tools` renders the respective index page, no 404.
- `sitemap.xml` includes all 6 new URLs.
- Sidebar section headers navigate (clicking `Learn` goes to `/learn`; clicking the chevron only toggles).
- Breadcrumbs on leaf pages link to the corresponding category URL.

## Open questions

- Should the category index pages get their own distinct metadata (title / description) or reuse the existing `learn_index` strings? Proposal: each category page's `<title>` is "Learn — JsonUI" etc., description is the same copy as `nav_<cat>_blurb` added in Phase 11.
