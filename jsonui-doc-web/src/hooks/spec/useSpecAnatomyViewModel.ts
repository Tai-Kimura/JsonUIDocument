"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  AnatomyData,
  createAnatomyData,
} from "@/generated/data/AnatomyData";
import { AnatomyViewModel } from "@/viewmodels/spec/AnatomyViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useSpecAnatomyViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<AnatomyData>(createAnatomyData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<AnatomyViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new AnatomyViewModel(
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

  const setVars = (vars: Partial<AnatomyData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
