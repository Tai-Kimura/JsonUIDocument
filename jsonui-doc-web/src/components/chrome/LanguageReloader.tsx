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
import { useEffect, useSyncExternalStore } from "react";

import { StringManager } from "@/generated/StringManager";

const LANGUAGE_STORAGE_KEY = "jsonui-language";
const LANGUAGE_EVENT = "chrome:languagechange";

// useSyncExternalStore binding over the StringManager singleton. React's
// official escape-hatch for subscribing to external mutable state: the
// subscribe function is called once per mount to install a listener that
// fires `onStoreChange`, and getSnapshot is read on every render to decide
// whether to re-render (referential equality check).
//
// Why this over the previous setState-inside-event-handler pattern: the
// previous wiring bumped a `version` state on every CustomEvent, but for
// reasons I did not fully pin down (likely Next.js App Router interplay
// with the LanguageReloader sitting above the page boundary), the
// rerender did not always remount the subtree when the sibling
// ChromeViewModel fired the event. useSyncExternalStore guarantees a
// consistent subscribe → rerender path documented by React itself.
function subscribeLanguage(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(LANGUAGE_EVENT, onStoreChange);
  return () => window.removeEventListener(LANGUAGE_EVENT, onStoreChange);
}

function getLanguageSnapshot(): string {
  return StringManager.language;
}

function getLanguageServerSnapshot(): string {
  // Server always renders with the 'en' default — there is no localStorage
  // on the server. The client reconciles this against the stored language
  // in the mount-time useEffect below and dispatches the language event
  // to force a rerender via useSyncExternalStore.
  return "en";
}

interface Props {
  children: React.ReactNode;
}

export function LanguageReloader({ children }: Props) {
  const pathname = usePathname();
  const language = useSyncExternalStore(
    subscribeLanguage,
    getLanguageSnapshot,
    getLanguageServerSnapshot,
  );

  // Restore the persisted language on first client mount. If the stored
  // value differs from the current StringManager state (which always starts
  // at the 'en' constructor default), flip StringManager and dispatch the
  // language event so every useSyncExternalStore subscriber rerenders with
  // the restored language.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && saved !== StringManager.language) {
      StringManager.setLanguage(saved);
      window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT));
    }
  }, []);

  // Remount the subtree whenever the language or pathname changes. The
  // pathname key covers static-exported pages whose pre-rendered English
  // DOM would otherwise stick around after client-side navigation until
  // the user next toggles.
  return (
    <div key={`${language}-${pathname}`} style={{ display: "contents" }}>
      {children}
    </div>
  );
}

export default LanguageReloader;
