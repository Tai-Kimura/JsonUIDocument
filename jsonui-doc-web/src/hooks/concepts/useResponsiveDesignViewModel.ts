"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ResponsiveDesignData, createResponsiveDesignData } from "@/generated/data/ResponsiveDesignData";
import { ResponsiveDesignViewModel } from "@/viewmodels/concepts/ResponsiveDesignViewModel";

export function useResponsiveDesignViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<ResponsiveDesignData>(createResponsiveDesignData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<ResponsiveDesignViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new ResponsiveDesignViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<ResponsiveDesignData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
