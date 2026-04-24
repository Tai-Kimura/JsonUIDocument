// ViewModel for Learn > Your first screen.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { FirstScreenData } from "@/generated/data/FirstScreenData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

interface TabHeaderCell {
  id: string;
  labelKey: string;
  bgColor: string;
  fgColor: string;
  borderColor: string;
  onSelect: () => void;
}

export class FirstScreenViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => FirstScreenData;
  protected _setData: (
    data: FirstScreenData | ((prev: FirstScreenData) => FirstScreenData),
  ) => void;

  private _activeCodeTab: string = "swift";

  get data(): FirstScreenData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => FirstScreenData,
    setData: (data: FirstScreenData | ((prev: FirstScreenData) => FirstScreenData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<FirstScreenData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<FirstScreenData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateLearn: () => this.navigate("/"),
    });
  };

  onAppear = () => {
    const nextReads: NextReadCell[] = [
      {
        id: "next_guides",
        titleKey: this.s("next_guides_title"),
        descriptionKey: this.s("next_guides_description"),
        url: "/guides/writing-your-first-spec",
        onNavigate: () => this.navigate("/guides/writing-your-first-spec"),
      },
      {
        id: "next_data_binding",
        titleKey: this.s("next_data_binding_title"),
        descriptionKey: this.s("next_data_binding_description"),
        url: "/learn/data-binding-basics",
        onNavigate: () => this.navigate("/learn/data-binding-basics"),
      },
    ];

    this.updateData({
      nextReadLinks: this.asCollection(nextReads),
      codeTabs: this.asCollection(this.buildCodeTabs(this._activeCodeTab)),
      ...this.panelVisibilityFor(this._activeCodeTab),
    });
  };

  /**
   * Switch the Swift / Kotlin / TypeScript tab under the ViewModel section.
   * Mirrors LearnHelloWorldViewModel.onSelectTab: update the private active
   * state, rebuild the tab cells so the new active tab picks up the accent
   * palette, and re-derive the three panel visibility strings.
   */
  onSelectCodeTab = (id: string): void => {
    this._activeCodeTab = id;
    this.updateData({
      codeTabs: this.asCollection(this.buildCodeTabs(id)),
      ...this.panelVisibilityFor(id),
    });
  };

  navigate = (url: string): void => {
    this.router.push(url);
  };

  private buildCodeTabs = (activeId: string): TabHeaderCell[] => {
    const make = (id: string, labelKey: string): TabHeaderCell => {
      const isActive = id === activeId;
      return {
        id,
        labelKey,
        bgColor: isActive ? "var(--color-accent)" : "var(--color-surface)",
        fgColor: isActive ? "var(--color-accent_ink)" : "var(--color-ink)",
        borderColor: isActive ? "var(--color-accent)" : "var(--color-border)",
        onSelect: () => this.onSelectCodeTab(id),
      };
    };
    return [
      make("swift", this.s("tab_swift")),
      make("kotlin", this.s("tab_kotlin")),
      make("typescript", this.s("tab_typescript")),
    ];
  };

  private panelVisibilityFor = (
    id: string,
  ): Pick<
    FirstScreenData,
    "swiftCodeVisibility" | "kotlinCodeVisibility" | "typescriptCodeVisibility"
  > => ({
    swiftCodeVisibility: id === "swift" ? "visible" : "gone",
    kotlinCodeVisibility: id === "kotlin" ? "visible" : "gone",
    typescriptCodeVisibility: id === "typescript" ? "visible" : "gone",
  });

  private s = (key: string): string =>
    StringManager.getString(`learn_first_screen_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
