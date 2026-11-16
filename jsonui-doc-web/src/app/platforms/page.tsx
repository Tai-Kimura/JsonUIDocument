"use client";

import { useRouter } from "next/navigation";
import { PlatformsIndex } from "@/generated/components/PlatformsIndex";
import { usePlatformsIndexViewModel } from "@/hooks/usePlatformsIndexViewModel";

export default function PlatformsIndexPage() {
  const router = useRouter();
  const { data } = usePlatformsIndexViewModel(router);
  return <PlatformsIndex data={data} />;
}
