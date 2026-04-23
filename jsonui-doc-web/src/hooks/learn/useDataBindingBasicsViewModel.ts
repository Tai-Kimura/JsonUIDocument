"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { DataBindingBasicsData, createDataBindingBasicsData } from "@/generated/data/DataBindingBasicsData";
import { DataBindingBasicsViewModel } from "@/viewmodels/learn/DataBindingBasicsViewModel";

export function useDataBindingBasicsViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<DataBindingBasicsData>(createDataBindingBasicsData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<DataBindingBasicsViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new DataBindingBasicsViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<DataBindingBasicsData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
