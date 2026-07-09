"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ApiMockData, createApiMockData } from "@/generated/data/ApiMockData";
import { ApiMockViewModel } from "@/viewmodels/guides/ApiMockViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useApiMockViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<ApiMockData>(createApiMockData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<ApiMockViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new ApiMockViewModel(
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

  const setVars = (vars: Partial<ApiMockData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
