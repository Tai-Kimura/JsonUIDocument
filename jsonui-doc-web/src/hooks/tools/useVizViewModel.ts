"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { VizData, createVizData } from "@/generated/data/VizData";
import { VizViewModel } from "@/viewmodels/tools/VizViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useVizViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<VizData>(createVizData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<VizViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new VizViewModel(
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

  const setVars = (vars: Partial<VizData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
