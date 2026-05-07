"use client";

// Hand-written hook (NOT regenerated).

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AttributeReferenceRepository } from "@/repository/AttributeReferenceRepository";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";
import type {
  ReferenceNextReadLink,
  ReferenceAttributeRow,
  ReferenceBadge,
  ReferenceTocEntry,
} from "@/hooks/reference/useComponentReference";

// Mirrors useComponentReference.pickLangDeep — flattens `{en, ja}` Lang2
// objects inside the fetched runtime JSON to the active language's string.
function pickLangDeep(value: unknown, lang: "en" | "ja"): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => pickLangDeep(v, lang));
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);
  const isLang2 = keys.length > 0 && keys.every((k) => k === "en" || k === "ja");
  if (isLang2) {
    return (obj[lang] ?? obj.en ?? obj.ja ?? "") as string;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = pickLangDeep(v, lang);
  return out;
}

type Lang2 = { en: string; ja: string };

type CollectionSection<T> = { sections: Array<{ cells: { data: T[] } }> };

export type ReferenceOverviewRow = {
  id: string;
  name: string;
  type: string;
  summary: string;
  anchorUrl: string;
};

export type ReferenceSubgroupChip = {
  id: string;
  key: string;
  label: string;
  anchorUrl: string;
};

export type CategoryReferenceFetched = {
  category: string;
  title: string;
  description: Lang2;
  attributes: CollectionSection<ReferenceAttributeRow>;
  breakpoints: Record<string, unknown> | null;
  nextReadLinks: CollectionSection<ReferenceNextReadLink>;

  // NEW — shared header
  kicker?: string;
  kickerParentLabel?: string;
  badges?: CollectionSection<ReferenceBadge>;
  copyTypeVisibility?: string;
  aliasCalloutVisibility?: string;
  aliasOf?: string | null;
  aliasLinkUrl?: string;
  aliasNotice?: Lang2 | null;

  // NEW — overview table
  overviewRows?: CollectionSection<ReferenceOverviewRow>;

  // NEW — subgroups
  subgroups?: CollectionSection<ReferenceSubgroupChip>;
  subgroupsVisibility?: string;
  // Dynamic subgroup keys (subgroupTypography, subgroupFill, ...) are accessed
  // via the catch-all below at runtime.

  // NEW — TOC. Plain array (TocItem[] — TableOfContents.items contract).
  tocEntries?: ReferenceTocEntry[];
};

const repository = new AttributeReferenceRepository();

function emptyCollection<T>(): CollectionDataSource<T> {
  return new CollectionDataSource<T>([]);
}

function toDataSource<T>(resp?: CollectionSection<T>): CollectionDataSource<T> {
  const sections = resp?.sections ?? [];
  return new CollectionDataSource<T>(sections);
}

// Attaches a url-based click handler to each row of a CollectionSection.
// Used for next-read cards (which declare `onNavigate: () -> Void` in the cell
// data block); the runtime JSON can only ship `url` so the handler is
// synthesized here.
function wrapWithHandler<T extends { url?: string }>(
  resp: CollectionSection<T> | undefined,
  handlerKey: string,
  factory: (row: T) => () => void,
): CollectionDataSource<T> {
  const sections = (resp?.sections ?? []).map((sec) => ({
    cells: {
      data: sec.cells.data.map((row) => ({
        ...row,
        [handlerKey]: factory(row),
      })),
    },
  }));
  return new CollectionDataSource<T>(sections);
}

function emptyData(category: string) {
  return {
    category,
    title: category,
    description: "",

    kicker: "Attribute category · Reference",
    kickerParentLabel: "Attributes",
    badges: emptyCollection<ReferenceBadge>(),
    copyTypeVisibility: "gone",
    aliasCalloutVisibility: "gone",
    aliasOf: null as string | null,
    aliasLinkUrl: "",
    aliasNotice: "",

    overviewRows: emptyCollection<ReferenceOverviewRow>(),

    subgroups: emptyCollection<ReferenceSubgroupChip>(),
    subgroupsVisibility: "gone",

    tocEntries: [] as ReferenceTocEntry[],

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

  useEffect(() => {
    setData(emptyData(category));
    let cancelled = false;
    const lang = StringManager.language === "ja" ? "ja" : "en";
    repository
      .fetchCategory(category)
      .then((rawResp: CategoryReferenceFetched) => {
        if (cancelled) return;
        const resp = pickLangDeep(rawResp, lang) as CategoryReferenceFetched;

        // Wrap any dynamic subgroup<Key> fields that arrived on the response.
        const dynamicSubgroupFields: Record<string, CollectionDataSource<ReferenceAttributeRow>> = {};
        const respAsRecord = resp as unknown as Record<string, unknown>;
        for (const key of Object.keys(respAsRecord)) {
          if (key.startsWith("subgroup") && key !== "subgroups" && key !== "subgroupsVisibility") {
            dynamicSubgroupFields[key] = toDataSource(
              respAsRecord[key] as CollectionSection<ReferenceAttributeRow> | undefined,
            );
          }
        }

        setData({
          category: resp.category,
          title: resp.title,
          description: pick(resp.description),

          kicker: resp.kicker ?? "Attribute category · Reference",
          kickerParentLabel: resp.kickerParentLabel ?? "Attributes",
          badges: toDataSource(resp.badges),
          copyTypeVisibility: resp.copyTypeVisibility ?? "gone",
          aliasCalloutVisibility: resp.aliasCalloutVisibility ?? "gone",
          aliasOf: resp.aliasOf ?? null,
          aliasLinkUrl: resp.aliasLinkUrl ?? "",
          aliasNotice: pick(resp.aliasNotice),

          overviewRows: toDataSource(resp.overviewRows),

          subgroups: toDataSource(resp.subgroups),
          subgroupsVisibility: resp.subgroupsVisibility ?? "gone",

          tocEntries: resp.tocEntries ?? [],

          attributes: toDataSource(resp.attributes),
          nextReadLinks: wrapWithHandler(
            resp.nextReadLinks,
            "onNavigate",
            (row) => () => router.push(row.url),
          ),
          ...dynamicSubgroupFields,
        });
      })
      .catch((err) => {
        console.error(`useCategoryReference(${category}):`, err);
      });
    return () => { cancelled = true; };
  }, [category]);

  const onNavigateBreadcrumb = useCallback(() => {
    router.push("/reference/attributes");
  }, [router]);

  const onCopyTypeName = useCallback(() => {
    // No-op on category pages — kept so the shared header's data contract is satisfied.
  }, []);

  return useMemo(
    () => ({
      data: {
        ...data,
        onNavigateBack: onNavigateBreadcrumb,
        onNavigateBreadcrumb,
        onCopyTypeName,
      },
    }),
    [data, onNavigateBreadcrumb, onCopyTypeName],
  );
}
