"use client";

import { useRouter } from "next/navigation";
import Installation from "@/generated/components/learn/Installation";
import { useInstallationViewModel } from "@/hooks/learn/useInstallationViewModel";

/**
 * Next.js App Router entry for "/learn/installation". Threads the router
 * into the hand-authored useInstallationViewModel hook (see
 * src/hooks/learn/useInstallationViewModel.ts) and hands the resulting
 * `data` to the generated Installation component.
 */
export default function LearnInstallationPage() {
  const router = useRouter();
  const { data } = useInstallationViewModel(router);
  return <Installation data={data} />;
}
