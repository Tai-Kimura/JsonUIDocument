"use client";

import { useRouter } from "next/navigation";
import SplitOverview from "@/generated/components/spec/SplitOverview";
import { useSpecSplitOverviewViewModel } from "@/hooks/spec/useSpecSplitOverviewViewModel";

export default function SpecSplitOverviewPage() {
  const router = useRouter();
  const { data } = useSpecSplitOverviewViewModel(router);
  return <SplitOverview data={data} />;
}
