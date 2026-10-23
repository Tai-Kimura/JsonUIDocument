"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { TestsData, createTestsData } from "@/generated/data/TestsData";
import { TestsViewModel } from "@/viewmodels/viz/TestsViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useTestsViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<TestsData>(createTestsData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<TestsViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new TestsViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<TestsData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
