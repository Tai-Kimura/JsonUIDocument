"use client";

import { useRouter } from "next/navigation";
import WhySpecFirst from "@/generated/components/concepts/WhySpecFirst";
import { useWhySpecFirstViewModel } from "@/hooks/concepts/useWhySpecFirstViewModel";

/**
 * Next.js App Router entry for "/concepts/why-spec-first". Threads the
 * router into the hand-authored useWhySpecFirstViewModel hook and hands the
 * resulting data to the generated WhySpecFirst component.
 */
export default function ConceptsWhySpecFirstPage() {
  const router = useRouter();
  const { data } = useWhySpecFirstViewModel(router);
  return <WhySpecFirst data={data} />;
}
