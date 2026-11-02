"use client";

import { useRouter } from "next/navigation";
import SlackSetup from "@/generated/components/viz/SlackSetup";
import { useSlackSetupViewModel } from "@/hooks/viz/useSlackSetupViewModel";

export default function VizSlackSetupPage() {
  const router = useRouter();
  const { data } = useSlackSetupViewModel(router);
  return <SlackSetup data={data} />;
}
