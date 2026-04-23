"use client";

import { useRouter } from "next/navigation";
import JsonSchema from "@/generated/components/reference/JsonSchema";
import { useJsonSchemaViewModel } from "@/hooks/reference/useJsonSchemaViewModel";

export default function ReferenceJsonSchemaPage() {
  const router = useRouter();
  const { data } = useJsonSchemaViewModel(router);
  return <JsonSchema data={data} />;
}
