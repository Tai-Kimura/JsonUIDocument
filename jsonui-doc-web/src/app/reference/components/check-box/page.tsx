"use client";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  @generated AUTO-GENERATED FILE — DO NOT EDIT
// ║  Source:    scripts/build-attribute-reference.ts
// ║  Update docs/data/attribute-overrides/ and re-run `npm run build:attrs`.
// ╚══════════════════════════════════════════════════════════════════╝
import { useRouter } from "next/navigation";
import { useComponentReference } from "@/hooks/reference/useComponentReference";
import CheckBox from "@/generated/components/reference/components/CheckBox";

export default function Page() {
  const router = useRouter();
  const { data } = useComponentReference(router, "CheckBox");
  return <CheckBox data={data} />;
}
