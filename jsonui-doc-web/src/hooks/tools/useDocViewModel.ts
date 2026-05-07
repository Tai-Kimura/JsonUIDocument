"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { DocData, createDocData } from "@/generated/data/DocData";
import { DocViewModel } from "@/viewmodels/tools/DocViewModel";

export function useDocViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<DocData>(createDocData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<DocViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new DocViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<DocData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
