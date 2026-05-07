"use client";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  @generated AUTO-GENERATED FILE — DO NOT EDIT
// ║  Source:    scripts/build-attribute-reference.ts
// ║  Update docs/data/attribute-overrides/ and re-run `npm run build:attrs`.
// ╚══════════════════════════════════════════════════════════════════╝
import { useRouter } from "next/navigation";
import { useCategoryReference } from "@/hooks/reference/useCategoryReference";
import Binding from "@/generated/components/reference/attributes/Binding";

export default function Page() {
  const router = useRouter();
  const { data } = useCategoryReference(router, "binding");
  return <Binding data={data} />;
}
