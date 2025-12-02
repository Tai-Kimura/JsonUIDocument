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

export class RefCheckViewModel {
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

  get checkAttributes(): RefAttributeData[] {
    return [
      { name: "label", uikit: true, swiftui: true, compose: true, xml: false, react: true, type: "string", description: StringManager.getString("ref_check_attr_label_desc") },
      { name: "src", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string", description: StringManager.getString("ref_check_attr_src_desc") },
      { name: "onSrc", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string", description: StringManager.getString("ref_check_attr_onsrc_desc") },
      { name: "checked", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "boolean/string", description: StringManager.getString("ref_check_attr_checked_desc") },
      { name: "value", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "any", description: StringManager.getString("ref_check_attr_value_desc") },
      { name: "onclick", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string", description: StringManager.getString("ref_check_attr_onclick_desc") },
      { name: "tintColor", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string", description: StringManager.getString("ref_check_attr_tintcolor_desc") },
      { name: "enabled", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "boolean/string", description: StringManager.getString("ref_check_attr_enabled_desc"), isLast: true }
    ];
  }
}
