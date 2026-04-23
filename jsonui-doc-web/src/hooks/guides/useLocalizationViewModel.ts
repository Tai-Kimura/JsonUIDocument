"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { LocalizationData, createLocalizationData } from "@/generated/data/LocalizationData";
import { LocalizationViewModel } from "@/viewmodels/guides/LocalizationViewModel";

export function useLocalizationViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<LocalizationData>(createLocalizationData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<LocalizationViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new LocalizationViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<LocalizationData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
