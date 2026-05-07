"use client";

import { useRouter } from "next/navigation";
import { LearnIndex } from "@/generated/components/LearnIndex";
import { useLearnIndexViewModel } from "@/hooks/useLearnIndexViewModel";

export default function LearnIndexPage() {
  const router = useRouter();
  const { data } = useLearnIndexViewModel(router);
  return <LearnIndex data={data} />;
}
