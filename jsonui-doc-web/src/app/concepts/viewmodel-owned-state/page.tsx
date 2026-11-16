"use client";

import { useRouter } from "next/navigation";
import ViewmodelOwnedState from "@/generated/components/concepts/ViewmodelOwnedState";
import { useViewmodelOwnedStateViewModel } from "@/hooks/concepts/useViewmodelOwnedStateViewModel";

export default function ConceptsViewmodelOwnedStatePage() {
  const router = useRouter();
  const { data } = useViewmodelOwnedStateViewModel(router);
  return <ViewmodelOwnedState data={data} />;
}
