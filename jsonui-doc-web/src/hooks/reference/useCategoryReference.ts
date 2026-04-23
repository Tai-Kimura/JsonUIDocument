"use client";

// Hand-written hook (NOT regenerated).

import { useEffect, useRef, useState } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AttributeReferenceRepository } from "@/repository/AttributeReferenceRepository";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import type { ReferenceNextReadLink, ReferenceAttributeRow } from "@/hooks/reference/useComponentReference";

type Lang2 = { en: string; ja: string };

type CollectionSection<T> = { sections: Array<{ cells: { data: T[] } }> };

export type CategoryReferenceFetched = {
  category: string;
  title: string;
  description: Lang2;
  attributes: CollectionSection<ReferenceAttributeRow>;
  breakpoints: Record<string, unknown> | null;
  nextReadLinks: CollectionSection<ReferenceNextReadLink>;
};

const repository = new AttributeReferenceRepository();

function emptyCollection<T>(): CollectionDataSource<T> {
  return new CollectionDataSource<T>([]);
}

function toDataSource<T>(resp?: CollectionSection<T>): CollectionDataSource<T> {
  const sections = resp?.sections ?? [];
  return new CollectionDataSource<T>(sections);
}

function emptyData(category: string) {
  return {
    category,
    title: category,
    description: "",
    attributes: emptyCollection<ReferenceAttributeRow>(),
    nextReadLinks: emptyCollection<ReferenceNextReadLink>(),
  };
}

function pick(lang: Lang2 | null | string | undefined, fallback = ""): string {
  if (!lang) return fallback;
  if (typeof lang === "string") return lang;
  return lang.en ?? fallback;
}

export function useCategoryReference(router: AppRouterInstance, category: string) {
  const [data, setData] = useState(() => emptyData(category));
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (fetchedRef.current === category) return;
    fetchedRef.current = category;
    let cancelled = false;
    repository
      .fetchCategory(category)
      .then((resp: CategoryReferenceFetched) => {
        if (cancelled) return;
        setData({
          category: resp.category,
          title: resp.title,
          description: pick(resp.description),
          attributes: toDataSource(resp.attributes),
          nextReadLinks: toDataSource(resp.nextReadLinks),
        });
      })
      .catch((err) => {
        console.error(`useCategoryReference(${category}):`, err);
      });
    return () => { cancelled = true; };
  }, [category]);

  return {
    data: {
      ...data,
      onNavigateBack: () => router.push("/reference/attributes"),
    },
  };
}
