"use client";

import { useRouter } from "next/navigation";
import Codex from "@/generated/components/viz/Codex";
import { useCodexViewModel } from "@/hooks/viz/useCodexViewModel";

export default function VizCodexPage() {
  const router = useRouter();
  const { data } = useCodexViewModel(router);
  return <Codex data={data} />;
}
