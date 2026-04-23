"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SwiftData, createSwiftData } from "@/generated/data/SwiftData";
import { SwiftViewModel } from "@/viewmodels/platforms/SwiftViewModel";

export function useSwiftViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<SwiftData>(createSwiftData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<SwiftViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new SwiftViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<SwiftData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
