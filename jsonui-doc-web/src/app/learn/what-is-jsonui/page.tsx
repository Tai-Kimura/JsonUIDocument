"use client";

import { useRouter } from "next/navigation";
import WhatIsJsonui from "@/generated/components/learn/WhatIsJsonui";
import { useWhatIsJsonuiViewModel } from "@/hooks/learn/useWhatIsJsonuiViewModel";

export default function LearnWhatIsJsonuiPage() {
  const router = useRouter();
  const { data } = useWhatIsJsonuiViewModel(router);
  return <WhatIsJsonui data={data} />;
}
