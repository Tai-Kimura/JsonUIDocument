"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { CostData, createCostData } from "@/generated/data/CostData";
import { CostViewModel } from "@/viewmodels/viz/CostViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useCostViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<CostData>(createCostData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<CostViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new CostViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<CostData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
