"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ApiDataModelsData, createApiDataModelsData } from "@/generated/data/ApiDataModelsData";
import { ApiDataModelsViewModel } from "@/viewmodels/guides/ApiDataModelsViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useApiDataModelsViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<ApiDataModelsData>(createApiDataModelsData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<ApiDataModelsViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new ApiDataModelsViewModel(
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

  const setVars = (vars: Partial<ApiDataModelsData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
