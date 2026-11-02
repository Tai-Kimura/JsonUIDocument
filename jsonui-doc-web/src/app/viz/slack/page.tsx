"use client";

import { useRouter } from "next/navigation";
import Slack from "@/generated/components/viz/Slack";
import { useSlackViewModel } from "@/hooks/viz/useSlackViewModel";

export default function VizSlackPage() {
  const router = useRouter();
  const { data } = useSlackViewModel(router);
  return <Slack data={data} />;
}
