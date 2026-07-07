"use client";

import { useRouter } from "next/navigation";
import ImplementationContractCheck from "@/generated/components/concepts/ImplementationContractCheck";
import { useImplementationContractCheckViewModel } from "@/hooks/concepts/useImplementationContractCheckViewModel";

export default function ConceptsImplementationContractCheckPage() {
  const router = useRouter();
  const { data } = useImplementationContractCheckViewModel(router);
  return <ImplementationContractCheck data={data} />;
}
