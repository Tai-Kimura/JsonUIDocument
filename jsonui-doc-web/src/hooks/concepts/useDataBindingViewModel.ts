"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { DataBindingData, createDataBindingData } from "@/generated/data/DataBindingData";
import { DataBindingViewModel } from "@/viewmodels/concepts/DataBindingViewModel";

export function useDataBindingViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<DataBindingData>(createDataBindingData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<DataBindingViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new DataBindingViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<DataBindingData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
