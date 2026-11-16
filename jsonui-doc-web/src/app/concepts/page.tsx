"use client";

import { useRouter } from "next/navigation";
import { ConceptsIndex } from "@/generated/components/ConceptsIndex";
import { useConceptsIndexViewModel } from "@/hooks/useConceptsIndexViewModel";

export default function ConceptsIndexPage() {
  const router = useRouter();
  const { data } = useConceptsIndexViewModel(router);
  return <ConceptsIndex data={data} />;
}
