"use client";

import { useRouter } from "next/navigation";
import Kotlin from "@/generated/components/platforms/Kotlin";
import { useKotlinViewModel } from "@/hooks/platforms/useKotlinViewModel";

export default function PlatformsKotlinPage() {
  const router = useRouter();
  const { data } = useKotlinViewModel(router);
  return <Kotlin data={data} />;
}
