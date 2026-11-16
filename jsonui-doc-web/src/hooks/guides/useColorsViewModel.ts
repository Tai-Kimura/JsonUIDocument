"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ColorsData, createColorsData } from "@/generated/data/ColorsData";
import { ColorsViewModel } from "@/viewmodels/guides/ColorsViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useColorsViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<ColorsData>(createColorsData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<ColorsViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new ColorsViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<ColorsData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
