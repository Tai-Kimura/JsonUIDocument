"use client";

import { useRouter } from "next/navigation";
import { VizIndex } from "@/generated/components/VizIndex";
import { useVizIndexViewModel } from "@/hooks/viz/useVizIndexViewModel";

export default function VizIndexPage() {
  const router = useRouter();
  const { data } = useVizIndexViewModel(router);
  return <VizIndex data={data} />;
}
