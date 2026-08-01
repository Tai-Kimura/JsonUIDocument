"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { JuiConfigData, createJuiConfigData } from "@/generated/data/JuiConfigData";
import { JuiConfigViewModel } from "@/viewmodels/reference/JuiConfigViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useJuiConfigViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<JuiConfigData>(createJuiConfigData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<JuiConfigViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new JuiConfigViewModel(
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

  const setVars = (vars: Partial<JuiConfigData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
