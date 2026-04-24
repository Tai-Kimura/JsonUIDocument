// LanguageReloader.tsx
// Forces a full remount of its children whenever the 'chrome:languagechange'
// CustomEvent fires. Each page's generated hook seeds StringManager
// lookups into its ViewModel data at mount — without a remount the page
// would keep rendering cached pre-switch strings (only the chrome itself,
// which re-runs onAppear inside ChromeViewModel, picks up the new language).
//
// Implementation: a key-based remount on a <div style="display:contents">
// wrapper. `display: contents` keeps the element layout-neutral so nothing
// inside perceives an extra parent, while bumping `key` on every language
// toggle discards and re-mounts the subtree.
//
// Scroll position resets to the top on language change — acceptable for a
// docs site where the reader is effectively switching to a different copy
// of the article.
//
// Longer term this behavior should live in the generated useXxxViewModel
// template (re-seed on the language event), see
// jsonui-cli/docs/bugs/rjui-generated-hook-language-reseed.md.

"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { StringManager } from "@/generated/StringManager";

const LANGUAGE_STORAGE_KEY = "jsonui-language";

interface Props {
  children: React.ReactNode;
}

export function LanguageReloader({ children }: Props) {
  const [version, setVersion] = useState(0);
  const pathname = usePathname();

  // On first client mount, restore the stored language (if any) and force a
  // remount so subtrees re-render with the live StringManager state. SSR
  // always renders with the 'en' default (no localStorage on the server),
  // so the initial DOM is English; if the user had previously toggled to
  // another language, this bumps the remount key so generated components
  // re-read StringManager.currentLanguage.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && saved !== StringManager.language) {
      StringManager.setLanguage(saved);
      setVersion((v) => v + 1);
      window.dispatchEvent(new CustomEvent("chrome:languagechange"));
    }
    const handler = () => setVersion((v) => v + 1);
    window.addEventListener("chrome:languagechange", handler);
    return () => window.removeEventListener("chrome:languagechange", handler);
  }, []);

  // Key on pathname too so a client-side navigation into a page that was
  // pre-rendered at build time (English) re-mounts under the current
  // StringManager state — otherwise the hydrated English DOM persists until
  // the user next toggles the language.
  return (
    <div key={`${version}-${pathname}`} style={{ display: "contents" }}>
      {children}
    </div>
  );
}

export default LanguageReloader;
