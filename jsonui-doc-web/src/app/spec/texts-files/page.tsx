"use client";

import { useRouter } from "next/navigation";
import TextsFiles from "@/generated/components/spec/TextsFiles";
import { useSpecTextsFilesViewModel } from "@/hooks/spec/useSpecTextsFilesViewModel";

export default function SpecTextsFilesPage() {
  const router = useRouter();
  const { data } = useSpecTextsFilesViewModel(router);
  return <TextsFiles data={data} />;
}
