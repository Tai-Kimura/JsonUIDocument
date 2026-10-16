"use client";

import { useRouter } from "next/navigation";
import InitialState from "@/generated/components/guides/InitialState";
import { useInitialStateViewModel } from "@/hooks/guides/useInitialStateViewModel";

export default function GuidesInitialStatePage() {
  const router = useRouter();
  const { data } = useInitialStateViewModel(router);
  return <InitialState data={data} />;
}
