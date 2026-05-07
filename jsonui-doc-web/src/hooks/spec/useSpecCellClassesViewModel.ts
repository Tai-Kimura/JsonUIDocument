"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  CellClassesData,
  createCellClassesData,
} from "@/generated/data/CellClassesData";
import { CellClassesViewModel } from "@/viewmodels/spec/CellClassesViewModel";

export function useSpecCellClassesViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<CellClassesData>(createCellClassesData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<CellClassesViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new CellClassesViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<CellClassesData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
