"use client";

import { useRouter } from "next/navigation";
import CustomTypes from "@/generated/components/spec/CustomTypes";
import { useSpecCustomTypesViewModel } from "@/hooks/spec/useSpecCustomTypesViewModel";

export default function SpecCustomTypesPage() {
  const router = useRouter();
  const { data } = useSpecCustomTypesViewModel(router);
  return <CustomTypes data={data} />;
}
