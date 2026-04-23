"use client";

import { useRouter } from "next/navigation";
import TestRunner from "@/generated/components/tools/TestRunner";
import { useTestRunnerViewModel } from "@/hooks/tools/useTestRunnerViewModel";

export default function ToolsTestRunnerPage() {
  const router = useRouter();
  const { data } = useTestRunnerViewModel(router);
  return <TestRunner data={data} />;
}
