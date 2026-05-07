"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  CustomTypesData,
  createCustomTypesData,
} from "@/generated/data/CustomTypesData";
import { CustomTypesViewModel } from "@/viewmodels/spec/CustomTypesViewModel";

export function useSpecCustomTypesViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<CustomTypesData>(createCustomTypesData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<CustomTypesViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new CustomTypesViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<CustomTypesData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
