"use client";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  @generated AUTO-GENERATED FILE — DO NOT EDIT
// ║  Source:    scripts/build-attribute-reference.ts
// ║  Update docs/data/attribute-overrides/ and re-run `npm run build:attrs`.
// ╚══════════════════════════════════════════════════════════════════╝
import { useRouter } from "next/navigation";
import { useComponentReference } from "@/hooks/reference/useComponentReference";
import Indicator from "@/generated/components/reference/components/Indicator";

export default function Page() {
  const router = useRouter();
  const { data } = useComponentReference(router, "Indicator");
  return <Indicator data={data} />;
}
