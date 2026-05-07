"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ReferenceIndexData, createReferenceIndexData } from "@/generated/data/ReferenceIndexData";
import { ReferenceIndexViewModel } from "@/viewmodels/ReferenceIndexViewModel";

export function useReferenceIndexViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<ReferenceIndexData>(createReferenceIndexData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const vmRef = useRef<ReferenceIndexViewModel | null>(null);
  if (!vmRef.current) {
    vmRef.current = new ReferenceIndexViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  return { data, viewModel: vmRef.current };
}
