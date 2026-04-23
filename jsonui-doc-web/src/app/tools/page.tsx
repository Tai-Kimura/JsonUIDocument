"use client";

import { useRouter } from "next/navigation";
import { ToolsIndex } from "@/generated/components/ToolsIndex";
import { useToolsIndexViewModel } from "@/hooks/useToolsIndexViewModel";

export default function ToolsIndexPage() {
  const router = useRouter();
  const { data } = useToolsIndexViewModel(router);
  return <ToolsIndex data={data} />;
}
