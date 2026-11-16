"use client";

import { useRouter } from "next/navigation";
import BranchContracts from "@/generated/components/guides/BranchContracts";
import { useBranchContractsViewModel } from "@/hooks/guides/useBranchContractsViewModel";

export default function GuidesBranchContractsPage() {
  const router = useRouter();
  const { data } = useBranchContractsViewModel(router);
  return <BranchContracts data={data} />;
}
