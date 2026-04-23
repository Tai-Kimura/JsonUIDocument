"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { GuidesIndexData, createGuidesIndexData } from "@/generated/data/GuidesIndexData";
import { GuidesIndexViewModel } from "@/viewmodels/GuidesIndexViewModel";

export function useGuidesIndexViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<GuidesIndexData>(createGuidesIndexData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const vmRef = useRef<GuidesIndexViewModel | null>(null);
  if (!vmRef.current) {
    vmRef.current = new GuidesIndexViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  return { data, viewModel: vmRef.current };
}
