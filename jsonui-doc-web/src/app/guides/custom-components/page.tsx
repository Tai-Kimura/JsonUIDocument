"use client";

import { useRouter } from "next/navigation";
import CustomComponents from "@/generated/components/guides/CustomComponents";
import { useCustomComponentsViewModel } from "@/hooks/guides/useCustomComponentsViewModel";

export default function GuidesCustomComponentsPage() {
  const router = useRouter();
  const { data } = useCustomComponentsViewModel(router);
  return <CustomComponents data={data} />;
}
