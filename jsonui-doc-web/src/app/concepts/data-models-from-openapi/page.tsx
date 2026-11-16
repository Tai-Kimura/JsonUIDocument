"use client";

import { useRouter } from "next/navigation";
import DataModelsFromOpenapi from "@/generated/components/concepts/DataModelsFromOpenapi";
import { useDataModelsFromOpenapiViewModel } from "@/hooks/concepts/useDataModelsFromOpenapiViewModel";

export default function ConceptsDataModelsFromOpenapiPage() {
  const router = useRouter();
  const { data } = useDataModelsFromOpenapiViewModel(router);
  return <DataModelsFromOpenapi data={data} />;
}
