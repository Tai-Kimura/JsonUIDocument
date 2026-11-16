"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { OneLayoutJsonData, createOneLayoutJsonData } from "@/generated/data/OneLayoutJsonData";
import { OneLayoutJsonViewModel } from "@/viewmodels/concepts/OneLayoutJsonViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useOneLayoutJsonViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<OneLayoutJsonData>(createOneLayoutJsonData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<OneLayoutJsonViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new OneLayoutJsonViewModel(
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

  const setVars = (vars: Partial<OneLayoutJsonData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
