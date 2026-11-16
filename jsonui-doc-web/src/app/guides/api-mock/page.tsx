"use client";

import { useRouter } from "next/navigation";
import ApiMock from "@/generated/components/guides/ApiMock";
import { useApiMockViewModel } from "@/hooks/guides/useApiMockViewModel";

export default function GuidesApiMockPage() {
  const router = useRouter();
  const { data } = useApiMockViewModel(router);
  return <ApiMock data={data} />;
}
