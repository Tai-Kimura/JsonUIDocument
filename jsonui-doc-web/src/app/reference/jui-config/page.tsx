"use client";

import { useRouter } from "next/navigation";
import JuiConfig from "@/generated/components/reference/JuiConfig";
import { useJuiConfigViewModel } from "@/hooks/reference/useJuiConfigViewModel";

export default function ReferenceJuiConfigPage() {
  const router = useRouter();
  const { data } = useJuiConfigViewModel(router);
  return <JuiConfig data={data} />;
}
