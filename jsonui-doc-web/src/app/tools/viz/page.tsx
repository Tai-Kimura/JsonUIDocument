"use client";

import { useRouter } from "next/navigation";
import Viz from "@/generated/components/tools/Viz";
import { useVizViewModel } from "@/hooks/tools/useVizViewModel";

export default function ToolsVizPage() {
  const router = useRouter();
  const { data } = useVizViewModel(router);
  return <Viz data={data} />;
}
