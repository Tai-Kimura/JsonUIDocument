"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { VizIndexData, createVizIndexData } from "@/generated/data/VizIndexData";
import { VizIndexViewModel } from "@/viewmodels/viz/VizIndexViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useVizIndexViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<VizIndexData>(createVizIndexData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<VizIndexViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new VizIndexViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<VizIndexData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
