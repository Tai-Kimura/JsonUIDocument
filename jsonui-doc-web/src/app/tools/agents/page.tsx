"use client";

import { useRouter } from "next/navigation";
import Agents from "@/generated/components/tools/Agents";
import { useToolsAgentsViewModel } from "@/hooks/tools/useToolsAgentsViewModel";

export default function ToolsAgentsPage() {
  const router = useRouter();
  const { data } = useToolsAgentsViewModel(router);
  return <Agents data={data} />;
}
