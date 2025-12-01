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

export class ButtonDetailViewModel {
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

  get buttonAttributes(): AttributeData[] {
    return [
      { name: "text", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string" },
      { name: "font", uikit: true, swiftui: true, compose: false, xml: true, react: true, type: "string" },
      { name: "fontSize", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float" },
      { name: "fontColor", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string" },
      { name: "tapBackground", uikit: true, swiftui: true, compose: false, xml: true, react: true, type: "string" },
      { name: "hilightColor", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string" },
      { name: "disabledFontColor", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string" },
      { name: "disabledBackground", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string" },
      { name: "enabled", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "boolean" },
      { name: "frame", uikit: true, swiftui: true, compose: true, xml: false, react: true, type: "dictionary" },
      { name: "image", uikit: true, swiftui: false, compose: false, xml: true, react: true, type: "string" },
      { name: "onclick", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string" }
    ];
  }
}
