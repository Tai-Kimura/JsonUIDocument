"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  ComponentSpecData,
  createComponentSpecData,
} from "@/generated/data/ComponentSpecData";
import { ComponentSpecViewModel } from "@/viewmodels/spec/ComponentSpecViewModel";

export function useSpecComponentSpecViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<ComponentSpecData>(createComponentSpecData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<ComponentSpecViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new ComponentSpecViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<ComponentSpecData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
