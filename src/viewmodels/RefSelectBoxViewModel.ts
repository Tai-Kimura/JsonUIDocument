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

export class RefSelectBoxViewModel {
  private router: AppRouterInstance;
  private _currentTab: number;
  private _setCurrentTab: (tab: number) => void;

  constructor(
    router: AppRouterInstance,
    currentTab: number,
    setCurrentTab: (tab: number) => void) {
    this.router = router;
    this._currentTab = currentTab;
    this._setCurrentTab = setCurrentTab;
  }

  get currentTab(): number {
    return this._currentTab;
  }


  get data() {
    return {
      currentTab: this._currentTab,
      setCurrentTab: this._setCurrentTab,
      onTabChange: this.onTabChange,
      selectBoxAttributes: this.selectBoxAttributes,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };


  get selectBoxAttributes(): RefAttributeData[] {
    return [
      { name: "items", uikit: true, swiftui: true, compose: true, xml: false, react: true, type: "array", description: StringManager.getString("ref_select_box_attr_items_desc") },
      { name: "selectedIndex", uikit: true, swiftui: true, compose: true, xml: false, react: true, type: "integer/string", description: StringManager.getString("ref_select_box_attr_selectedindex_desc") },
      { name: "prompt", uikit: true, swiftui: true, compose: true, xml: false, react: true, type: "string", description: StringManager.getString("ref_select_box_attr_prompt_desc") },
      { name: "selectItemType", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string", description: StringManager.getString("ref_select_box_attr_selectitemtype_desc") },
      { name: "datePickerMode", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string", description: StringManager.getString("ref_select_box_attr_datepickermode_desc") },
      { name: "datePickerStyle", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string", description: StringManager.getString("ref_select_box_attr_datepickerstyle_desc") },
      { name: "dateStringFormat", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string", description: StringManager.getString("ref_select_box_attr_datestringformat_desc") },
      { name: "onValueChange", uikit: true, swiftui: true, compose: true, xml: false, react: true, type: "string", description: StringManager.getString("ref_select_box_attr_onvaluechange_desc") },
      { name: "enabled", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "boolean/string", description: StringManager.getString("ref_select_box_attr_enabled_desc"), isLast: true }
    ];
  }
}
