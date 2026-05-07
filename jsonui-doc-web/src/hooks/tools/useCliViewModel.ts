"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { CliData, createCliData } from "@/generated/data/CliData";
import { CliViewModel } from "@/viewmodels/tools/CliViewModel";

export function useCliViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<CliData>(createCliData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<CliViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new CliViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<CliData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
