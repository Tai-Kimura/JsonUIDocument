import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import StringManager from "../generated/StringManager";
import { RefAttributeRowData } from "../generated/data/RefAttributeRowData";

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


  get selectBoxAttributes(): RefAttributeRowData[] {
    const Y = "✅";
    const N = "❌";
    const attrs = [
      { name: "items", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: Y, type: "array", description: StringManager.getString("ref_select_box_attr_items_desc") },
      { name: "selectedIndex", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: Y, type: "integer | binding", description: StringManager.getString("ref_select_box_attr_selectedindex_desc") },
      { name: "prompt", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: Y, type: "string", description: StringManager.getString("ref_select_box_attr_prompt_desc") },
      { name: "selectItemType", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: N, type: "string", description: StringManager.getString("ref_select_box_attr_selectitemtype_desc") },
      { name: "datePickerMode", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: N, type: "string", description: StringManager.getString("ref_select_box_attr_datepickermode_desc") },
      { name: "datePickerStyle", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: N, type: "string", description: StringManager.getString("ref_select_box_attr_datepickerstyle_desc") },
      { name: "dateStringFormat", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: N, type: "string", description: StringManager.getString("ref_select_box_attr_datestringformat_desc") },
      { name: "onValueChange", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: Y, type: "string", description: StringManager.getString("ref_select_box_attr_onvaluechange_desc") },
      { name: "enabled", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "boolean | binding", description: StringManager.getString("ref_select_box_attr_enabled_desc") }
    ];
    return attrs.map((attr, index) => ({
      ...attr,
      dividerVisibility: index < attrs.length - 1 ? "true" : undefined
    }));
  }
}
