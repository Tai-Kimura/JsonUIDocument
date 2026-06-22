"use client";

import { useRouter } from "next/navigation";
import ApiDataModels from "@/generated/components/guides/ApiDataModels";
import { useApiDataModelsViewModel } from "@/hooks/guides/useApiDataModelsViewModel";

export default function GuidesApiDataModelsPage() {
  const router = useRouter();
  const { data } = useApiDataModelsViewModel(router);
  return <ApiDataModels data={data} />;
}
