"use client";

import { useRouter } from "next/navigation";
import Testing from "@/generated/components/guides/Testing";
import { useTestingViewModel } from "@/hooks/guides/useTestingViewModel";

export default function GuidesTestingPage() {
  const router = useRouter();
  const { data } = useTestingViewModel(router);
  return <Testing data={data} />;
}
