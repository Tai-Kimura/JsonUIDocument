"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { DeveloperMenuData, createDeveloperMenuData } from "@/generated/data/DeveloperMenuData";
import { DeveloperMenuViewModel } from "@/viewmodels/guides/DeveloperMenuViewModel";

export function useDeveloperMenuViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<DeveloperMenuData>(createDeveloperMenuData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<DeveloperMenuViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new DeveloperMenuViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<DeveloperMenuData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
