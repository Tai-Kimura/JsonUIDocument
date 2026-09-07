"use client";

import { useRouter } from "next/navigation";
import UnitContracts from "@/generated/components/guides/UnitContracts";
import { useUnitContractsViewModel } from "@/hooks/guides/useUnitContractsViewModel";

export default function GuidesUnitContractsPage() {
  const router = useRouter();
  const { data } = useUnitContractsViewModel(router);
  return <UnitContracts data={data} />;
}
