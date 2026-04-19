import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import StringManager from "../generated/StringManager";
import { RefAttributeRowData } from "../generated/data/RefAttributeRowData";

export class RefSwitchViewModel {
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
      switchAttributes: this.switchAttributes,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };


  get switchAttributes(): RefAttributeRowData[] {
    const Y = "✅";
    const N = "❌";
    const attrs = [
      { name: "on", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "boolean | binding", description: StringManager.getString("ref_switch_attr_on_desc") },
      { name: "onChange", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_switch_attr_onchange_desc") },
      { name: "onTintColor", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string | binding", description: StringManager.getString("ref_switch_attr_ontintcolor_desc") },
      { name: "offTintColor", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string | binding", description: StringManager.getString("ref_switch_attr_offtintcolor_desc") },
      { name: "label", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: Y, type: "string", description: StringManager.getString("ref_switch_attr_label_desc") },
      { name: "enabled", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "boolean | binding", description: StringManager.getString("ref_switch_attr_enabled_desc") },
      { name: "thumbColor", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: N, type: "string | binding", description: StringManager.getString("ref_switch_attr_thumbcolor_desc") }
    ];
    return attrs.map((attr, index) => ({
      ...attr,
      dividerVisibility: index < attrs.length - 1 ? "true" : undefined
    }));
  }
}
