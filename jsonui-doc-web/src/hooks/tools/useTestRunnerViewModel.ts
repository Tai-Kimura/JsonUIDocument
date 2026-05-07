"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { TestRunnerData, createTestRunnerData } from "@/generated/data/TestRunnerData";
import { TestRunnerViewModel } from "@/viewmodels/tools/TestRunnerViewModel";

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

  const setVars = (vars: Partial<TestRunnerData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
