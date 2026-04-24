// CodeBlock.tsx
// Web converter for the CodeBlock component spec.
// Spec: docs/components/json/codeblock.component.json
//
// This file is NOT marked @generated — the scaffold from `jui g converter` is expected
// to be filled in here. Only the attribute CONTRACT (which props exist, what types) is
// governed by the spec; rendering behavior lives here.
//
// Highlighting strategy:
//   - Shiki's highlighter is a singleton loaded lazily on first render. With
//     `output: "export"` the whole page is static, but Shiki still wants to do its
//     work at render time because `code` is only known when the component mounts
//     on the server / during SSG. React Server Components would let us make this
//     pure SSG; for now we use "use client" + a singleton highlighter and accept
//     a tiny client hop for the highlight. When the ground's ThemeContext lands,
//     swap the hardcoded default ("github-dark") for context-driven values.
//
// TODO(theme-context): once docs/plans defines a project-wide ThemeContext, replace
//   the hardcoded DEFAULT_THEME with a context read so dark/light mode can flip.

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Highlighter, BundledLanguage, BundledTheme } from "shiki";

import { StringManager } from "@/generated/StringManager";

export interface CodeBlockProps {
  /** Raw source code. Rendered verbatim. Required. */
  code: string;
  /** Shiki grammar id (e.g. 'ts', 'json', 'bash'). Pass 'text' to skip highlighting. */
  language: string;
  /** Optional caption rendered above the code region. */
  filename?: string;
  /** Render a left-hand gutter of line numbers. Default: false. */
  showLineNumbers?: boolean;
  /** First line number to display when showLineNumbers is true. Default: 1. */
  startLine?: number;
  /**
   * 1-indexed line numbers to visually emphasize. Indexing is RELATIVE TO THE
   * CODE itself, not to `startLine`. So `code` line 1 is always `highlightLines: [1]`,
   * regardless of what `startLine` is set to. This matches the spec:
   * > "Indexing is relative to the code prop itself, not to startLine."
   */
  highlightLines?: number[];
  /** Soft-wrap long lines. Default: false (horizontal scroll). */
  wrapLines?: boolean;
  /** Show the copy-to-clipboard button. Default: true. */
  copyable?: boolean;
  /** Max pixel height for the code region; enables vertical scroll when exceeded. */
  maxHeight?: number;
  /** Per-instance Shiki theme override. Falls back to DEFAULT_THEME. */
  theme?: string;
  /** Analytics callback fired after a successful copy. Receives the copied string. */
  onCopy?: (code: string) => void;
  /** Forwarded from the converter base (Tailwind utility classes on the wrapper). */
  className?: string;
  /** DOM id, forwarded from Layout JSON `id:`. */
  id?: string;
  /** Children are IGNORED — CodeBlock is a leaf per the spec. Accepted to keep the
   * converter-generated prop shape stable; intentionally unused. */
  children?: React.ReactNode;
}

// v1 default. Swap for ThemeContext when the project introduces one.
const DEFAULT_THEME: BundledTheme = "github-dark";

// Languages pre-bundled into the singleton. `language` prop can be any Shiki
// grammar id, but the first render for an unloaded grammar incurs a dynamic
// load. Keeping this list tight avoids shipping every grammar.
const PRELOADED_LANGUAGES: BundledLanguage[] = [
  "json",
  "jsonc",
  "typescript",
  "tsx",
  "javascript",
  "jsx",
  "swift",
  "kotlin",
  "bash",
  "shell",
  "html",
  "css",
  "markdown",
];

const PRELOADED_THEMES: BundledTheme[] = ["github-dark", "github-light"];

// Singleton — one Highlighter for the whole page. Loading grammars/themes is
// idempotent so additional theme/lang demands after init just extend this.
let highlighterPromise: Promise<Highlighter> | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import("shiki").then((shiki) =>
      shiki.createHighlighter({
        themes: PRELOADED_THEMES,
        langs: PRELOADED_LANGUAGES,
      })
    );
  }
  return highlighterPromise;
}

