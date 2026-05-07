"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AttributesData, createAttributesData } from "@/generated/data/AttributesData";
import { AttributesViewModel } from "@/viewmodels/reference/AttributesViewModel";

export function useAttributesViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<AttributesData>(createAttributesData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<AttributesViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new AttributesViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<AttributesData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
