"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { FirstScreenData, createFirstScreenData } from "@/generated/data/FirstScreenData";
import { FirstScreenViewModel } from "@/viewmodels/learn/FirstScreenViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useFirstScreenViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<FirstScreenData>(createFirstScreenData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<FirstScreenViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new FirstScreenViewModel(
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

  const setVars = (vars: Partial<FirstScreenData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
