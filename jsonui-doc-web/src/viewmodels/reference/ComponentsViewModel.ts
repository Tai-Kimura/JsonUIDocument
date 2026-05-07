// ViewModel for Reference > Component reference (index).
// Seeds a catalog of all 28 components with one-line descriptions + links to
// the corresponding detail page at /reference/components/<kebab>.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ComponentsData } from "@/generated/data/ComponentsData";
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

// Every component with a short one-line description. Descriptions mirror the
// `description.{en,ja}` authored in docs/data/attribute-overrides/<name>.json.
// `onAppear` resolves localized descriptions via this.s() so the catalog
// cards respect the topbar's language toggle.
// Slug + display name only. Localized descriptions live in strings.json
// under reference_components.catalog_<kebab>_description so the catalog,
// the language toggle, and any future locales share a single source of
// truth. Keep descriptions short and roughly equal length so the catalog
// grid renders visually balanced cards.
const COMPONENT_CATALOG: Array<{ kebab: string; name: string }> = [
  { kebab: "label",          name: "Label"          },
  { kebab: "icon-label",     name: "IconLabel"      },
  { kebab: "button",         name: "Button"         },
  { kebab: "text-field",     name: "TextField"      },
  { kebab: "text-view",      name: "TextView"       },
  { kebab: "edit-text",      name: "EditText"       },
  { kebab: "input",          name: "Input"          },
  { kebab: "view",           name: "View"           },
  { kebab: "safe-area-view", name: "SafeAreaView"   },
  { kebab: "scroll-view",    name: "ScrollView"     },
  { kebab: "collection",     name: "Collection"     },
  { kebab: "tab-view",       name: "TabView"        },
  { kebab: "select-box",     name: "SelectBox"      },
  { kebab: "switch",         name: "Switch"         },
  { kebab: "toggle",         name: "Toggle"         },
  { kebab: "segment",        name: "Segment"        },
  { kebab: "slider",         name: "Slider"         },
  { kebab: "radio",          name: "Radio"          },
  { kebab: "check-box",      name: "CheckBox"       },
  { kebab: "check",          name: "Check"          },
  { kebab: "progress",       name: "Progress"       },
  { kebab: "indicator",      name: "Indicator"      },
  { kebab: "image",          name: "Image"          },
  { kebab: "network-image",  name: "NetworkImage"   },
  { kebab: "gradient-view",  name: "GradientView"   },
  { kebab: "blur",           name: "Blur"           },
  { kebab: "circle-view",    name: "CircleView"     },
  { kebab: "web",            name: "Web"            },
];

export class ComponentsViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => ComponentsData;
  protected _setData: (
    data: ComponentsData | ((prev: ComponentsData) => ComponentsData),
  ) => void;

  get data(): ComponentsData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => ComponentsData,
    setData: (data: ComponentsData | ((prev: ComponentsData) => ComponentsData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<ComponentsData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<ComponentsData>) => { this.updateData(vars); };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateReference: () => this.navigate("/"),
    });
  };

  onAppear = () => {
    const catalog: CatalogCell[] = COMPONENT_CATALOG.map((c) => {
      const url = `/reference/components/${c.kebab}`;
      return {
        id: `cat_${c.kebab.replace(/-/g, "_")}`,
        titleKey: c.name,
        descriptionKey: this.s(`catalog_${c.kebab}_description`),
        url,
        onNavigate: () => this.navigate(url),
      };
    });

    const nextReads: NextReadCell[] = [
      {
        id: "next_attributes",
        titleKey: this.s("next_attributes_title"),
        descriptionKey: this.s("next_attributes_description"),
        url: "/reference/attributes",
        onNavigate: () => this.navigate("/reference/attributes"),
      },
      {
        id: "next_custom_components",
        titleKey: this.s("next_custom_components_title"),
        descriptionKey: this.s("next_custom_components_description"),
        url: "/guides/custom-components",
        onNavigate: () => this.navigate("/guides/custom-components"),
      },
    ];

    this.updateData({
      componentCatalog: this.asCollection(catalog),
      nextReadLinks: this.asCollection(nextReads),
    });
  };

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`reference_components_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
