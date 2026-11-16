"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { DataBindingData, createDataBindingData } from "@/generated/data/DataBindingData";
import { DataBindingViewModel } from "@/viewmodels/concepts/DataBindingViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useDataBindingViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<DataBindingData>(createDataBindingData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<DataBindingViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new DataBindingViewModel(
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

  const setVars = (vars: Partial<DataBindingData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
