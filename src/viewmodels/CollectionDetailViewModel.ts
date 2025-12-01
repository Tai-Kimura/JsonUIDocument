import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface AttributeData {
  name: string;
  uikit: boolean;
  swiftui: boolean;
  compose: boolean;
  xml: boolean;
  type: string;
}

export class CollectionDetailViewModel {
  private router: AppRouterInstance;
  private _currentTab: number;
  private _setCurrentTab: (tab: number) => void;

  constructor(
    router: AppRouterInstance,
    currentTab: number,
    setCurrentTab: (tab: number) => void
  ) {
    this.router = router;
    this._currentTab = currentTab;
    this._setCurrentTab = setCurrentTab;
  }

  get currentTab(): number {
    return this._currentTab;
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };

  get collectionAttributes(): AttributeData[] {
    return [
      { name: "items", uikit: true, swiftui: true, compose: true, xml: false, type: "string" },
      { name: "sections", uikit: false, swiftui: true, compose: true, xml: false, type: "array" },
      { name: "horizontalScroll", uikit: true, swiftui: true, compose: true, xml: false, type: "boolean" },
      { name: "columnSpacing", uikit: true, swiftui: true, compose: true, xml: false, type: "float" },
      { name: "lineSpacing", uikit: true, swiftui: true, compose: true, xml: false, type: "float" },
      { name: "insets", uikit: true, swiftui: true, compose: true, xml: false, type: "array" },
      { name: "paging", uikit: true, swiftui: true, compose: true, xml: false, type: "boolean" },
      { name: "cellClasses", uikit: true, swiftui: false, compose: true, xml: false, type: "array" },
      { name: "headerClasses", uikit: true, swiftui: false, compose: true, xml: false, type: "array" }
    ];
  }
}
