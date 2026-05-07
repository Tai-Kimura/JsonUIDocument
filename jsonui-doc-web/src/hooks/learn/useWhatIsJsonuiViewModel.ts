"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { WhatIsJsonuiData, createWhatIsJsonuiData } from "@/generated/data/WhatIsJsonuiData";
import { WhatIsJsonuiViewModel } from "@/viewmodels/learn/WhatIsJsonuiViewModel";

export function useWhatIsJsonuiViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<WhatIsJsonuiData>(createWhatIsJsonuiData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<WhatIsJsonuiViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new WhatIsJsonuiViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<WhatIsJsonuiData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
