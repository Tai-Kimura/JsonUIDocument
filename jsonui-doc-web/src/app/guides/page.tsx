"use client";

import { useRouter } from "next/navigation";
import { GuidesIndex } from "@/generated/components/GuidesIndex";
import { useGuidesIndexViewModel } from "@/hooks/useGuidesIndexViewModel";

export default function GuidesIndexPage() {
  const router = useRouter();
  const { data } = useGuidesIndexViewModel(router);
  return <GuidesIndex data={data} />;
}
