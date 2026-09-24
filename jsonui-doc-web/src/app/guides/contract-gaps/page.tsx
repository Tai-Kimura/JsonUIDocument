"use client";

import { useRouter } from "next/navigation";
import ContractGaps from "@/generated/components/guides/ContractGaps";
import { useContractGapsViewModel } from "@/hooks/guides/useContractGapsViewModel";

export default function GuidesContractGapsPage() {
  const router = useRouter();
  const { data } = useContractGapsViewModel(router);
  return <ContractGaps data={data} />;
}
