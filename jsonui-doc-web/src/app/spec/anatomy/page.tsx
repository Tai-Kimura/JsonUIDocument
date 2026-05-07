"use client";

import { useRouter } from "next/navigation";
import Anatomy from "@/generated/components/spec/Anatomy";
import { useSpecAnatomyViewModel } from "@/hooks/spec/useSpecAnatomyViewModel";

export default function SpecAnatomyPage() {
  const router = useRouter();
  const { data } = useSpecAnatomyViewModel(router);
  return <Anatomy data={data} />;
}
