"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { WritingLayoutsData, createWritingLayoutsData } from "@/generated/data/WritingLayoutsData";
import { WritingLayoutsViewModel } from "@/viewmodels/guides/WritingLayoutsViewModel";

export function useWritingLayoutsViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<WritingLayoutsData>(createWritingLayoutsData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<WritingLayoutsViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new WritingLayoutsViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<WritingLayoutsData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
