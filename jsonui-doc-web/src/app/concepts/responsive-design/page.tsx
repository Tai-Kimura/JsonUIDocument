"use client";

import { useRouter } from "next/navigation";
import ResponsiveDesign from "@/generated/components/concepts/ResponsiveDesign";
import { useResponsiveDesignViewModel } from "@/hooks/concepts/useResponsiveDesignViewModel";

export default function ConceptsResponsiveDesignPage() {
  const router = useRouter();
  const { data } = useResponsiveDesignViewModel(router);
  return <ResponsiveDesign data={data} />;
}
