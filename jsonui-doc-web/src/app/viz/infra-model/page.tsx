"use client";

import { useRouter } from "next/navigation";
import InfraModel from "@/generated/components/viz/InfraModel";
import { useInfraModelViewModel } from "@/hooks/viz/useInfraModelViewModel";

export default function VizInfraModelPage() {
  const router = useRouter();
  const { data } = useInfraModelViewModel(router);
  return <InfraModel data={data} />;
}
