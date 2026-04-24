"use client";

import { useRouter } from "next/navigation";
import ComponentSpec from "@/generated/components/spec/ComponentSpec";
import { useSpecComponentSpecViewModel } from "@/hooks/spec/useSpecComponentSpecViewModel";

export default function SpecComponentSpecPage() {
  const router = useRouter();
  const { data } = useSpecComponentSpecViewModel(router);
  return <ComponentSpec data={data} />;
}
