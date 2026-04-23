"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { HelperData, createHelperData } from "@/generated/data/HelperData";
import { HelperViewModel } from "@/viewmodels/tools/HelperViewModel";

export function useHelperViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<HelperData>(createHelperData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<HelperViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new HelperViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<HelperData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
