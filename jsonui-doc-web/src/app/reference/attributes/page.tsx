"use client";

import { useRouter } from "next/navigation";
import Attributes from "@/generated/components/reference/Attributes";
import { useAttributesViewModel } from "@/hooks/reference/useAttributesViewModel";

export default function ReferenceAttributesPage() {
  const router = useRouter();
  const { data } = useAttributesViewModel(router);
  return <Attributes data={data} />;
}
