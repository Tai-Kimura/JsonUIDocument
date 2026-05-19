"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { TestRunnerData, createTestRunnerData } from "@/generated/data/TestRunnerData";
import { TestRunnerViewModel } from "@/viewmodels/tools/TestRunnerViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useTestRunnerViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<TestRunnerData>(createTestRunnerData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<TestRunnerViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new TestRunnerViewModel(
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

  const setVars = (vars: Partial<TestRunnerData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
