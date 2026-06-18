"use client";

// Wrapper around the generated useHomeViewModel that adds the post-mount
// mountLanguage() call so HomeViewModel's pre-resolved strings can be
// re-seeded with the persisted locale after hydration.
//
// The generated hook (src/generated/hooks/useHomeViewModel.ts) is overwritten
// on every `jui build`, so this wrapper lives in src/hooks/ and the page
// imports from here instead.

import { useEffect } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useHomeViewModel as useGeneratedHomeViewModel } from "@/generated/hooks/useHomeViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useHomeViewModel(router: AppRouterInstance) {
  const result = useGeneratedHomeViewModel(router);

  useEffect(() => {
    const vm = (result as { viewModel?: { mountLanguage?: () => void } }).viewModel;
    vm?.mountLanguage?.();
    if (typeof window === "undefined") return;
    const onLang = () => vm?.mountLanguage?.();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
    // Run once on mount (matches the 41 sibling wrappers). Depending on
    // `result` re-fired this effect every render → mountLanguage()→setState
    // → infinite render loop → broken hydration. See トップページ非対話-原因報告.md.
  }, []);

  return result;
}
