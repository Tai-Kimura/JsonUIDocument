"use client";

import { useRouter } from "next/navigation";
import Mcp from "@/generated/components/tools/Mcp";
import { useMcpViewModel } from "@/hooks/tools/useMcpViewModel";

export default function ToolsMcpPage() {
  const router = useRouter();
  const { data } = useMcpViewModel(router);
  return <Mcp data={data} />;
}
