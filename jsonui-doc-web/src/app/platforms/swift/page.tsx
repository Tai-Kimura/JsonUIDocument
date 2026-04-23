"use client";

import { useRouter } from "next/navigation";
import Swift from "@/generated/components/platforms/Swift";
import { useSwiftViewModel } from "@/hooks/platforms/useSwiftViewModel";

export default function PlatformsSwiftPage() {
  const router = useRouter();
  const { data } = useSwiftViewModel(router);
  return <Swift data={data} />;
}
