"use client";

import { useRouter } from "next/navigation";
import ScreenComposition from "@/generated/components/concepts/ScreenComposition";
import { useScreenCompositionViewModel } from "@/hooks/concepts/useScreenCompositionViewModel";

export default function ConceptsScreenCompositionPage() {
  const router = useRouter();
  const { data } = useScreenCompositionViewModel(router);
  return <ScreenComposition data={data} />;
}
