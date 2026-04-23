"use client";

import { useRouter } from "next/navigation";
import Home from "@/generated/components/Home";
import { useHomeViewModel } from "@/generated/hooks/useHomeViewModel";

/**
 * Next.js App Router entry for "/". Threads the router into the generated
 * HomeViewModel hook and hands the resulting `data` to the generated Home
 * component.
 */
export default function HomePage() {
  const router = useRouter();
  const { data } = useHomeViewModel(router);
  return <Home data={data} />;
}
