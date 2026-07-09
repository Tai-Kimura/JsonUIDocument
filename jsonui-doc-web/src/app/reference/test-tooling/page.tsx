"use client";

import { useRouter } from "next/navigation";
import TestTooling from "@/generated/components/reference/TestTooling";
import { useTestToolingViewModel } from "@/hooks/reference/useTestToolingViewModel";

export default function ReferenceTestToolingPage() {
  const router = useRouter();
  const { data } = useTestToolingViewModel(router);
  return <TestTooling data={data} />;
}
