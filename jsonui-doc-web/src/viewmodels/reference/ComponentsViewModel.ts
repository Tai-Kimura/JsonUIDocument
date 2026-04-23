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

// Every component with a short one-line description. Descriptions are the
// English summaries authored in docs/data/attribute-overrides/<name>.json.
const COMPONENT_CATALOG: Array<{ kebab: string; name: string; description: string }> = [
  { kebab: "label",          name: "Label",          description: "Display component for single-line or multi-line text. Read-only." },
  { kebab: "icon-label",     name: "IconLabel",      description: "Label with a leading or trailing icon glyph." },
  { kebab: "button",         name: "Button",         description: "Interactive component that triggers a ViewModel event on tap." },
  { kebab: "text-field",     name: "TextField",      description: "Single-line text input with two-way binding." },
  { kebab: "text-view",      name: "TextView",       description: "Multi-line text input that grows with content." },
  { kebab: "edit-text",      name: "EditText",       description: "Android-flavored alias for TextField (XML compat)." },
  { kebab: "input",          name: "Input",          description: "Web-flavored alias for TextField mirroring HTML <input>." },
  { kebab: "view",           name: "View",           description: "Generic container that arranges children vertically or horizontally." },
  { kebab: "safe-area-view", name: "SafeAreaView",   description: "View that respects the host platform's safe area (notch, status bar)." },
  { kebab: "scroll-view",    name: "ScrollView",     description: "Scrollable container for content that may overflow the viewport." },
  { kebab: "collection",     name: "Collection",     description: "Virtualized list / grid bound to a dynamic array." },
  { kebab: "tab-view",       name: "TabView",        description: "Multi-page tab bar with one active child at a time." },
  { kebab: "select-box",     name: "SelectBox",      description: "Picker for one value from a list; date / time modes supported." },
  { kebab: "switch",         name: "Switch",         description: "Binary ON/OFF toggle with animated thumb." },
  { kebab: "toggle",         name: "Toggle",         description: "Alias for Switch with Android-style naming." },
  { kebab: "segment",        name: "Segment",        description: "Mutually exclusive horizontal button group (2–5 options)." },
  { kebab: "slider",         name: "Slider",         description: "Continuous numeric input over a min / max range." },
  { kebab: "radio",          name: "Radio",          description: "Single selection within a mutually exclusive group." },
  { kebab: "check-box",      name: "CheckBox",       description: "Binary or indeterminate checkbox for zero-or-more selections." },
  { kebab: "check",          name: "Check",          description: "Short alias for CheckBox." },
  { kebab: "progress",       name: "Progress",       description: "Linear or circular progress indicator (determinate)." },
  { kebab: "indicator",      name: "Indicator",      description: "Activity spinner for indefinite short-duration waits." },
  { kebab: "image",          name: "Image",          description: "Bundled / local image from the resource bundle." },
  { kebab: "network-image",  name: "NetworkImage",   description: "URL-loaded image with caching, placeholder, and error fallback." },
  { kebab: "gradient-view",  name: "GradientView",   description: "View with a linear gradient background (multi-stop)." },
  { kebab: "blur",           name: "Blur",           description: "Platform-native blur / backdrop filter for glass effects." },
  { kebab: "circle-view",    name: "CircleView",     description: "Circular container for avatars, badges, and status dots." },
  { kebab: "web",            name: "Web",            description: "Embedded web content via WKWebView / WebView / <iframe>." },
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
        descriptionKey: c.description,
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
