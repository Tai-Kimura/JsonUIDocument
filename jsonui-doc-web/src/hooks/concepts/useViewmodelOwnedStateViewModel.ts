"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ViewmodelOwnedStateData, createViewmodelOwnedStateData } from "@/generated/data/ViewmodelOwnedStateData";
import { ViewmodelOwnedStateViewModel } from "@/viewmodels/concepts/ViewmodelOwnedStateViewModel";

export function useViewmodelOwnedStateViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<ViewmodelOwnedStateData>(createViewmodelOwnedStateData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<ViewmodelOwnedStateViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new ViewmodelOwnedStateViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<ViewmodelOwnedStateData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
