"use client";

import { useRouter } from "next/navigation";
import McpTools from "@/generated/components/reference/McpTools";
import { useMcpToolsViewModel } from "@/hooks/reference/useMcpToolsViewModel";

export default function ReferenceMcpToolsPage() {
  const router = useRouter();
  const { data } = useMcpToolsViewModel(router);
  return <McpTools data={data} />;
}
