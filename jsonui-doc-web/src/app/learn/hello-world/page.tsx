"use client";

import { useRouter } from "next/navigation";
import HelloWorld from "@/generated/components/learn/HelloWorld";
import { useHelloWorldViewModel } from "@/hooks/learn/useHelloWorldViewModel";

/**
 * Next.js App Router entry for "/learn/hello-world". Threads the router
 * into the hand-authored useHelloWorldViewModel hook (see
 * src/hooks/learn/useHelloWorldViewModel.ts) and hands the resulting
 * `data` to the generated HelloWorld component.
 */
export default function LearnHelloWorldPage() {
  const router = useRouter();
  const { data } = useHelloWorldViewModel(router);
  return <HelloWorld data={data} />;
}
