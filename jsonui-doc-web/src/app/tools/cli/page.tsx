"use client";

import { useRouter } from "next/navigation";
import Cli from "@/generated/components/tools/Cli";
import { useCliViewModel } from "@/hooks/tools/useCliViewModel";

export default function ToolsCliPage() {
  const router = useRouter();
  const { data } = useCliViewModel(router);
  return <Cli data={data} />;
}
