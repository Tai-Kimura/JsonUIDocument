"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { CliCommandsData, createCliCommandsData } from "@/generated/data/CliCommandsData";
import { CliCommandsViewModel } from "@/viewmodels/reference/CliCommandsViewModel";

export function useCliCommandsViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<CliCommandsData>(createCliCommandsData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<CliCommandsViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new CliCommandsViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<CliCommandsData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
