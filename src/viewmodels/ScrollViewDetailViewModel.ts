import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface AttributeData {
  name: string;
  uikit: boolean;
  swiftui: boolean;
  compose: boolean;
  xml: boolean;
  react: boolean;
  type: string;
}

export class ScrollViewDetailViewModel {
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

  get scrollViewAttributes(): AttributeData[] {
    return [
      { name: "showsHorizontalScrollIndicator", uikit: true, swiftui: true, compose: true, xml: false, react: true, type: "boolean" },
      { name: "showsVerticalScrollIndicator", uikit: true, swiftui: true, compose: true, xml: false, react: true, type: "boolean" },
      { name: "paging", uikit: true, swiftui: true, compose: true, xml: false, react: true, type: "boolean" },
      { name: "bounces", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "boolean" },
      { name: "scrollEnabled", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "boolean" },
      { name: "contentInsetAdjustmentBehavior", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string" },
      { name: "keyboardDismissMode", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "string" },
      { name: "maxZoom", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "float" },
      { name: "minZoom", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "float" }
    ];
  }
}
