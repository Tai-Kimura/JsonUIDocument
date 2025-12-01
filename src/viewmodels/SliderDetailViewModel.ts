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

export class SliderDetailViewModel {
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

  get sliderAttributes(): AttributeData[] {
    return [
      { name: "value", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float" },
      { name: "minimum", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float" },
      { name: "maximum", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float" },
      { name: "tintColor", uikit: true, swiftui: true, compose: true, xml: false, react: true, type: "string" },
      { name: "onValueChange", uikit: true, swiftui: true, compose: true, xml: false, react: true, type: "string" },
      { name: "enabled", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "boolean" },
      { name: "minimumValueImage", uikit: true, swiftui: false, compose: false, xml: false, react: false, type: "string" },
      { name: "maximumValueImage", uikit: true, swiftui: false, compose: false, xml: false, react: false, type: "string" }
    ];
  }
}
