"use client";

import { useRouter } from "next/navigation";
import DbSchemaCheck from "@/generated/components/concepts/DbSchemaCheck";
import { useDbSchemaCheckViewModel } from "@/hooks/concepts/useDbSchemaCheckViewModel";

export default function ConceptsDbSchemaCheckPage() {
  const router = useRouter();
  const { data } = useDbSchemaCheckViewModel(router);
  return <DbSchemaCheck data={data} />;
}
