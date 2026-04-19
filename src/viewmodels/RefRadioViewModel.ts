import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import StringManager from "../generated/StringManager";
import { RefAttributeRowData } from "../generated/data/RefAttributeRowData";

export class RefRadioViewModel {
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
      radioAttributes: this.radioAttributes,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };


  get radioAttributes(): RefAttributeRowData[] {
    const Y = "✅";
    const N = "❌";
    const attrs = [
      { name: "text", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: N, type: "string | binding", description: StringManager.getString("ref_radio_attr_text_desc") },
      { name: "group", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: N, type: "string", description: StringManager.getString("ref_radio_attr_group_desc") },
      { name: "checked", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: N, type: "boolean | binding", description: StringManager.getString("ref_radio_attr_checked_desc") },
      { name: "value", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: N, type: "any", description: StringManager.getString("ref_radio_attr_value_desc") },
      { name: "icon", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: N, type: "string", description: StringManager.getString("ref_radio_attr_icon_desc") },
      { name: "selected_icon", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: N, type: "string", description: StringManager.getString("ref_radio_attr_selectedicon_desc") },
      { name: "tintColor", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: N, type: "string | binding", description: StringManager.getString("ref_radio_attr_tintcolor_desc") },
      { name: "spacing", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: N, type: "number", description: StringManager.getString("ref_radio_attr_spacing_desc") },
      { name: "onclick", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: N, type: "string", description: StringManager.getString("ref_radio_attr_onclick_desc") },
      { name: "enabled", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: N, type: "boolean | binding", description: StringManager.getString("ref_radio_attr_enabled_desc") }
    ];
    return attrs.map((attr, index) => ({
      ...attr,
      dividerVisibility: index < attrs.length - 1 ? "true" : undefined
    }));
  }
}
