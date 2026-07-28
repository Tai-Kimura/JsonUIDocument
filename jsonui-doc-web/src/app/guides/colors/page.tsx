"use client";

import { useRouter } from "next/navigation";
import Colors from "@/generated/components/guides/Colors";
import { useColorsViewModel } from "@/hooks/guides/useColorsViewModel";

export default function GuidesColorsPage() {
  const router = useRouter();
  const { data } = useColorsViewModel(router);
  return <Colors data={data} />;
}
