"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { DataModelsFromOpenapiData, createDataModelsFromOpenapiData } from "@/generated/data/DataModelsFromOpenapiData";
import { DataModelsFromOpenapiViewModel } from "@/viewmodels/concepts/DataModelsFromOpenapiViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useDataModelsFromOpenapiViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<DataModelsFromOpenapiData>(createDataModelsFromOpenapiData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<DataModelsFromOpenapiViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new DataModelsFromOpenapiViewModel(
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

  const setVars = (vars: Partial<DataModelsFromOpenapiData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
