"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { DataBindingBasicsData, createDataBindingBasicsData } from "@/generated/data/DataBindingBasicsData";
import { DataBindingBasicsViewModel } from "@/viewmodels/learn/DataBindingBasicsViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useDataBindingBasicsViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<DataBindingBasicsData>(createDataBindingBasicsData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<DataBindingBasicsViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new DataBindingBasicsViewModel(
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

  const setVars = (vars: Partial<DataBindingBasicsData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
