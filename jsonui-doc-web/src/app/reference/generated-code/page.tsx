"use client";

import { useRouter } from "next/navigation";
import GeneratedCode from "@/generated/components/reference/GeneratedCode";
import { useGeneratedCodeViewModel } from "@/hooks/reference/useGeneratedCodeViewModel";

export default function ReferenceGeneratedCodePage() {
  const router = useRouter();
  const { data } = useGeneratedCodeViewModel(router);
  return <GeneratedCode data={data} />;
}
