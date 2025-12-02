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

export class RefSwitchViewModel {
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

  get switchAttributes(): RefAttributeData[] {
    return [
      { name: "on", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "boolean", description: StringManager.getString("ref_switch_attr_on_desc") },
      { name: "onChange", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "string", description: StringManager.getString("ref_switch_attr_onchange_desc") },
      { name: "onTintColor", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "string", description: StringManager.getString("ref_switch_attr_ontintcolor_desc") },
      { name: "thumbColor", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "string", description: StringManager.getString("ref_switch_attr_thumbcolor_desc"), isLast: true }
    ];
  }
}
