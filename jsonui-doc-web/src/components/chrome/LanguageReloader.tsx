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

import { useEffect, useState } from "react";

interface Props {
  children: React.ReactNode;
}

export function LanguageReloader({ children }: Props) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handler = () => setVersion((v) => v + 1);
    window.addEventListener("chrome:languagechange", handler);
    return () => window.removeEventListener("chrome:languagechange", handler);
  }, []);

  return (
    <div key={version} style={{ display: "contents" }}>
      {children}
    </div>
  );
}

export default LanguageReloader;
