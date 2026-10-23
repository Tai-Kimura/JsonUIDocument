"use client";

import { useRouter } from "next/navigation";
import Cost from "@/generated/components/viz/Cost";
import { useCostViewModel } from "@/hooks/viz/useCostViewModel";

export default function VizCostPage() {
  const router = useRouter();
  const { data } = useCostViewModel(router);
  return <Cost data={data} />;
}