/** Normalize a user-supplied language id. 'text' and unknown ids render as plain. */
function normalizeLanguage(lang: string): string {
  if (!lang) return "text";
  const l = lang.toLowerCase();
  // Common aliases people will try.
  const aliases: Record<string, string> = {
    ts: "typescript",
    js: "javascript",
    sh: "bash",
    zsh: "bash",
    yml: "yaml",
    md: "markdown",
  };
  return aliases[l] ?? l;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  filename,
  showLineNumbers = false,
  startLine = 1,
  highlightLines,
  wrapLines = false,
  copyable = true,
  maxHeight,
  theme,
  onCopy,
  className = "",
  id,
  // children intentionally ignored (leaf component per spec)
}) => {
  const effectiveTheme = (theme ?? DEFAULT_THEME) as BundledTheme;
  const effectiveLang = normalizeLanguage(language);
  const highlightSet = useMemo(
    () => new Set((highlightLines ?? []).map((n) => Math.trunc(n))),
    [highlightLines]
  );

  // Split the raw code into lines up front so we can render our own gutter /
  // highlight overlay regardless of Shiki's output. Keep trailing newlines in
  // step with the input: if the code ends with \n, drop the final empty line.
  const lines = useMemo(() => {
    const arr = code.split("\n");
    if (arr.length > 1 && arr[arr.length - 1] === "") arr.pop();
    return arr;
  }, [code]);

  // Token state: one pre-tokenized HTML span per line, or null while loading / on error.
  const [tokenHtml, setTokenHtml] = useState<string[] | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;
    setTokenHtml(null);
    setLoadError(null);

    if (effectiveLang === "text") {
      // No highlight requested; fall through to the plain-text render path.
      return;
    }

    (async () => {
      try {
        const hl = await getHighlighter();

        // Ensure the requested theme/lang are loaded. Both calls are idempotent.
        if (!hl.getLoadedThemes().includes(effectiveTheme)) {
          await hl.loadTheme(effectiveTheme);
        }
        if (!hl.getLoadedLanguages().includes(effectiveLang as BundledLanguage)) {
          try {
            await hl.loadLanguage(effectiveLang as BundledLanguage);
          } catch {
            // Unknown grammar — render plain. Don't blow up the page.
            if (!abortRef.current) setTokenHtml(null);
            return;
          }
        }

        // codeToHtml gives us one <pre><code>...</code></pre>; we only want the
        // per-line <span> content, so we tokenize and render ourselves.
        const tokens = hl.codeToTokensBase(code, {
          lang: effectiveLang as BundledLanguage,
          theme: effectiveTheme,
        });

        const html = tokens.map((line) =>
          line
            .map((token) => {
              const style = token.color
                ? `style="color:${token.color}"`
                : "";
              return `<span ${style}>${escapeHtml(token.content)}</span>`;
            })
            .join("")
        );

        if (!abortRef.current) setTokenHtml(html);
      } catch (err) {
        if (!abortRef.current) setLoadError(err as Error);
      }
    })();

    return () => {
      abortRef.current = true;
    };
  }, [code, effectiveLang, effectiveTheme]);

  // --- copy button --------------------------------------------------------
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  const handleCopy = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        // Fallback: hidden textarea + execCommand. Covers non-secure contexts.
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      onCopy?.(code);
      setCopied(true);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Swallow — analytics is best-effort, and we don't want the copy button
      // to render an error state in the doc site.
    }
  }, [code, onCopy]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  // --- render -------------------------------------------------------------
  const rootBg = effectiveTheme === "github-light" ? "bg-white" : "bg-[#0d1117]";
  const rootText = effectiveTheme === "github-light" ? "text-slate-900" : "text-slate-100";
  const borderColor =
    effectiveTheme === "github-light" ? "border-slate-200" : "border-slate-700";
  const captionBg =
    effectiveTheme === "github-light" ? "bg-slate-100" : "bg-[#161b22]";
  const gutterColor =
    effectiveTheme === "github-light" ? "text-slate-400" : "text-slate-500";
  const highlightBg =
    effectiveTheme === "github-light" ? "bg-yellow-100" : "bg-[#3d3a16]";

  const codeRegionStyle: React.CSSProperties = {};
  if (typeof maxHeight === "number" && maxHeight > 0) {
    codeRegionStyle.maxHeight = `${maxHeight}px`;
    codeRegionStyle.overflowY = "auto";
  }

  const wrapperClasses = [
    "relative",
    "rounded-lg",
    "border",
    borderColor,
    rootBg,
    rootText,
    "text-sm",
    "font-mono",
    "overflow-hidden",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const lineWrapClass = wrapLines
    ? "whitespace-pre-wrap break-all"
    : "whitespace-pre";

  return (
    <div id={id} className={wrapperClasses}>
      {filename ? (
        <div
          className={`${captionBg} ${borderColor} border-b px-3 py-1.5 text-xs ${gutterColor} font-sans select-none`}
        >
          {filename}
        </div>
      ) : null}

      {copyable !== false ? (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={
            copied
              ? StringManager.getString("search_copied_label")
              : StringManager.getString("search_copy_code_label")
          }
          className={`absolute top-2 right-2 z-10 rounded px-2 py-1 text-xs font-sans transition ${
            effectiveTheme === "github-light"
              ? "bg-white/80 text-slate-700 border border-slate-200 hover:bg-white"
              : "bg-slate-800/80 text-slate-200 border border-slate-700 hover:bg-slate-700"
          }`}
        >
          {copied
            ? StringManager.getString("search_copied_button")
            : StringManager.getString("search_copy_button")}
        </button>
      ) : null}

      <div
        className={`${wrapLines ? "overflow-x-hidden" : "overflow-x-auto"}`}
        style={codeRegionStyle}
      >
        <pre className="m-0 p-0 leading-relaxed">
          <code className={`block ${lineWrapClass}`}>
            {lines.map((rawLine, idx) => {
              const oneBased = idx + 1;
              const lineNumber = startLine + idx;
              const isHighlighted = highlightSet.has(oneBased);
              const rowBg = isHighlighted ? highlightBg : "";
              return (
                <div
                  key={idx}
                  className={`flex ${rowBg}`}
                >
                  {showLineNumbers ? (
                    <span
                      aria-hidden="true"
                      className={`shrink-0 select-none px-3 text-right ${gutterColor}`}
                      style={{ minWidth: "3.5em" }}
                    >
                      {lineNumber}
                    </span>
                  ) : (
                    <span aria-hidden="true" className="shrink-0" style={{ width: "1rem" }} />
                  )}
                  <span
                    className={`grow pr-4 ${lineWrapClass}`}
                    // Using dangerouslySetInnerHTML is load-bearing: Shiki's per-token
                    // spans carry inline `style="color:#..."` attributes. The input
                    // has already been HTML-escaped via escapeHtml() in the tokenize
                    // step, so there's no injection vector from user code.
                    {...(tokenHtml && tokenHtml[idx] !== undefined
                      ? { dangerouslySetInnerHTML: { __html: tokenHtml[idx] || " " } }
                      : { children: rawLine.length > 0 ? rawLine : " " })}
                  />
                </div>
              );
            })}
          </code>
        </pre>
      </div>

      {loadError ? (
        <div className="px-3 py-1 text-xs font-sans text-red-400 border-t border-slate-700">
          Highlight unavailable: {loadError.message}
        </div>
      ) : null}
    </div>
  );
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default CodeBlock;
