"use client";

import { useRouter } from "next/navigation";
import Helper from "@/generated/components/tools/Helper";
import { useHelperViewModel } from "@/hooks/tools/useHelperViewModel";

export default function ToolsHelperPage() {
  const router = useRouter();
  const { data } = useHelperViewModel(router);
  return <Helper data={data} />;
}
