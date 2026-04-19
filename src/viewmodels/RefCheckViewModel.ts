import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import StringManager from "../generated/StringManager";
import { RefAttributeRowData } from "../generated/data/RefAttributeRowData";

export class RefCheckViewModel {
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
      checkAttributes: this.checkAttributes,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };


  get checkAttributes(): RefAttributeRowData[] {
    const Y = "✅";
    const N = "❌";
    const attrs = [
      { name: "label", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: Y, type: "string", description: StringManager.getString("ref_check_attr_label_desc") },
      { name: "src", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: N, type: "string", description: StringManager.getString("ref_check_attr_src_desc") },
      { name: "onSrc", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: N, type: "string", description: StringManager.getString("ref_check_attr_onsrc_desc") },
      { name: "checked", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "boolean | binding", description: StringManager.getString("ref_check_attr_checked_desc") },
      { name: "value", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: N, type: "any", description: StringManager.getString("ref_check_attr_value_desc") },
      { name: "onChange", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_check_attr_onchange_desc") },
      { name: "tintColor", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: N, type: "string | binding", description: StringManager.getString("ref_check_attr_tintcolor_desc") },
      { name: "enabled", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "boolean | binding", description: StringManager.getString("ref_check_attr_enabled_desc") }
    ];
    return attrs.map((attr, index) => ({
      ...attr,
      dividerVisibility: index < attrs.length - 1 ? "true" : undefined
    }));
  }
}
