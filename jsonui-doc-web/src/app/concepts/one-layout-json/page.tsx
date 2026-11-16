"use client";

import { useRouter } from "next/navigation";
import OneLayoutJson from "@/generated/components/concepts/OneLayoutJson";
import { useOneLayoutJsonViewModel } from "@/hooks/concepts/useOneLayoutJsonViewModel";

export default function ConceptsOneLayoutJsonPage() {
  const router = useRouter();
  const { data } = useOneLayoutJsonViewModel(router);
  return <OneLayoutJson data={data} />;
}
