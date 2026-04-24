"use client";

import { useRouter } from "next/navigation";
import ValidationAndDrift from "@/generated/components/spec/ValidationAndDrift";
import { useSpecValidationAndDriftViewModel } from "@/hooks/spec/useSpecValidationAndDriftViewModel";

export default function SpecValidationAndDriftPage() {
  const router = useRouter();
  const { data } = useSpecValidationAndDriftViewModel(router);
  return <ValidationAndDrift data={data} />;
}
