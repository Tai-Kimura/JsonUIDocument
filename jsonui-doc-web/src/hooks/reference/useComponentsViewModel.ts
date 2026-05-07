"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ComponentsData, createComponentsData } from "@/generated/data/ComponentsData";
import { ComponentsViewModel } from "@/viewmodels/reference/ComponentsViewModel";

export function useComponentsViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<ComponentsData>(createComponentsData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<ComponentsViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new ComponentsViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<ComponentsData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
