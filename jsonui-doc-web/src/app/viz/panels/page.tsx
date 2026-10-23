"use client";

import { useRouter } from "next/navigation";
import Panels from "@/generated/components/viz/Panels";
import { usePanelsViewModel } from "@/hooks/viz/usePanelsViewModel";

export default function VizPanelsPage() {
  const router = useRouter();
  const { data } = usePanelsViewModel(router);
  return <Panels data={data} />;
}
