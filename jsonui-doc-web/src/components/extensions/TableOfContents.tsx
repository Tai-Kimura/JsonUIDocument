// TableOfContents.tsx
// Web converter for the TableOfContents component spec.
// Spec: docs/components/json/tableofcontents.component.json
//
// This file is NOT marked @generated — the scaffold from `jui g converter` is
// expected to be filled in here. Only the attribute CONTRACT (which props
// exist, what types) is governed by the spec; rendering behavior lives here.
//
// Active-anchor resolution strategy:
//   - If the consumer passes `activeAnchor`, we use it as the authoritative
//     highlight target. Useful when the router / scroll integration wants to
//     drive the TOC from outside.
//   - Otherwise we run an IntersectionObserver over the DOM elements whose
//     `id` matches each `items[i].anchor`. The latest element to enter the
//     viewport (top-ish intersection) becomes the active one. Observer is
//     reset whenever `items` changes. No observer is created during SSR.
//
// Click behavior:
//   1. `onSelect?.(anchor)` if the consumer wired a handler.
//   2. `scrollIntoView` on the target element with an offset equal to
//      `stickyOffset` so the heading lands just below the site header.
//   3. Update the URL hash via `history.replaceState` (no extra push, so Back
//      still works as expected).
//
// Kept out of v1 (tracked in the component spec's `notes`): auto-scan from DOM
// headings, collapsible levels, reading-position progress bar.

"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { StringManager } from "@/generated/StringManager";

export interface TocItem {
  /** Stable id for React key & observer key. Typically equals `anchor`. */
  id: string;
  /** User-visible label. Caller is responsible for localization. */
  label: string;
  /** DOM fragment id to scroll to — WITHOUT the leading `#`. */
  anchor: string;
  /** 1 (top-level section) or 2 (subsection). Default: 1. */
  level?: number;
}

export interface TableOfContentsProps {
  /** Ordered list of TocItem entries. Required. */
  items: TocItem[];
  /** Optional heading above the list. */
  title?: string;
  /** Sticky to viewport. Default: true. */
  sticky?: boolean;
  /** Pixel offset from viewport top when sticky. Default: 80. */
  stickyOffset?: number;
  /** Externally-controlled active anchor. When unset, observer picks one. */
  activeAnchor?: string;
  /** Max TocItem.level to render. Items with level > maxDepth are filtered. */
  maxDepth?: number;
  /** Optional: invoked with `anchor` BEFORE the default scroll happens. */
  onSelect?: (anchor: string) => void;
  /** Pass-through from the rjui layout. */
  className?: string;
}

const DEFAULT_STICKY_OFFSET = 80;
const DEFAULT_MAX_DEPTH = 2;

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  items,
  title,
  sticky = true,
  stickyOffset = DEFAULT_STICKY_OFFSET,
  activeAnchor,
  maxDepth = DEFAULT_MAX_DEPTH,
  onSelect,
  className,
}) => {
  const visibleItems = useMemo(
    () => items.filter((item) => (item.level ?? 1) <= maxDepth),
    [items, maxDepth],
  );

  const [observedActive, setObservedActive] = useState<string | undefined>();
  const itemsRef = useRef(visibleItems);
  itemsRef.current = visibleItems;

  // IntersectionObserver — only runs when the consumer hasn't pinned
  // `activeAnchor`. Keeps the last-in-view anchor as the active one.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (activeAnchor !== undefined) return;
    if (visibleItems.length === 0) return;

    const targets = visibleItems
      .map((item) => document.getElementById(item.anchor))
      .filter((el): el is HTMLElement => el !== null);

    if (targets.length === 0) return;

    // Top-ish rootMargin keeps the "active" section as the one the reader is
    // actually looking at, not the one that just scrolled into the bottom.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.target.getBoundingClientRect().top -
              b.target.getBoundingClientRect().top,
          );
        if (visible.length > 0) {
          setObservedActive(visible[0].target.id);
        }
      },
      {
        rootMargin: `-${stickyOffset}px 0px -60% 0px`,
        threshold: 0,
      },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [visibleItems, activeAnchor, stickyOffset]);

  const active = activeAnchor ?? observedActive;

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, anchor: string) => {
      event.preventDefault();
      onSelect?.(anchor);

      const target = document.getElementById(anchor);
      if (!target) return;

      const top =
        target.getBoundingClientRect().top + window.scrollY - stickyOffset;
      window.scrollTo({ top, behavior: "smooth" });

      // Non-pushing hash update so the user's back button isn't flooded.
      history.replaceState(null, "", `#${anchor}`);
    },
    [onSelect, stickyOffset],
  );

  if (visibleItems.length === 0) return null;

  const stickyClasses = sticky
    ? "lg:sticky lg:self-start"
    : "";
  const stickyStyle = sticky ? { top: `${stickyOffset}px` } : undefined;

  return (
    <nav
      aria-label={title ?? StringManager.getString("search_toc_aria_label")}
      className={[
        "w-full max-w-[260px] py-2",
        stickyClasses,
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={stickyStyle}
    >
      {title && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
          {title}
        </p>
      )}
      <ul className="flex flex-col gap-1 border-l border-[#E5E7EB]">
        {visibleItems.map((item) => {
          const level = item.level ?? 1;
          const isActive = active === item.anchor;
          return (
            <li key={item.id}>
              <a
                href={`#${item.anchor}`}
                onClick={(event) => handleClick(event, item.anchor)}
                className={[
                  "block border-l-2 py-1 pr-2 text-[13px] leading-snug transition-colors",
                  level === 2 ? "pl-8" : "pl-4",
                  isActive
                    ? "border-[#2563EB] text-[#0B1220] font-semibold"
                    : "border-transparent text-[#475467] hover:text-[#0B1220] hover:border-[#CBD5F5]",
                ].join(" ")}
                aria-current={isActive ? "true" : undefined}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default TableOfContents;
