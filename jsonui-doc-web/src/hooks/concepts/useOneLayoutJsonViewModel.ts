"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { OneLayoutJsonData, createOneLayoutJsonData } from "@/generated/data/OneLayoutJsonData";
import { OneLayoutJsonViewModel } from "@/viewmodels/concepts/OneLayoutJsonViewModel";

export function useOneLayoutJsonViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<OneLayoutJsonData>(createOneLayoutJsonData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<OneLayoutJsonViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new OneLayoutJsonViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<OneLayoutJsonData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
