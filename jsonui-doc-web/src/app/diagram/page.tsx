"use client";

import { useRouter } from "next/navigation";
import { DiagramIndex } from "@/generated/components/DiagramIndex";
import { useDiagramIndexViewModel } from "@/hooks/useDiagramIndexViewModel";

export default function DiagramIndexPage() {
  const router = useRouter();
  const { data } = useDiagramIndexViewModel(router);
  return <DiagramIndex data={data} />;
}
