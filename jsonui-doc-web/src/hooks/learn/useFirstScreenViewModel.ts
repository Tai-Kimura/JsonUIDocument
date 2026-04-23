"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { FirstScreenData, createFirstScreenData } from "@/generated/data/FirstScreenData";
import { FirstScreenViewModel } from "@/viewmodels/learn/FirstScreenViewModel";

export function useFirstScreenViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<FirstScreenData>(createFirstScreenData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<FirstScreenViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new FirstScreenViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<FirstScreenData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
