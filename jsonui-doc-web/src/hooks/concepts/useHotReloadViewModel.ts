"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { HotReloadData, createHotReloadData } from "@/generated/data/HotReloadData";
import { HotReloadViewModel } from "@/viewmodels/concepts/HotReloadViewModel";

export function useHotReloadViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<HotReloadData>(createHotReloadData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<HotReloadViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new HotReloadViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<HotReloadData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
