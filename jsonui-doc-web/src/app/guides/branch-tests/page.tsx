"use client";

import { useRouter } from "next/navigation";
import BranchTests from "@/generated/components/guides/BranchTests";
import { useBranchTestsViewModel } from "@/hooks/guides/useBranchTestsViewModel";

export default function GuidesBranchTestsPage() {
  const router = useRouter();
  const { data } = useBranchTestsViewModel(router);
  return <BranchTests data={data} />;
}
