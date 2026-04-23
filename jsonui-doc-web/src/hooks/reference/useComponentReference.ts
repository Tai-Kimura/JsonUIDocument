"use client";

// Hand-written hook (NOT regenerated). Pairs with the auto-generated
// page.tsx files at src/app/reference/components/<slug>/page.tsx.
// Data is fetched from public/data/attribute-reference/components/<slug>.json
// by AttributeReferenceRepository.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AttributeReferenceRepository } from "@/repository/AttributeReferenceRepository";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

// Walks an object / array tree and replaces every `{en, ja}` Lang2 object with
// the string for the active language. The build script ships bilingual runtime
// JSON so the reference pages localize in sync with the topbar toggle.
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

type ReferenceExampleVariant = { language: string; label?: string; code: string };

export type ReferenceCodeExample = {
  id: string;
  anchorId?: string;
  title: Lang2 | string;
  description?: Lang2 | string;
  descriptionVisibility?: string;
  filePath?: string;
  filePathVisibility?: string;
  tabs?: CollectionSection<ReferenceTabRow>;
  tabsVisibility?: string;
  languagePill?: string;
  languagePillVisibility?: string;
  activeLanguage: string;
  activeCode: string;
  note?: Lang2 | string;
  noteVisibility?: string;
  _variants?: ReferenceExampleVariant[];
  // legacy
  language?: string;
  code?: string;
};

export type ReferenceTabRow = {
  id: string;
  label: string;
  background: string;
  borderColor: string;
  fontColor: string;
  fontWeight: string;
};

export type ReferenceRelatedCard = { id: string; name: string; hint?: string; url: string };

export type ReferenceNextReadLink = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
};

export type ReferenceBadge = { id: string; label: string; supported: string };
export type ReferenceCategoryChip = { id: string; label: string; anchorUrl: string };
export type ReferenceTocEntry = { id: string; label: string; anchor: string; level?: number };

