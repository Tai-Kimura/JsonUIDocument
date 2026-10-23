"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PanelsData, createPanelsData } from "@/generated/data/PanelsData";
import { PanelsViewModel } from "@/viewmodels/viz/PanelsViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function usePanelsViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<PanelsData>(createPanelsData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<PanelsViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new PanelsViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<PanelsData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
