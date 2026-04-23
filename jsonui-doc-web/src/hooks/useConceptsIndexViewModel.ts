"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ConceptsIndexData, createConceptsIndexData } from "@/generated/data/ConceptsIndexData";
import { ConceptsIndexViewModel } from "@/viewmodels/ConceptsIndexViewModel";

export function useConceptsIndexViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<ConceptsIndexData>(createConceptsIndexData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const vmRef = useRef<ConceptsIndexViewModel | null>(null);
  if (!vmRef.current) {
    vmRef.current = new ConceptsIndexViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  return { data, viewModel: vmRef.current };
}
