"use client";

import { useRouter } from "next/navigation";
import DataBindingBasics from "@/generated/components/learn/DataBindingBasics";
import { useDataBindingBasicsViewModel } from "@/hooks/learn/useDataBindingBasicsViewModel";

export default function LearnDataBindingBasicsPage() {
  const router = useRouter();
  const { data } = useDataBindingBasicsViewModel(router);
  return <DataBindingBasics data={data} />;
}
