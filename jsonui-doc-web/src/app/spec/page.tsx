"use client";

import { useRouter } from "next/navigation";
import { SpecIndex } from "@/generated/components/SpecIndex";
import { useSpecIndexViewModel } from "@/hooks/useSpecIndexViewModel";

export default function SpecIndexPage() {
  const router = useRouter();
  const { data } = useSpecIndexViewModel(router);
  return <SpecIndex data={data} />;
}
