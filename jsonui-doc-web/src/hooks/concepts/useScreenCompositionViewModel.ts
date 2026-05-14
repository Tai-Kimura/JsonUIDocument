"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ScreenCompositionData, createScreenCompositionData } from "@/generated/data/ScreenCompositionData";
import { ScreenCompositionViewModel } from "@/viewmodels/concepts/ScreenCompositionViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useScreenCompositionViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<ScreenCompositionData>(createScreenCompositionData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<ScreenCompositionViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new ScreenCompositionViewModel(
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

  const setVars = (vars: Partial<ScreenCompositionData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
