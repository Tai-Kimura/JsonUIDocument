"use client";

import { useRouter } from "next/navigation";
import { ReferenceIndex } from "@/generated/components/ReferenceIndex";
import { useReferenceIndexViewModel } from "@/hooks/useReferenceIndexViewModel";

export default function ReferenceIndexPage() {
  const router = useRouter();
  const { data } = useReferenceIndexViewModel(router);
  return <ReferenceIndex data={data} />;
}
