"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { NavigationData, createNavigationData } from "@/generated/data/NavigationData";
import { NavigationViewModel } from "@/viewmodels/guides/NavigationViewModel";

export function useNavigationViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<NavigationData>(createNavigationData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<NavigationViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new NavigationViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<NavigationData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
