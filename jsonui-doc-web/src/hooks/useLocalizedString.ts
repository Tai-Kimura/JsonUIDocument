// useLocalizedString.ts
// Hydration-safe wrapper around StringManager.getString for hand-authored
// extension components.
//
// Why this exists: StringManager (generated/StringManager.ts) reads
// localStorage in its constructor, so on the client the singleton already
// returns the persisted language ("ja") at module-load time — but the
// server rendered with the default ("en"). Calling getString during render
// therefore produces a different string between SSR and the first client
// render, surfacing as a Next.js Recoverable Hydration Error.
//
// The hook resolves the safe fallback during SSR + first client render
// (matching server output), then swaps to the localized value in a layout
// effect after mount, and re-resolves whenever StringManager fires its
// language-change event. The momentary fallback flash on first paint is
// invisible for aria-labels and acceptable for visible UI.
"use client";

import { useEffect, useState } from "react";
import { StringManager } from "@/generated/StringManager";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useLocalizedString(key: string, fallback: string): string {
  const [value, setValue] = useState<string>(fallback);

  useEffect(() => {
    const resolve = () => {
      const next = StringManager.getString(key);
      // StringManager returns the key itself when missing — fall back to the
      // English literal in that case so we never display a snake_case key.
      setValue(next && next !== key ? next : fallback);
    };
    resolve();
    if (typeof window === "undefined") return;
    window.addEventListener(LANGUAGE_EVENT, resolve);
    return () => window.removeEventListener(LANGUAGE_EVENT, resolve);
  }, [key, fallback]);

  return value;
}
