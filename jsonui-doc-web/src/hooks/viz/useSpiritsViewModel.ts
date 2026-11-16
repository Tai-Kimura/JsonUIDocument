"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SpiritsData, createSpiritsData } from "@/generated/data/SpiritsData";
import { SpiritsViewModel } from "@/viewmodels/viz/SpiritsViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useSpiritsViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<SpiritsData>(createSpiritsData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<SpiritsViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new SpiritsViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<SpiritsData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
