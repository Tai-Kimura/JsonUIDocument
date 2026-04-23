"use client";

// Hand-written hook (NOT regenerated). Pairs with the auto-generated
// page.tsx files at src/app/reference/components/<slug>/page.tsx.
// Data is fetched from public/data/attribute-reference/components/<slug>.json
// by AttributeReferenceRepository.

import { useEffect, useRef, useState } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AttributeReferenceRepository } from "@/repository/AttributeReferenceRepository";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";

type Lang2 = { en: string; ja: string };

export type ReferenceAttributeRow = {
  id: string;
  name: string;
  type: string;
  required: boolean;
  description: string;
  note?: Lang2;
  platformDiff?: Record<string, string>;
  platform?: string;
  bindingDirection?: string;
  enumValues?: string[];
  aliases?: string[];
};

export type ReferenceCodeExample = {
  id: string;
  title: Lang2;
  language: string;
  code: string;
  note?: Lang2;
};

export type ReferenceRelatedPill = { id: string; name: string; url: string };

export type ReferenceNextReadLink = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
};

// Shape of the runtime JSON file produced by build-attribute-reference.ts.
export type ComponentReferenceFetched = {
  component: string;
  kebab: string;
  aliasOf: string | null;
  title: string;
  description: Lang2;
  usage: Lang2 | null;
  aliasNotice: Lang2 | null;
  attributes: CollectionSection<ReferenceAttributeRow>;
  examples: CollectionSection<ReferenceCodeExample>;
  relatedComponents: CollectionSection<ReferenceRelatedPill>;
  nextReadLinks: CollectionSection<ReferenceNextReadLink>;
};

type CollectionSection<T> = { sections: Array<{ cells: { data: T[] } }> };

const repository = new AttributeReferenceRepository();

function emptyCollection<T>(): CollectionDataSource<T> {
  return new CollectionDataSource<T>([]);
}

function toDataSource<T>(resp?: CollectionSection<T>): CollectionDataSource<T> {
  const sections = resp?.sections ?? [];
  return new CollectionDataSource<T>(sections);
}

function emptyData(componentName: string) {
  return {
    component: componentName,
    kebab: componentName.toLowerCase(),
    aliasOf: null as string | null,
    title: componentName,
    description: "",
    usage: "",
    aliasNotice: "",
    attributes: emptyCollection<ReferenceAttributeRow>(),
    examples: emptyCollection<ReferenceCodeExample>(),
    relatedComponents: emptyCollection<ReferenceRelatedPill>(),
    nextReadLinks: emptyCollection<ReferenceNextReadLink>(),
  };
}

function pick(lang: Lang2 | null, fallback = ""): string {
  if (!lang) return fallback;
  if (typeof lang === "string") return lang;
  return lang.en ?? fallback;
}

export function useComponentReference(router: AppRouterInstance, componentName: string) {
  const [data, setData] = useState(() => emptyData(componentName));
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (fetchedRef.current === componentName) return;
    fetchedRef.current = componentName;
    let cancelled = false;
    repository
      .fetchComponent(componentName)
      .then((resp: ComponentReferenceFetched) => {
        if (cancelled) return;
        setData({
          component: resp.component,
          kebab: resp.kebab,
          aliasOf: resp.aliasOf,
          title: resp.title,
          description: pick(resp.description),
          usage: pick(resp.usage),
          aliasNotice: pick(resp.aliasNotice),
          attributes: toDataSource(resp.attributes),
          examples: toDataSource(resp.examples),
          relatedComponents: toDataSource(resp.relatedComponents),
          nextReadLinks: toDataSource(resp.nextReadLinks),
        });
      })
      .catch((err) => {
        console.error(`useComponentReference(${componentName}):`, err);
      });
    return () => { cancelled = true; };
  }, [componentName]);

  return {
    data: {
      ...data,
      onNavigateBack: () => router.push("/reference/components"),
    },
  };
}
