"use client";

import { useRouter } from "next/navigation";
import Tests from "@/generated/components/viz/Tests";
import { useTestsViewModel } from "@/hooks/viz/useTestsViewModel";

export default function VizTestsPage() {
  const router = useRouter();
  const { data } = useTestsViewModel(router);
  return <Tests data={data} />;
}
