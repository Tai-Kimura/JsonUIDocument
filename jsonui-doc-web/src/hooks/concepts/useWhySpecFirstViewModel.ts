"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { WhySpecFirstData, createWhySpecFirstData } from "@/generated/data/WhySpecFirstData";
import { WhySpecFirstViewModel } from "@/viewmodels/concepts/WhySpecFirstViewModel";

export function useWhySpecFirstViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<WhySpecFirstData>(createWhySpecFirstData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<WhySpecFirstViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new WhySpecFirstViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<WhySpecFirstData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
