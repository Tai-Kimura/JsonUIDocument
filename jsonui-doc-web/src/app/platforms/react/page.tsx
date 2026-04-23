"use client";

import { useRouter } from "next/navigation";
import Rjui from "@/generated/components/platforms/Rjui";
import { useRjuiViewModel } from "@/hooks/platforms/useRjuiViewModel";

export default function PlatformsReactPage() {
  const router = useRouter();
  const { data } = useRjuiViewModel(router);
  return <Rjui data={data} />;
}
