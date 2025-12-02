import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import StringManager from "../generated/StringManager";

interface RefAttributeData {
  name: string;
  uikit: boolean;
  swiftui: boolean;
  compose: boolean;
  xml: boolean;
  react: boolean;
  type: string;
  description: string;
  isLast?: boolean;
}

export class RefIndicatorViewModel {
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

  get indicatorAttributes(): RefAttributeData[] {
    return [
      { name: "animating", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "boolean/string", description: StringManager.getString("ref_indicator_animating_desc") },
      { name: "indicatorStyle", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "string", description: StringManager.getString("ref_indicator_style_desc") },
      { name: "color", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_indicator_color_desc") },
      { name: "size", uikit: false, swiftui: false, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_indicator_attr_size_desc") },
      { name: "hidesWhenStopped", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "boolean", description: StringManager.getString("ref_indicator_hides_when_stopped_desc"), isLast: true }
    ];
  }
}
