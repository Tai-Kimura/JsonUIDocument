// Search.tsx
// Web implementation of the Search component spec.
// Spec: docs/components/json/search.component.json
//
// Self-contained site-wide search. Renders:
//   - Inline trigger: a compact button with magnifier + placeholder + optional shortcut pill.
//   - Portaled modal: opens on click OR shortcut. Loads /search-index.json on first open,
//     pipes it through FlexSearch, displays ranked results, navigates on pick.
//
// State lives on the component itself; no parent wiring required. Multiple Search instances
// on a page would each install their own keyboard-shortcut listener — fine for v1 since no
// current layout places more than one.

"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import FlexSearch from "flexsearch";

import { StringManager } from "@/generated/StringManager";

interface SearchEntry {
  url: string;
  namespace: string;
  title: { en: string; ja: string };
  lead?: { en: string; ja: string };
  readTime?: { en: string; ja: string };
  sections: Array<{ anchor: string; heading: { en: string; ja: string } }>;
}

interface SearchIndex {
  version: number;
  entries: SearchEntry[];
}

export interface SearchProps {
  placeholder?: string;
  shortcut?: string;
  maxResults?: number;
  indexUrl?: string;
  onOpen?: () => void;
  onResult?: (url: string) => void;
  className?: string;
}

const DEFAULT_PLACEHOLDER = "Search";
const DEFAULT_SHORTCUT = "cmd+k";
const DEFAULT_MAX_RESULTS = 12;
const DEFAULT_INDEX_URL = "/search-index.json";

// Curated set shown before the user has typed anything. Order matters —
// it's the vertical order in the modal. Kept short so the empty state
// stays scannable; any URL here must exist in search-index.json or it
// is silently skipped.
const POPULAR_URLS: string[] = [
  "/learn/installation",
  "/learn/hello-world",
  "/concepts/why-spec-first",
  "/tools/mcp",
  "/reference/components",
];

/**
 * Parse a shortcut spec ('cmd+k', 'ctrl+k', 'slash', any single key) into
 * a predicate suitable for a `keydown` handler. Returns null when the
 * shortcut is empty (disabled).
 */
function buildShortcutMatcher(
  shortcut: string,
): ((ev: KeyboardEvent) => boolean) | null {
  if (!shortcut) return null;

  const lower = shortcut.toLowerCase().trim();
  if (lower === "slash") {
    return (ev) => ev.key === "/" && !ev.metaKey && !ev.ctrlKey && !ev.altKey;
  }

  const parts = lower.split("+").map((p) => p.trim());
  const needsCmd = parts.includes("cmd");
  const needsCtrl = parts.includes("ctrl");
  const needsShift = parts.includes("shift");
  const needsAlt = parts.includes("alt");
  const key = parts[parts.length - 1];

  return (ev) => {
    // cmd+k means ⌘+K on macOS, Ctrl+K elsewhere.
    const isMac =
      typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/.test(navigator.platform);
    const primaryActive = isMac ? ev.metaKey : ev.ctrlKey;

    if (needsCmd && !primaryActive) return false;
    if (needsCtrl && !ev.ctrlKey) return false;
    if (needsShift !== ev.shiftKey) return false;
    if (needsAlt !== ev.altKey) return false;
    if (ev.key.toLowerCase() !== key) return false;
    return true;
  };
}

function formatShortcut(shortcut: string): string {
  if (!shortcut) return "";
  const isMac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/.test(navigator.platform);
  const lower = shortcut.toLowerCase().trim();
  if (lower === "slash") return "/";
  return lower
    .split("+")
    .map((p) => p.trim())
    .map((p) => {
      if (p === "cmd") return isMac ? "⌘" : "Ctrl";
      if (p === "ctrl") return "Ctrl";
      if (p === "shift") return "⇧";
      if (p === "alt") return isMac ? "⌥" : "Alt";
      return p.toUpperCase();
    })
    .join(isMac ? "" : "+");
}

