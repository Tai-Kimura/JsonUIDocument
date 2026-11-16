"use client";

import { useRouter } from "next/navigation";
import Components from "@/generated/components/reference/Components";
import { useComponentsViewModel } from "@/hooks/reference/useComponentsViewModel";

export default function ReferenceComponentsPage() {
  const router = useRouter();
  const { data } = useComponentsViewModel(router);
  return <Components data={data} />;
}
