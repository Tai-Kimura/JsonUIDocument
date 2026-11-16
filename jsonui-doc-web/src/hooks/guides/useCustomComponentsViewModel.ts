"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { CustomComponentsData, createCustomComponentsData } from "@/generated/data/CustomComponentsData";
import { CustomComponentsViewModel } from "@/viewmodels/guides/CustomComponentsViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useCustomComponentsViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<CustomComponentsData>(createCustomComponentsData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<CustomComponentsViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new CustomComponentsViewModel(
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

  const setVars = (vars: Partial<CustomComponentsData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
