"use client";

import { useRouter } from "next/navigation";
import Setup from "@/generated/components/viz/Setup";
import { useSetupViewModel } from "@/hooks/viz/useSetupViewModel";

export default function VizSetupPage() {
  const router = useRouter();
  const { data } = useSetupViewModel(router);
  return <Setup data={data} />;
}
