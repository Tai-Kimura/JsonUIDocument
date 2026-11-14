"use client";

import { useRouter } from "next/navigation";
import TextSize from "@/generated/components/guides/TextSize";
import { useTextSizeViewModel } from "@/hooks/guides/useTextSizeViewModel";

export default function GuidesTextSizePage() {
  const router = useRouter();
  const { data } = useTextSizeViewModel(router);
  return <TextSize data={data} />;
}
