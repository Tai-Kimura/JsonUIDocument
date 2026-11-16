"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { GeneratedCodeData, createGeneratedCodeData } from "@/generated/data/GeneratedCodeData";
import { GeneratedCodeViewModel } from "@/viewmodels/reference/GeneratedCodeViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useGeneratedCodeViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<GeneratedCodeData>(createGeneratedCodeData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<GeneratedCodeViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new GeneratedCodeViewModel(
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

  const setVars = (vars: Partial<GeneratedCodeData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
