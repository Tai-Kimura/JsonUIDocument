"use client";

import { useRouter } from "next/navigation";
import VerifyingImplementationAgainstDocs from "@/generated/components/guides/VerifyingImplementationAgainstDocs";
import { useVerifyingImplementationAgainstDocsViewModel } from "@/hooks/guides/useVerifyingImplementationAgainstDocsViewModel";

export default function GuidesVerifyingImplementationAgainstDocsPage() {
  const router = useRouter();
  const { data } = useVerifyingImplementationAgainstDocsViewModel(router);
  return <VerifyingImplementationAgainstDocs data={data} />;
}
