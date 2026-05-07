"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { HotReloadData, createHotReloadData } from "@/generated/data/HotReloadData";
import { HotReloadViewModel } from "@/viewmodels/concepts/HotReloadViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useHotReloadViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<HotReloadData>(createHotReloadData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<HotReloadViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new HotReloadViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<HotReloadData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
