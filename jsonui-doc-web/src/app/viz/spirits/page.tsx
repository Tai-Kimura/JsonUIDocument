"use client";

import { useRouter } from "next/navigation";
import Spirits from "@/generated/components/viz/Spirits";
import { useSpiritsViewModel } from "@/hooks/viz/useSpiritsViewModel";

export default function VizSpiritsPage() {
  const router = useRouter();
  const { data } = useSpiritsViewModel(router);
  return <Spirits data={data} />;
}