export const Search: React.FC<SearchProps> = ({
  placeholder,
  shortcut = DEFAULT_SHORTCUT,
  maxResults = DEFAULT_MAX_RESULTS,
  indexUrl = DEFAULT_INDEX_URL,
  onOpen,
  onResult,
  className,
}) => {
  // When the caller doesn't pass a placeholder (e.g. RootLayout's site-wide
  // Search), fall back to the localized home_search_placeholder so the
  // global chrome follows the language toggle. An explicit empty string or
  // any other value from the caller is honored verbatim.
  const resolvedPlaceholder =
    placeholder ?? StringManager.getString("home_search_placeholder") ?? DEFAULT_PLACEHOLDER;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const locale = StringManager.language === "ja" ? "ja" : "en";

  // FlexSearch index (rebuilt when the loaded catalog or locale changes).
  const flex = useMemo(() => {
    if (!index) return null;
    const doc = new FlexSearch.Document({
      document: {
        id: "id",
        index: ["title", "lead", "sections"],
      },
      tokenize: "forward",
    });
    index.entries.forEach((entry, i) => {
      doc.add({
        id: i,
        title: entry.title[locale],
        lead: entry.lead?.[locale] ?? "",
        sections: entry.sections.map((s) => s.heading[locale]).join(" "),
      });
    });
    return doc;
  }, [index, locale]);

  // Keyboard shortcut.
  useEffect(() => {
    const matcher = buildShortcutMatcher(shortcut);
    if (!matcher) return;
    const handler = (ev: KeyboardEvent) => {
      if (ev.target instanceof HTMLElement) {
        const tag = ev.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || ev.target.isContentEditable) {
          if (!open) return; // don't steal shortcut while the user is typing elsewhere
        }
      }
      if (matcher(ev)) {
        ev.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [shortcut, open]);

  // Escape / arrow nav / enter pick — all the modal-scoped keyboard UX.
  useEffect(() => {
    if (!open) return;
    const handler = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        setOpen(false);
        return;
      }
      // Only react when focus is inside the modal (avoid stealing page keys).
      if (!(ev.target instanceof HTMLElement)) return;
      const inModal = !!ev.target.closest("[data-search-modal]");
      if (!inModal) return;

      if (ev.key === "ArrowDown") {
        ev.preventDefault();
        setActiveIndex((i) => i + 1);
      } else if (ev.key === "ArrowUp") {
        ev.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (ev.key === "Enter") {
        // handlePick reads from closure; let the ref click handler below fire.
        ev.preventDefault();
        resultRefs.current[activeIndex]?.click();
      } else if (ev.key === "Home") {
        ev.preventDefault();
        setActiveIndex(0);
      } else if (ev.key === "End") {
        ev.preventDefault();
        setActiveIndex(resultRefs.current.length - 1);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, activeIndex]);

  // Fetch the index on first open.
  useEffect(() => {
    if (!open || index || loading) return;
    setLoading(true);
    fetch(indexUrl)
      .then((r) => r.json())
      .then((json: SearchIndex) => setIndex(json))
      .catch(() => {
        // Silent failure — modal will show "No results" until a retry.
      })
      .finally(() => setLoading(false));
  }, [open, index, loading, indexUrl]);

  // Focus the input when the modal opens.
  useEffect(() => {
    if (open) {
      onOpen?.();
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery("");
    }
  }, [open, onOpen]);

  // Reset active index when the query changes.
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const results = useMemo(() => {
    if (!flex || !index || !query.trim()) return [];
    const trimmed = query.trim();
    const raw = flex.search(trimmed, { limit: maxResults });
    const ids = new Set<number>();
    for (const field of raw) {
      for (const id of field.result) ids.add(id as number);
    }
    const ordered: SearchEntry[] = [];
    for (const id of ids) {
      const entry = index.entries[id];
      if (entry) ordered.push(entry);
      if (ordered.length >= maxResults) break;
    }
    return ordered;
  }, [flex, index, query, maxResults]);

  // Popular quick-links shown when the input is empty. Derived from
  // POPULAR_URLS and filtered against the real index so a stale entry
  // silently drops out instead of rendering a dead link.
  const popular = useMemo(() => {
    if (!index) return [];
    const byUrl = new Map(index.entries.map((e) => [e.url, e] as const));
    return POPULAR_URLS.map((u) => byUrl.get(u)).filter(
      (e): e is SearchEntry => !!e,
    );
  }, [index]);

  // What the list actually renders — popular before typing, ranked
  // results once the user has entered a query. Keyboard nav + refs
  // work against this single array, so both modes share UX.
  const displayed = query.trim() ? results : popular;

  // Reset active index when the displayed list changes; clamp when shorter.
  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, displayed.length - 1)));
    resultRefs.current = resultRefs.current.slice(0, displayed.length);
  }, [displayed]);

  // Scroll the active row into view on keyboard nav.
  useEffect(() => {
    const el = resultRefs.current[activeIndex];
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handlePick = useCallback(
    (url: string) => {
      onResult?.(url);
      setOpen(false);
      router.push(url);
    },
    [onResult, router],
  );

  const triggerClass = [
    "inline-flex items-center gap-2 h-9 pl-3 pr-2 rounded-lg border border-[#374151] bg-[#111827] hover:bg-[#1F2937] text-[#CBD5F5] text-[13px] transition-colors cursor-pointer",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  // Platform-dependent shortcut glyph (⌘ vs Ctrl) must match server + client,
  // so we resolve it after mount rather than at render time. Server and first
  // client render both emit an empty pill; post-mount useEffect fills in the
  // correct glyph for the current platform.
  const [shortcutPill, setShortcutPill] = useState("");
  useEffect(() => {
    setShortcutPill(formatShortcut(shortcut));
  }, [shortcut]);

  return (
    <>
      <button
        type="button"
        className={triggerClass}
        onClick={() => setOpen(true)}
        aria-label={resolvedPlaceholder}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <span className="flex-1 text-left">{resolvedPlaceholder}</span>
        {shortcutPill && (
          <kbd className="ml-2 rounded px-1.5 py-0.5 text-[11px] font-mono bg-[#0B1220] border border-[#374151] text-[#64748B]">
            {shortcutPill}
          </kbd>
        )}
      </button>
      {open && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[10vh] px-4"
            onClick={() => setOpen(false)}
            data-search-modal
          >
            <div
              className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E5E7EB]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#64748B"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={resolvedPlaceholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 outline-none text-base text-[#0B1220] placeholder:text-[#94A3B8]"
                  aria-label={resolvedPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-[11px] font-mono text-[#64748B] border border-[#E5E7EB] rounded px-1.5 py-0.5 hover:bg-[#F3F4F6]"
                  aria-label={StringManager.getString("search_close_aria_label")}
                >
                  {StringManager.getString("search_close_button")}
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto" role="presentation">
                {loading && (
                  <div className="px-4 py-6 text-sm text-[#64748B]">
                    {StringManager.getString("search_loading")}
                  </div>
                )}
                {!loading && query.trim() && results.length === 0 && (
                  <div className="px-4 py-6 text-sm text-[#64748B]">
                    {StringManager.getString("search_no_results")}
                  </div>
                )}
                {!loading && displayed.length > 0 && (
                  <>
                    {!query.trim() && (
                      <div className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wide uppercase text-[#64748B]">
                        {StringManager.getString("search_popular_heading")}
                      </div>
                    )}
                    <ul className="divide-y divide-[#E5E7EB]" role="listbox">
                      {displayed.map((entry, i) => {
                        const active = i === activeIndex;
                        return (
                          <li key={entry.url}>
                            <button
                              ref={(el) => {
                                resultRefs.current[i] = el;
                              }}
                              type="button"
                              role="option"
                              aria-selected={active}
                              className={[
                                "w-full text-left px-4 py-3 transition-colors",
                                active ? "bg-[#EEF2FF]" : "hover:bg-[#F3F4F6]",
                              ].join(" ")}
                              onClick={() => handlePick(entry.url)}
                              onMouseEnter={() => setActiveIndex(i)}
                            >
                              <div className="text-[15px] font-semibold text-[#0B1220]">
                                {entry.title[locale]}
                              </div>
                              {entry.lead && (
                                <div className="mt-0.5 text-[13px] text-[#475467] line-clamp-2">
                                  {entry.lead[locale]}
                                </div>
                              )}
                              <div className="mt-1 text-[11px] font-mono text-[#64748B]">
                                {entry.url}
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    {!query.trim() && index && (
                      <div className="px-4 py-2 text-[11px] text-[#94A3B8] border-t border-[#F3F4F6]">
                        {StringManager.getString("search_index_hint_tpl").replace(
                          "{count}",
                          String(index.entries.length),
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-4 px-4 py-2 border-t border-[#E5E7EB] bg-[#F9FAFB] text-[11px] text-[#64748B]">
                <span className="inline-flex items-center gap-1">
                  <kbd className="font-mono rounded border border-[#E5E7EB] bg-white px-1">↑</kbd>
                  <kbd className="font-mono rounded border border-[#E5E7EB] bg-white px-1">↓</kbd>
                  {StringManager.getString("search_keyboard_navigate")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="font-mono rounded border border-[#E5E7EB] bg-white px-1">↵</kbd>
                  {StringManager.getString("search_keyboard_select")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="font-mono rounded border border-[#E5E7EB] bg-white px-1">esc</kbd>
                  {StringManager.getString("search_keyboard_close")}
                </span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default Search;
