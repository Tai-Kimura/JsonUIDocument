// ViewModel for Reference > Attribute reference.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AttributesData } from "@/generated/data/AttributesData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface CatalogCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

interface NextReadCell extends CatalogCell {}

const CATEGORY_CATALOG: Array<{ slug: string; name: string; description: string }> = [
  { slug: "layout",     name: "Layout",     description: "Size and axis behavior: width / height / weight / aspectRatio." },
  { slug: "spacing",    name: "Spacing",    description: "Inner (padding) and outer (margin) empty space around components." },
  { slug: "alignment",  name: "Alignment",  description: "Where a component sits within its parent and relative to siblings." },
  { slug: "state",      name: "State",      description: "Visibility, enabled / alpha, and interaction gate attributes." },
  { slug: "binding",    name: "Binding",    description: "@{}, @string/, @event — connect JSON to ViewModel fields." },
  { slug: "event",      name: "Event",      description: "onClick / onLongPress / onAppear — bind user interactions to the ViewModel." },
  { slug: "style",      name: "Style",      description: "Background / border / cornerRadius / shadow and style preset." },
  { slug: "responsive", name: "Responsive", description: "platforms filter and breakpoint-specific overrides." },
  { slug: "misc",       name: "Misc",       description: "Identity / include / partial and other meta attributes." },
];

export class AttributesViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => AttributesData;
  protected _setData: (
    data: AttributesData | ((prev: AttributesData) => AttributesData),
  ) => void;

  get data(): AttributesData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => AttributesData,
    setData: (data: AttributesData | ((prev: AttributesData) => AttributesData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<AttributesData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<AttributesData>) => { this.updateData(vars); };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateReference: () => this.navigate("/"),
    });
  };

  onAppear = () => {
    const catalog: CatalogCell[] = CATEGORY_CATALOG.map((c) => {
      const url = `/reference/attributes/${c.slug}`;
      return {
        id: `cat_${c.slug}`,
        titleKey: c.name,
        descriptionKey: c.description,
        url,
        onNavigate: () => this.navigate(url),
      };
    });

    const nextReads: NextReadCell[] = [
      {
        id: "next_components",
        titleKey: this.s("next_components_title"),
        descriptionKey: this.s("next_components_description"),
        url: "/reference/components",
        onNavigate: () => this.navigate("/reference/components"),
      },
      {
        id: "next_json_schema",
        titleKey: this.s("next_json_schema_title"),
        descriptionKey: this.s("next_json_schema_description"),
        url: "/reference/json-schema",
        onNavigate: () => this.navigate("/reference/json-schema"),
      },
    ];

    this.updateData({
      categoryCatalog: this.asCollection(catalog),
      nextReadLinks: this.asCollection(nextReads),
    });
  };

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`reference_attributes_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
