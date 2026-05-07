"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { RjuiData, createRjuiData } from "@/generated/data/RjuiData";
import { RjuiViewModel } from "@/viewmodels/platforms/RjuiViewModel";

export function useRjuiViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<RjuiData>(createRjuiData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<RjuiViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new RjuiViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<RjuiData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
