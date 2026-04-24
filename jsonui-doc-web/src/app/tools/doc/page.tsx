"use client";

import { useRouter } from "next/navigation";
import Doc from "@/generated/components/tools/Doc";
import { useDocViewModel } from "@/hooks/tools/useDocViewModel";

export default function ToolsDocPage() {
  const router = useRouter();
  const { data } = useDocViewModel(router);
  return <Doc data={data} />;
}
