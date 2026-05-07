"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { WhySpecFirstData, createWhySpecFirstData } from "@/generated/data/WhySpecFirstData";
import { WhySpecFirstViewModel } from "@/viewmodels/concepts/WhySpecFirstViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useWhySpecFirstViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<WhySpecFirstData>(createWhySpecFirstData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<WhySpecFirstViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new WhySpecFirstViewModel(
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

  const setVars = (vars: Partial<WhySpecFirstData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