// Shape of the runtime JSON file produced by build-attribute-reference.ts.
export type ComponentReferenceFetched = {
  component: string;
  kebab: string;
  aliasOf: string | null;
  title: string;
  description: Lang2;
  usage: Lang2 | null;
  aliasNotice: Lang2 | null;

  // NEW — shared page header
  kicker?: string;
  kickerParentLabel?: string;
  badges?: CollectionSection<ReferenceBadge>;
  copyTypeVisibility?: string;
  aliasCalloutVisibility?: string;
  aliasLinkUrl?: string;

  // NEW — at a glance
  canonicalCode?: string;
  canonicalLanguage?: string;
  statRequired?: string;
  statOptional?: string;
  statEvents?: string;
  statRequiredText?: string;
  statOptionalText?: string;
  statEventsText?: string;

  // NEW — usage visibility
  usageVisibility?: string;

  // NEW — per-category attrs + chip list
  attributeCategories?: CollectionSection<ReferenceCategoryChip>;
  attributesCommon?: CollectionSection<ReferenceAttributeRow>;
  attributesStyle?: CollectionSection<ReferenceAttributeRow>;
  attributesLayout?: CollectionSection<ReferenceAttributeRow>;
  attributesSpacing?: CollectionSection<ReferenceAttributeRow>;
  attributesAlignment?: CollectionSection<ReferenceAttributeRow>;
  attributesState?: CollectionSection<ReferenceAttributeRow>;
  attributesBinding?: CollectionSection<ReferenceAttributeRow>;
  attributesEvent?: CollectionSection<ReferenceAttributeRow>;
  attributesResponsive?: CollectionSection<ReferenceAttributeRow>;
  attributesMisc?: CollectionSection<ReferenceAttributeRow>;
  groupCommonVisibility?: string;
  groupStyleVisibility?: string;
  groupLayoutVisibility?: string;
  groupSpacingVisibility?: string;
  groupAlignmentVisibility?: string;
  groupStateVisibility?: string;
  groupBindingVisibility?: string;
  groupEventVisibility?: string;
  groupResponsiveVisibility?: string;
  groupMiscVisibility?: string;

  // NEW — TOC. Plain array (TocItem[] — TableOfContents.items contract).
  tocEntries?: ReferenceTocEntry[];

  // Existing (enriched)
  attributes: CollectionSection<ReferenceAttributeRow>;
  examples: CollectionSection<ReferenceCodeExample>;
  relatedComponents: CollectionSection<ReferenceRelatedCard>;
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

// Attaches a click/navigation handler to each row of a CollectionSection.
// Cells like `reference_related_pill` declare `onClick: () -> Void` and
// `next_step_card` declares `onNavigate: () -> Void` in their data blocks;
// the handler is synthesized here from each row's `url` field since runtime
// JSON can't ship function references.
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

function emptyData(componentName: string) {
  return {
    component: componentName,
    kebab: componentName.toLowerCase(),
    aliasOf: null as string | null,
    title: componentName,
    description: "",
    usage: "",
    aliasNotice: "",

    // shared header defaults
    kicker: "Component · Reference",
    kickerParentLabel: "Components",
    badges: emptyCollection<ReferenceBadge>(),
    copyTypeVisibility: "gone",
    aliasCalloutVisibility: "gone",
    aliasLinkUrl: "",

    // at a glance defaults
    canonicalCode: "",
    canonicalLanguage: "json",
    statRequired: "0",
    statOptional: "0",
    statEvents: "0",
    statRequiredText: "0 required",
    statOptionalText: "0 optional",
    statEventsText: "0 events",

    usageVisibility: "gone",

    // per-category defaults
    attributeCategories: emptyCollection<ReferenceCategoryChip>(),
    attributesCommon: emptyCollection<ReferenceAttributeRow>(),
    attributesStyle: emptyCollection<ReferenceAttributeRow>(),
    attributesLayout: emptyCollection<ReferenceAttributeRow>(),
    attributesSpacing: emptyCollection<ReferenceAttributeRow>(),
    attributesAlignment: emptyCollection<ReferenceAttributeRow>(),
    attributesState: emptyCollection<ReferenceAttributeRow>(),
    attributesBinding: emptyCollection<ReferenceAttributeRow>(),
    attributesEvent: emptyCollection<ReferenceAttributeRow>(),
    attributesResponsive: emptyCollection<ReferenceAttributeRow>(),
    attributesMisc: emptyCollection<ReferenceAttributeRow>(),
    groupCommonVisibility: "gone",
    groupStyleVisibility: "gone",
    groupLayoutVisibility: "gone",
    groupSpacingVisibility: "gone",
    groupAlignmentVisibility: "gone",
    groupStateVisibility: "gone",
    groupBindingVisibility: "gone",
    groupEventVisibility: "gone",
    groupResponsiveVisibility: "gone",
    groupMiscVisibility: "gone",

    tocEntries: [] as ReferenceTocEntry[],

    attributes: emptyCollection<ReferenceAttributeRow>(),
    examples: emptyCollection<ReferenceCodeExample>(),
    relatedComponents: emptyCollection<ReferenceRelatedCard>(),
    nextReadLinks: emptyCollection<ReferenceNextReadLink>(),
  };
}

function pick(lang: Lang2 | null | string | undefined, fallback = ""): string {
  if (!lang) return fallback;
  if (typeof lang === "string") return lang;
  return lang.en ?? fallback;
}

// Rebuild the examples collection with the given active-language per example id.
// Used when a per-example tab click changes which variant is active.
function rebuildExamples(
  source: CollectionSection<ReferenceCodeExample> | undefined,
  activeByExample: Record<string, string>,
): CollectionDataSource<ReferenceCodeExample> {
  const sections = (source?.sections ?? []).map((sec) => ({
    cells: {
      data: sec.cells.data.map((ex) => {
        const variants = ex._variants;
        if (!variants || variants.length <= 1) return ex;
        const activeLang = activeByExample[ex.id] ?? variants[0].language;
        const active = variants.find((v) => v.language === activeLang) ?? variants[0];
        return {
          ...ex,
          activeLanguage: active.language,
          activeCode: active.code,
          tabs: {
            sections: [
              {
                cells: {
                  data: variants.map((v, idx) => {
                    const isActive = v.language === active.language;
                    return {
                      id: `tab_${idx}_${v.language}`,
                      label: v.label ?? v.language,
                      background: isActive ? "var(--color-code_surface)" : "var(--color-surface)",
                      borderColor: isActive ? "var(--color-code_surface)" : "var(--color-border)",
                      fontColor: isActive ? "var(--color-chrome_ink)" : "var(--color-ink_muted)",
                      fontWeight: isActive ? "semibold" : "normal",
                    };
                  }),
                },
              },
            ],
          },
        };
      }),
    },
  }));
  return new CollectionDataSource<ReferenceCodeExample>(sections);
}

export function useComponentReference(router: AppRouterInstance, componentName: string) {
  const [data, setData] = useState(() => emptyData(componentName));
  const [activeByExample, setActiveByExample] = useState<Record<string, string>>({});
  const rawRef = useRef<ComponentReferenceFetched | null>(null);

  useEffect(() => {
    setData(emptyData(componentName));
    setActiveByExample({});
    rawRef.current = null;
    let cancelled = false;
    const lang = StringManager.language === "ja" ? "ja" : "en";
    repository
      .fetchComponent(componentName)
      .then((rawResp: ComponentReferenceFetched) => {
        if (cancelled) return;
        const resp = pickLangDeep(rawResp, lang) as ComponentReferenceFetched;
        rawRef.current = resp;
        setData({
          component: resp.component,
          kebab: resp.kebab,
          aliasOf: resp.aliasOf,
          title: resp.title,
          description: pick(resp.description),
          usage: pick(resp.usage),
          aliasNotice: pick(resp.aliasNotice),

          kicker: resp.kicker ?? "Component · Reference",
          kickerParentLabel: resp.kickerParentLabel ?? "Components",
          badges: toDataSource(resp.badges),
          copyTypeVisibility: resp.copyTypeVisibility ?? "visible",
          aliasCalloutVisibility: resp.aliasCalloutVisibility ?? "gone",
          aliasLinkUrl: resp.aliasLinkUrl ?? "",

          canonicalCode: resp.canonicalCode ?? "",
          canonicalLanguage: resp.canonicalLanguage ?? "json",
          statRequired: resp.statRequired ?? "0",
          statOptional: resp.statOptional ?? "0",
          statEvents: resp.statEvents ?? "0",
          statRequiredText: resp.statRequiredText ?? `${resp.statRequired ?? "0"} required`,
          statOptionalText: resp.statOptionalText ?? `${resp.statOptional ?? "0"} optional`,
          statEventsText: resp.statEventsText ?? `${resp.statEvents ?? "0"} events`,

          usageVisibility: resp.usageVisibility ?? (resp.usage ? "visible" : "gone"),

          attributeCategories: toDataSource(resp.attributeCategories),
          attributesCommon: toDataSource(resp.attributesCommon),
          attributesStyle: toDataSource(resp.attributesStyle),
          attributesLayout: toDataSource(resp.attributesLayout),
          attributesSpacing: toDataSource(resp.attributesSpacing),
          attributesAlignment: toDataSource(resp.attributesAlignment),
          attributesState: toDataSource(resp.attributesState),
          attributesBinding: toDataSource(resp.attributesBinding),
          attributesEvent: toDataSource(resp.attributesEvent),
          attributesResponsive: toDataSource(resp.attributesResponsive),
          attributesMisc: toDataSource(resp.attributesMisc),
          groupCommonVisibility: resp.groupCommonVisibility ?? "gone",
          groupStyleVisibility: resp.groupStyleVisibility ?? "gone",
          groupLayoutVisibility: resp.groupLayoutVisibility ?? "gone",
          groupSpacingVisibility: resp.groupSpacingVisibility ?? "gone",
          groupAlignmentVisibility: resp.groupAlignmentVisibility ?? "gone",
          groupStateVisibility: resp.groupStateVisibility ?? "gone",
          groupBindingVisibility: resp.groupBindingVisibility ?? "gone",
          groupEventVisibility: resp.groupEventVisibility ?? "gone",
          groupResponsiveVisibility: resp.groupResponsiveVisibility ?? "gone",
          groupMiscVisibility: resp.groupMiscVisibility ?? "gone",

          tocEntries: resp.tocEntries ?? [],

          attributes: toDataSource(resp.attributes),
          examples: rebuildExamples(resp.examples, {}),
          relatedComponents: wrapWithHandler(
            resp.relatedComponents,
            "onClick",
            (row) => () => router.push(row.url),
          ),
          nextReadLinks: wrapWithHandler(
            resp.nextReadLinks,
            "onNavigate",
            (row) => () => router.push(row.url),
          ),
        });
      })
      .catch((err) => {
        console.error(`useComponentReference(${componentName}):`, err);
      });
    return () => { cancelled = true; };
  }, [componentName]);

  // Rebuild examples whenever the active-language map changes.
  useEffect(() => {
    if (!rawRef.current) return;
    setData((prev) => ({
      ...prev,
      examples: rebuildExamples(rawRef.current!.examples, activeByExample),
    }));
  }, [activeByExample]);

  const onSelectTab = useCallback((exampleId: string, language: string) => {
    setActiveByExample((prev) => ({ ...prev, [exampleId]: language }));
  }, []);

  const onCopyTypeName = useCallback(() => {
    const name = rawRef.current?.component ?? componentName;
    const text = `"type": "${name}"`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch((e) => console.error("copy:", e));
    }
  }, [componentName]);

  const onNavigateBreadcrumb = useCallback(() => {
    router.push("/reference/components");
  }, [router]);

  return useMemo(
    () => ({
      data: {
        ...data,
        onNavigateBack: onNavigateBreadcrumb,
        onNavigateBreadcrumb,
        onCopyTypeName,
        onSelectTab,
      },
    }),
    [data, onNavigateBreadcrumb, onCopyTypeName, onSelectTab],
  );
}
