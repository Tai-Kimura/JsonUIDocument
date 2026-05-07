// Hand-written repository. Not regenerated.
// Fetches the merged attribute reference data produced by
// scripts/build-attribute-reference.ts from /public/data/attribute-reference/.
//
// The response shapes match ComponentReferenceFetched / CategoryReferenceFetched in
// src/hooks/reference/*.

import type { ComponentReferenceFetched } from "@/hooks/reference/useComponentReference";
import type { CategoryReferenceFetched } from "@/hooks/reference/useCategoryReference";

function kebab(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

export class AttributeReferenceRepository {
  async fetchComponent(name: string): Promise<ComponentReferenceFetched> {
    const res = await fetch(`/data/attribute-reference/components/${kebab(name)}.json`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`fetchComponent(${name}) -> ${res.status}`);
    }
    return (await res.json()) as ComponentReferenceFetched;
  }

  async fetchCategory(category: string): Promise<CategoryReferenceFetched> {
    const res = await fetch(`/data/attribute-reference/attributes/${category}.json`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`fetchCategory(${category}) -> ${res.status}`);
    }
    return (await res.json()) as CategoryReferenceFetched;
  }
}
