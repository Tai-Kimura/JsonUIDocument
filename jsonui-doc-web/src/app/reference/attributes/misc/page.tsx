"use client";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  @generated AUTO-GENERATED FILE — DO NOT EDIT
// ║  Source:    scripts/build-attribute-reference.ts
// ║  Update docs/data/attribute-overrides/ and re-run `npm run build:attrs`.
// ╚══════════════════════════════════════════════════════════════════╝
import { useRouter } from "next/navigation";
import { useCategoryReference } from "@/hooks/reference/useCategoryReference";
import Misc from "@/generated/components/reference/attributes/Misc";

export default function Page() {
  const router = useRouter();
  const { data } = useCategoryReference(router, "misc");
  return <Misc data={data} />;
}
