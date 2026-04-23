"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { KotlinData, createKotlinData } from "@/generated/data/KotlinData";
import { KotlinViewModel } from "@/viewmodels/platforms/KotlinViewModel";

export function useKotlinViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<KotlinData>(createKotlinData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<KotlinViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new KotlinViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<KotlinData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
