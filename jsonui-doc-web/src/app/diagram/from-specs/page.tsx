"use client";

import { useRouter } from "next/navigation";
import FromSpecs from "@/generated/components/diagram/FromSpecs";
import { useFromSpecsViewModel } from "@/hooks/diagram/useFromSpecsViewModel";

export default function DiagramFromSpecsPage() {
  const router = useRouter();
  const { data } = useFromSpecsViewModel(router);
  return <FromSpecs data={data} />;
}
