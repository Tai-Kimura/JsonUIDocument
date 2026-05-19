"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { DeveloperMenuData, createDeveloperMenuData } from "@/generated/data/DeveloperMenuData";
import { DeveloperMenuViewModel } from "@/viewmodels/guides/DeveloperMenuViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useDeveloperMenuViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<DeveloperMenuData>(createDeveloperMenuData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<DeveloperMenuViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new DeveloperMenuViewModel(
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

  const setVars = (vars: Partial<DeveloperMenuData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
