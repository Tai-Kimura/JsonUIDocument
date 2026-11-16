"use client";

import { useRouter } from "next/navigation";
import DataBinding from "@/generated/components/concepts/DataBinding";
import { useDataBindingViewModel } from "@/hooks/concepts/useDataBindingViewModel";

export default function ConceptsDataBindingPage() {
  const router = useRouter();
  const { data } = useDataBindingViewModel(router);
  return <DataBinding data={data} />;
}
