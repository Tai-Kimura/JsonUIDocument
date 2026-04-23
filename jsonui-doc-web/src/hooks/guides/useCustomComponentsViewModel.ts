"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { CustomComponentsData, createCustomComponentsData } from "@/generated/data/CustomComponentsData";
import { CustomComponentsViewModel } from "@/viewmodels/guides/CustomComponentsViewModel";

export function useCustomComponentsViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<CustomComponentsData>(createCustomComponentsData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<CustomComponentsViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new CustomComponentsViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<CustomComponentsData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
