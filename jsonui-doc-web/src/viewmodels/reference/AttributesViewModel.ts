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

// Slug + display name only. Descriptions live in strings.json under
// reference_attributes.catalog_<slug>_description so localization is
// authored in one place. onAppear resolves them via this.s(). Keep
// descriptions short and roughly equal length (~50–80 ja chars,
// ~80–110 en chars) so the catalog grid renders visually balanced cards.
const CATEGORY_CATALOG: Array<{ slug: string; name: string }> = [
  { slug: "layout",     name: "Layout"     },
  { slug: "spacing",    name: "Spacing"    },
  { slug: "alignment",  name: "Alignment"  },
  { slug: "state",      name: "State"      },
  { slug: "binding",    name: "Binding"    },
  { slug: "event",      name: "Event"      },
  { slug: "style",      name: "Style"      },
  { slug: "responsive", name: "Responsive" },
  { slug: "misc",       name: "Misc"       },
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
        descriptionKey: this.s(`catalog_${c.slug}_description`),
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
