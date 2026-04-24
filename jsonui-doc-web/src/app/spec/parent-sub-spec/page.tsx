"use client";

import { useRouter } from "next/navigation";
import ParentSubSpec from "@/generated/components/spec/ParentSubSpec";
import { useSpecParentSubSpecViewModel } from "@/hooks/spec/useSpecParentSubSpecViewModel";

export default function SpecParentSubSpecPage() {
  const router = useRouter();
  const { data } = useSpecParentSubSpecViewModel(router);
  return <ParentSubSpec data={data} />;
}
