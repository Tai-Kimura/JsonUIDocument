"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { LearnIndexData, createLearnIndexData } from "@/generated/data/LearnIndexData";
import { LearnIndexViewModel } from "@/viewmodels/LearnIndexViewModel";

export function useLearnIndexViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<LearnIndexData>(createLearnIndexData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const vmRef = useRef<LearnIndexViewModel | null>(null);
  if (!vmRef.current) {
    vmRef.current = new LearnIndexViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  return { data, viewModel: vmRef.current };
}
