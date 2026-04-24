"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  AnatomyData,
  createAnatomyData,
} from "@/generated/data/AnatomyData";
import { AnatomyViewModel } from "@/viewmodels/spec/AnatomyViewModel";

export function useSpecAnatomyViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<AnatomyData>(createAnatomyData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<AnatomyViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new AnatomyViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<AnatomyData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
