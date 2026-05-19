"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { TestingData, createTestingData } from "@/generated/data/TestingData";
import { TestingViewModel } from "@/viewmodels/guides/TestingViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useTestingViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<TestingData>(createTestingData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<TestingViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new TestingViewModel(
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

  const setVars = (vars: Partial<TestingData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
